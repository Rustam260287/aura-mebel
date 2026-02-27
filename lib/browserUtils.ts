export type BrowserEnv = {
    platform: 'android' | 'ios' | 'desktop';
    isInApp: boolean;
    isSafari: boolean;
    requiresExternalBrowser: boolean;
};

export const getBrowserEnvironment = (): BrowserEnv => {
    if (typeof window === 'undefined') {
        return { platform: 'desktop', isInApp: false, isSafari: false, requiresExternalBrowser: false };
    }

    const ua = window.navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const platform = isAndroid ? 'android' : isIOS ? 'ios' : 'desktop';

    const isTelegram = /Telegram|TelegramBot/i.test(ua);
    const isVK = /VK|vkontakte/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua);
    const isTikTok = /TikTok|musical_ly/i.test(ua);
    const isYandexApp = /YaApp_Android|YaApp_iOS|YaSearchBrowser|YandexSearch|YandexMobile/i.test(ua);
    const isAndroidWebView = isAndroid && /; wv\)/i.test(ua);

    const isInApp = Boolean(
        isTelegram ||
        isVK ||
        isInstagram ||
        isFacebook ||
        isTikTok ||
        isYandexApp ||
        isAndroidWebView
    );

    const isSafari = Boolean(
        isIOS &&
        /Safari/i.test(ua) &&
        !/CriOS|FxiOS|EdgiOS|YaBrowser|OPiOS|DuckDuckGo/i.test(ua)
    );

    const requiresExternalBrowser = Boolean(
        (platform === 'android' && isInApp) ||
        (platform === 'ios' && !isSafari)
    );

    return { platform, isInApp, isSafari, requiresExternalBrowser };
};

export const openInChromeAndroid = (): 'redirected' | 'manual_needed' => {
    if (typeof window === 'undefined') return 'redirected';

    const url = window.location.href;
    const ua = window.navigator.userAgent;
    const isYandexApp = /YaApp_Android|YaApp_iOS|YaSearchBrowser|YandexSearch|YandexMobile/i.test(ua);

    try {
        navigator.clipboard.writeText(url);
    } catch { }

    if (isYandexApp) {
        return 'manual_needed';
    }

    const strippedUrl = url.replace(/^https?:\/\//, '');
    const intent = `intent://${strippedUrl}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end`;

    try {
        const tempLink = document.createElement('a');
        tempLink.href = intent;
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        setTimeout(() => document.body.removeChild(tempLink), 100);

        setTimeout(() => {
            window.location.href = intent;
        }, 50);
    } catch { }

    return isYandexApp ? 'manual_needed' : 'redirected';
};

export const openInSafari = () => {
    if (typeof window === 'undefined') return;
    window.location.href = window.location.href;
};
