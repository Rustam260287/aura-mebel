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

    console.log('[Browser] openInChromeAndroid called, UA:', ua.substring(0, 100));

    // Yandex Browser blocks intent:// completely - need manual action
    if (isYandex) {
        console.log('[Browser] Yandex detected - intent blocked, copying URL to clipboard');
        try {
            navigator.clipboard.writeText(url);
        } catch {
            // Clipboard might fail silently
        }
        return 'manual_needed';
    }

    // For other In-App browsers (Telegram, VK, etc), try intent
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
