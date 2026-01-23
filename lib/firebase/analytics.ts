/**
 * Firebase Client SDK — Analytics Integration
 * 
 * Initializes Firebase App and Analytics on the client side.
 * This enables GA4 data collection via Firebase SDK.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent, isSupported, type Analytics } from 'firebase/analytics';

// Firebase config (same as firebase-config.js)
const firebaseConfig = {
    apiKey: "AIzaSyCqTiexOTxz7yp0PdSttvQmTAJzQdZMI-Y",
    authDomain: "aura-mebel-7ec96.firebaseapp.com",
    projectId: "aura-mebel-7ec96",
    storageBucket: "aura-mebel-7ec96.appspot.com",
    messagingSenderId: "149768023865",
    appId: "1:149768023865:web:7e9fbd950241375d6a02e8",
    measurementId: "G-5YG8EC89CY"
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let analyticsInitPromise: Promise<Analytics | null> | null = null;

/**
 * Initialize Firebase App (singleton)
 */
function getFirebaseApp(): FirebaseApp {
    if (app) return app;

    // Check if already initialized (e.g. by another module)
    if (getApps().length > 0) {
        app = getApp();
    } else {
        app = initializeApp(firebaseConfig);
    }

    return app;
}

/**
 * Initialize Analytics (async, checks support)
 * Only runs on client side.
 */
async function initAnalytics(): Promise<Analytics | null> {
    if (typeof window === 'undefined') return null;
    if (analytics) return analytics;

    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('[Firebase Analytics] Not supported in this environment');
            return null;
        }

        const firebaseApp = getFirebaseApp();
        analytics = getAnalytics(firebaseApp);
        console.log('[Firebase Analytics] Initialized successfully');
        return analytics;
    } catch (e) {
        console.error('[Firebase Analytics] Failed to initialize:', e);
        return null;
    }
}

/**
 * Get Analytics instance (lazy init)
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
    if (analytics) return analytics;

    if (!analyticsInitPromise) {
        analyticsInitPromise = initAnalytics();
    }

    return analyticsInitPromise;
}

/**
 * Log event to Firebase Analytics / GA4
 * 
 * @param eventName - Event name (GA4 format, e.g. 'view_item', 'select_content')
 * @param eventParams - Optional parameters
 */
export async function logAnalyticsEvent(
    eventName: string,
    eventParams?: Record<string, any>
): Promise<void> {
    const analyticsInstance = await getFirebaseAnalytics();

    if (!analyticsInstance) {
        console.debug('[Firebase Analytics] Skipped event (not initialized):', eventName);
        return;
    }

    try {
        firebaseLogEvent(analyticsInstance, eventName, eventParams);
        console.debug('[Firebase Analytics] Event logged:', eventName, eventParams);
    } catch (e) {
        console.warn('[Firebase Analytics] Failed to log event:', eventName, e);
    }
}

/**
 * Log page view event
 */
export async function logPageView(pagePath: string, pageTitle?: string): Promise<void> {
    await logAnalyticsEvent('page_view', {
        page_path: pagePath,
        page_title: pageTitle,
    });
}

/**
 * Log AR-specific events (mapped to GA4 format)
 */
export async function logAREvent(
    type: 'start' | 'place' | 'finish' | 'fallback',
    objectId?: string,
    durationSec?: number
): Promise<void> {
    const eventNames: Record<string, string> = {
        start: 'ar_session_start',
        place: 'ar_object_placed',
        finish: 'ar_session_end',
        fallback: 'ar_fallback_used',
    };

    await logAnalyticsEvent(eventNames[type] || `ar_${type}`, {
        object_id: objectId,
        duration_sec: durationSec,
    });
}
