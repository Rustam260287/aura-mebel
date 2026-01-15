export type BrowserEnv = {
    platform: 'android' | 'ios' | 'desktop';
    browser: 'chrome' | 'safari' | 'yandex' | 'telegram' | 'instagram' | 'vk' | 'facebook' | 'tiktok' | 'other';
    isInApp: boolean;
    isSupported: boolean;
    requiresExternalBrowser: boolean;
};

export const getBrowserEnvironment = (): BrowserEnv => {
    if (typeof window === 'undefined') {
        return {
            platform: 'desktop',
            browser: 'other',
            isInApp: false,
            isSupported: true,
            requiresExternalBrowser: false
        };
    }

    const ua = window.navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const platform = isAndroid ? 'android' : isIOS ? 'ios' : 'desktop';

    // In-App detection
    const isTelegram = /Telegram/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isVK = /VK/i.test(ua);
    const isFacebook = /FBAN|FBAV/i.test(ua);
    const isTikTok = /TikTok/i.test(ua);

    const isInApp = isTelegram || isInstagram || isVK || isFacebook || isTikTok;

    // Browser detection
    const isYandex = /YaBrowser|Yowser/i.test(ua);

    let browser: BrowserEnv['browser'] = 'other';
    if (isYandex) browser = 'yandex';
    else if (isTelegram) browser = 'telegram';
    else if (isInstagram) browser = 'instagram';
    else if (isVK) browser = 'vk';
    else if (isFacebook) browser = 'facebook';
    else if (isTikTok) browser = 'tiktok';
    else if (isAndroid && /Chrome/i.test(ua)) browser = 'chrome';
    else if (isIOS && /Safari/i.test(ua)) browser = 'safari';

    // Support logic:
    // Android: Yandex & In-Apps are NOT supported for WebXR/AR
    // iOS: In-Apps often block AR Quick Look or have issues
    // Desktop: Generally supported for 3D, AR not applicable usually but we assume supported for view

    let isSupported = true;
    if (platform === 'android') {
        if (isYandex || isInApp) isSupported = false;
    } else if (platform === 'ios') {
        if (isInApp) isSupported = false;
    }

    const requiresExternalBrowser = !isSupported && (platform === 'android' || platform === 'ios');

    return { platform, browser, isInApp, isSupported, requiresExternalBrowser };
};

export const openInChromeAndroid = () => {
    if (typeof window === 'undefined') return;

    // Construct Intent URL
    const scheme = window.location.protocol.replace(':', '');
    const hostPath = window.location.href.replace(/^https?:\/\//, '');

    // Explicitly target Chrome on Android
    const intent = `intent://${hostPath}#Intent;scheme=${scheme};package=com.android.chrome;end`;

    console.log('[Browser] Redirecting Android -> Chrome:', intent);
    window.location.href = intent;
};

export const openInSafari = () => {
    if (typeof window === 'undefined') return;
    // iOS doesn't allow explicit app targeting via scheme for Safari easily without custom URL schemes
    // But window.open usually breaks out of some in-app browsers or prompts the user
    window.open(window.location.href, '_blank');
};

// Legacy exports for backward compatibility if needed, but prefer getBrowserEnvironment
export const isYandexBrowser = (): boolean => getBrowserEnvironment().browser === 'yandex';
export const isAndroid = (): boolean => getBrowserEnvironment().platform === 'android';
