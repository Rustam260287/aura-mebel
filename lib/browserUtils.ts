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
    const isTelegram = /Telegram|TelegramBot/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isVK = /VK|vkontakte/i.test(ua);
    const isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua);
    const isTikTok = /TikTok|musical_ly/i.test(ua);

    // Generic WebView detection for Android
    // Android WebView UA includes "wv" in parentheses, e.g. "(wv)"
    // This catches Telegram and other in-app browsers that don't identify themselves
    const isAndroidWebView = isAndroid && /; wv\)/i.test(ua);

    const isInApp = isTelegram || isInstagram || isVK || isFacebook || isTikTok || isAndroidWebView;

    // Browser detection
    const isYandex = /YaBrowser|Yowser/i.test(ua);

    let browser: BrowserEnv['browser'] = 'other';
    if (isYandex) browser = 'yandex';
    else if (isTelegram) browser = 'telegram';
    else if (isInstagram) browser = 'instagram';
    else if (isVK) browser = 'vk';
    else if (isFacebook) browser = 'facebook';
    else if (isTikTok) browser = 'tiktok';
    else if (isAndroid && /Chrome/i.test(ua) && !isAndroidWebView) browser = 'chrome';
    else if (isIOS && /Safari/i.test(ua)) browser = 'safari';

    // Support logic:
    // Android: Yandex & In-Apps (including WebView) are NOT supported for WebXR/AR
    // iOS: In-Apps often block AR Quick Look or have issues
    let isSupported = true;
    if (platform === 'android') {
        if (isYandex || isInApp) isSupported = false;
    } else if (platform === 'ios') {
        if (isInApp) isSupported = false;
    }

    const requiresExternalBrowser = !isSupported && (platform === 'android' || platform === 'ios');

    // Debug logging
    console.log('[BrowserEnv]', { platform, browser, isInApp, isSupported, requiresExternalBrowser, isAndroidWebView, ua: ua.substring(0, 150) });

    return { platform, browser, isInApp, isSupported, requiresExternalBrowser };
};

export const openInChromeAndroid = (): 'redirected' | 'manual_needed' => {
    if (typeof window === 'undefined') return 'redirected';

    const url = window.location.href;
    const ua = window.navigator.userAgent;
    const isYandex = /YaBrowser|Yowser/i.test(ua);

    // Check if this looks like an in-app browser (WebView)
    const isAndroidWebView = /; wv\)/i.test(ua);
    const isKnownInApp = /Telegram|Instagram|VK|FBAN|FBAV|TikTok/i.test(ua);
    const isInApp = isYandex || isAndroidWebView || isKnownInApp;

    console.log('[Browser] openInChromeAndroid called, isInApp:', isInApp, 'UA:', ua.substring(0, 120));

    // For ALL in-app browsers: copy URL first (as backup), then try intent
    if (isInApp) {
        // Always copy URL to clipboard as backup
        try {
            navigator.clipboard.writeText(url);
            console.log('[Browser] URL copied to clipboard');
        } catch {
            console.log('[Browser] Clipboard copy failed');
        }

        // Yandex blocks intent:// completely - don't even try
        if (isYandex) {
            console.log('[Browser] Yandex detected - skipping intent');
            return 'manual_needed';
        }

        // For Telegram/VK/Instagram: try intent but still return manual_needed
        // because we don't know if it will work
        const hostPath = url.replace(/^https?:\/\//, '');
        const scheme = window.location.protocol.replace(':', '');
        const intent = `intent://${hostPath}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;

        console.log('[Browser] Trying intent redirect...');
        try {
            window.location.href = intent;
        } catch {
            console.log('[Browser] Intent failed');
        }

        // Return manual_needed so we show instructions (in case intent fails)
        return 'manual_needed';
    }

    // For regular Chrome (not in WebView) - shouldn't reach here normally
    // but just in case, try intent
    const hostPath = url.replace(/^https?:\/\//, '');
    const scheme = window.location.protocol.replace(':', '');
    const intent = `intent://${hostPath}#Intent;scheme=${scheme};package=com.android.chrome;end`;

    try {
        window.location.href = intent;
    } catch { }

    return 'redirected';
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
