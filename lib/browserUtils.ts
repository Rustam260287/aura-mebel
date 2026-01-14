export const isYandexBrowser = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    // 'YaBrowser' -> desktop/mobile Yandex Browser
    // 'Yowser' -> older/mobile versions of Yandex Browser
    return /YaBrowser|Yowser/i.test(ua);
};

export const isAndroid = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(window.navigator.userAgent);
};

export const openInChromeAndroid = () => {
    if (typeof window === 'undefined') return;

    // Construct Intent URL
    const scheme = window.location.protocol.replace(':', '');
    const hostPath = window.location.href.replace(/^https?:\/\//, '');

    // Explicitly target Chrome on Android
    const intent = `intent://${hostPath}#Intent;scheme=${scheme};package=com.android.chrome;end`;

    console.log('[Browser] Redirecting Yandex -> Chrome:', intent);
    window.location.href = intent;
};

