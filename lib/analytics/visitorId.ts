/**
 * Visitor ID — Persistent device identification for analytics
 * 
 * Generates a unique visitor fingerprint combining:
 * - Persistent UUID (localStorage with cookie fallback)
 * - Device characteristics (screen, timezone, platform)
 */

const VISITOR_ID_KEY = 'aura_vid';
const VISITOR_ID_COOKIE = 'aura_vid';
const UNIQUE_VISIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Simple UUID v4 generator
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Get or create persistent visitor ID
export function getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return '';

    // Try localStorage first
    try {
        const stored = localStorage.getItem(VISITOR_ID_KEY);
        if (stored) return stored;

        const newId = generateUUID();
        localStorage.setItem(VISITOR_ID_KEY, newId);
        return newId;
    } catch {
        // localStorage unavailable, try cookie
    }

    // Fallback to cookie
    try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === VISITOR_ID_COOKIE && value) return value;
        }

        const newId = generateUUID();
        // Set cookie with 1 year expiry
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${VISITOR_ID_COOKIE}=${newId}; expires=${expires}; path=/; SameSite=Lax`;
        return newId;
    } catch {
        // Cookie also unavailable, generate ephemeral ID
        return generateUUID();
    }
}

// Get screen resolution as string
function getScreenResolution(): string {
    if (typeof window === 'undefined') return 'unknown';
    return `${window.screen?.width || 0}x${window.screen?.height || 0}`;
}

// Get timezone offset
function getTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
    } catch {
        return `UTC${new Date().getTimezoneOffset()}`;
    }
}

// Get platform
function getPlatform(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    return navigator.platform || navigator.userAgent.slice(0, 50) || 'unknown';
}

// Simple hash function for fingerprinting
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

export interface VisitorFingerprint {
    visitorId: string;
    screenRes: string;
    timezone: string;
    platform: string;
    fingerprintHash: string;
}

// Get complete visitor fingerprint
export function getVisitorFingerprint(): VisitorFingerprint {
    const visitorId = getOrCreateVisitorId();
    const screenRes = getScreenResolution();
    const timezone = getTimezone();
    const platform = getPlatform();

    // Create fingerprint hash from device characteristics
    const fingerprintHash = simpleHash(`${screenRes}|${timezone}|${platform}|${visitorId}`);

    return {
        visitorId,
        screenRes,
        timezone,
        platform,
        fingerprintHash,
    };
}

// Check if this is a unique visit (first in 24h window)
const LAST_VISIT_KEY = 'aura_last_visit';

export function isUniqueVisit(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const now = Date.now();

        if (lastVisit) {
            const lastTime = parseInt(lastVisit, 10);
            if (now - lastTime < UNIQUE_VISIT_WINDOW_MS) {
                return false; // Not unique, within 24h window
            }
        }

        localStorage.setItem(LAST_VISIT_KEY, now.toString());
        return true;
    } catch {
        return true; // Assume unique if storage unavailable
    }
}

// Store object-specific last visit time
const OBJECT_VISIT_PREFIX = 'aura_obj_visit_';

export function isUniqueObjectVisit(objectId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const key = `${OBJECT_VISIT_PREFIX}${objectId}`;
        const lastVisit = localStorage.getItem(key);
        const now = Date.now();

        if (lastVisit) {
            const lastTime = parseInt(lastVisit, 10);
            if (now - lastTime < UNIQUE_VISIT_WINDOW_MS) {
                return false;
            }
        }

        localStorage.setItem(key, now.toString());
        return true;
    } catch {
        return true;
    }
}
