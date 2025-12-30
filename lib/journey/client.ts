import type { JourneyEventInput, JourneyMeta } from './eventTypes';
import { inferDevice, inferOs } from './userAgent';
import { getAuth } from 'firebase/auth';

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
      body: JSON.stringify({}),
      keepalive: true,
    });
  } catch {
  }
}

export function trackJourneyEvent(input: JourneyEventInput): void {
  if (!isBrowser() || shouldSkipTracking()) return;

  const payload: JourneyEventInput = {
    ...input,
    meta: {
      platform: defaultPlatform(),
      ...(input.meta || {}),
    },
  };

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
