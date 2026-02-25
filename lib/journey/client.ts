import type { JourneyEventInput, JourneyMeta } from './eventTypes';
import { inferDevice, inferOs } from './userAgent';
import { getAuth } from 'firebase/auth';
import { getOrCreateVisitorId, isUniqueObjectVisit } from '../analytics/visitorId';
import { logAnalyticsEvent } from '../firebase/analytics';

const isBrowser = () => typeof window !== 'undefined';

function shouldSkipTracking(): boolean {
  if (!isBrowser()) return true;
  const path = window.location?.pathname || '';
  if (path.startsWith('/admin') || path.startsWith('/login')) return true;
  try {
    if (getAuth().currentUser) return true;
  } catch {
  }
  return false;
}

function defaultPlatform(): JourneyMeta['platform'] {
  if (!isBrowser()) return 'web';
  const os = inferOs(navigator.userAgent);
  if (os === 'ios') return 'ios';
  if (os === 'android') return 'android';
  return 'web';
}

export async function pingVisitor(): Promise<void> {
  if (!isBrowser() || shouldSkipTracking()) return;
  try {
    await fetch('/api/journey/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: getOrCreateVisitorId() }),
      keepalive: true,
    });
  } catch {
  }
}

export function trackJourneyEvent(input: JourneyEventInput): void {
  if (!isBrowser() || shouldSkipTracking()) return;

  const visitorId = getOrCreateVisitorId();
  const isUnique = input.objectId ? isUniqueObjectVisit(input.objectId) : false;

  const payload: JourneyEventInput = {
    ...input,
    meta: {
      platform: defaultPlatform(),
      ...(input.meta || {}),
      visitorId,
      isUniqueVisit: isUnique,
    } as JourneyMeta,
  };

  // Mirror to Firebase Analytics (Fire and forget)
  void logAnalyticsEvent(input.type, {
    object_id: input.objectId,
    ...input.meta,
  });


  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/journey/event', blob);
      return;
    }

    void fetch('/api/journey/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
  }
}

export function getLocalDeviceInfo(): { device: 'mobile' | 'desktop'; os: 'ios' | 'android' | 'other' } | null {
  if (!isBrowser()) return null;
  return {
    device: inferDevice(navigator.userAgent),
    os: inferOs(navigator.userAgent),
  };
}

// ==================== VIEW TIME TRACKING ====================

interface ViewSession {
  objectId: string;
  startTime: number;
  accumulatedMs: number;
  isActive: boolean;
  lastActiveTime: number;
}

const activeViewSessions = new Map<string, ViewSession>();
let visibilityListenerAdded = false;

function handleVisibilityChange(): void {
  const isHidden = document.hidden;
  const now = Date.now();

  activeViewSessions.forEach((session) => {
    if (isHidden && session.isActive) {
      // Pause: accumulate time
      session.accumulatedMs += now - session.lastActiveTime;
      session.isActive = false;
    } else if (!isHidden && !session.isActive) {
      // Resume
      session.lastActiveTime = now;
      session.isActive = true;
    }
  });
}

function ensureVisibilityListener(): void {
  if (!isBrowser() || visibilityListenerAdded) return;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', () => handleVisibilityChange());
  window.addEventListener('focus', () => {
    // Re-activate all sessions on focus
    const now = Date.now();
    activeViewSessions.forEach((session) => {
      if (!session.isActive) {
        session.lastActiveTime = now;
        session.isActive = true;
      }
    });
  });
  visibilityListenerAdded = true;
}

/**
 * Start tracking view time for an object.
 * Call this when user opens object detail page.
 */
export function startViewTimer(objectId: string): void {
  if (!isBrowser() || shouldSkipTracking()) return;
  ensureVisibilityListener();

  if (activeViewSessions.has(objectId)) return; // Already tracking

  const now = Date.now();
  activeViewSessions.set(objectId, {
    objectId,
    startTime: now,
    accumulatedMs: 0,
    isActive: !document.hidden,
    lastActiveTime: now,
  });
}

/**
 * Stop tracking and send accumulated view time.
 * Call this when user leaves object detail page.
 */
export function stopViewTimer(objectId: string): void {
  if (!isBrowser()) return;

  const session = activeViewSessions.get(objectId);
  if (!session) return;

  // Finalize time
  if (session.isActive) {
    session.accumulatedMs += Date.now() - session.lastActiveTime;
  }

  const viewTimeSec = Math.round(session.accumulatedMs / 1000);

  // Send view time event if meaningful (> 1 second)
  if (viewTimeSec > 1) {
    trackJourneyEvent({
      type: 'VIEW_OBJECT',
      objectId,
      meta: {
        durationSec: viewTimeSec,
        viewTimeMs: session.accumulatedMs,
      } as JourneyMeta,
    });
  }

  activeViewSessions.delete(objectId);
}

/**
 * Get current view time for an object (for display purposes)
 */
export function getCurrentViewTime(objectId: string): number {
  const session = activeViewSessions.get(objectId);
  if (!session) return 0;

  let total = session.accumulatedMs;
  if (session.isActive) {
    total += Date.now() - session.lastActiveTime;
  }
  return total;
}
