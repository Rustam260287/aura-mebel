/**
 * SceneARViewer v2 — Platform Detection
 * 
 * Philosophy:
 * - Android only (iOS uses Quick Look)
 * - WebXR only (immersive-ar)
 * - Never used in In-App browsers (instability risk)
 */

export interface PlatformInfo {
    isIOS: boolean;
    isAndroid: boolean;
    hasWebXR: boolean;
    isSupportedBrowser: boolean;
}

/**
 * Detect current platform capabilities
 */
export function detectPlatform(): PlatformInfo {
    if (typeof navigator === 'undefined') {
        return { isIOS: false, isAndroid: false, hasWebXR: false, isSupportedBrowser: false };
    }

    const ua = navigator.userAgent;

    const isIOS =
        /iPhone|iPad|iPod/i.test(ua) ||
        (ua.includes('Macintosh') && (navigator as any).maxTouchPoints > 1);

    const isAndroid = /Android/i.test(ua);

    const hasWebXR = 'xr' in navigator;

    // Chrome/Chromium on Android is primary target
    const isChrome = /Chrome/i.test(ua) && !/Edge|OPR|Samsung/i.test(ua);
    const isSamsungInternet = /SamsungBrowser/i.test(ua);
    const isSupportedBrowser = isAndroid && (isChrome || isSamsungInternet);

    return { isIOS, isAndroid, hasWebXR, isSupportedBrowser };
}

/**
 * Check if SceneARViewer v2 should be used
 */
export function shouldUseSceneARV2(): boolean {
    const platform = detectPlatform();

    // Only for Android with WebXR support
    // Also check for supported browser (Chrome/Samsung) to avoid unstable WebView implementations
    if (!platform.isAndroid || !platform.hasWebXR || !platform.isSupportedBrowser) {
        return false;
    }

    // Feature flag check
    if (typeof localStorage !== 'undefined') {
        const flagValue = localStorage.getItem('ar_v2_enabled');
        // Default to true for now (can change for gradual rollout)
        if (flagValue === 'false') return false;
    }

    return true;
}

/**
 * Check WebXR immersive-ar support asynchronously
 */
export async function checkWebXRSupport(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;

    const xr = (navigator as any).xr;
    if (!xr || typeof xr.isSessionSupported !== 'function') {
        return false;
    }

    try {
        return await xr.isSessionSupported('immersive-ar');
    } catch {
        return false;
    }
}
