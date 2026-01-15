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

    // In-App detection (expanded patterns)
    // Telegram: sometimes appears as TelegramBot or uses Android WebView without clear indicator
    const isTelegram = /Telegram|TelegramBot/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isVK = /VK|vkontakte/i.test(ua);
    const isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua);
    const isTikTok = /TikTok|musical_ly/i.test(ua);

    // Generic WebView detection (Android uses "wv" flag in Chrome WebView)
    const isGenericWebView = /wv\)|WebView/i.test(ua) && !/Chrome\/\d+/.test(ua);

    const isInApp = isTelegram || isInstagram || isVK || isFacebook || isTikTok || isGenericWebView;

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

    const url = window.location.href;
    const ua = window.navigator.userAgent;
    const isYandex = /YaBrowser|Yowser/i.test(ua);
    const isTelegram = /Telegram|TelegramBot/i.test(ua);

    console.log('[Browser] openInChromeAndroid called, UA:', ua.substring(0, 100));

    // For Yandex and Telegram - use location.replace (not blocked as popup)
    if (isYandex || isTelegram) {
        console.log('[Browser] Yandex/Telegram detected, using location.replace');
        // Try to open in Chrome via intent first
        const hostPath = url.replace(/^https?:\/\//, '');
        const scheme = window.location.protocol.replace(':', '');
        const intent = `intent://${hostPath}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;

        try {
            window.location.replace(intent);
        } catch {
            // Fallback: just try opening the URL
            window.location.href = url;
        }
        return;
    }

    // For other In-App browsers, try intent with fallback URL
    const hostPath = url.replace(/^https?:\/\//, '');
    const scheme = window.location.protocol.replace(':', '');
    const intent = `intent://${hostPath}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;

    console.log('[Browser] Redirecting Android -> Chrome via intent:', intent);

    try {
        window.location.href = intent;
    } catch { }

    // Fallback if intent fails
    setTimeout(() => {
        try {
            window.location.replace(url);
        } catch {
            window.open(url, '_blank');
        }
    }, 500);
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
