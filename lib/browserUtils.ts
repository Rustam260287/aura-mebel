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
    // Android Intent to explicitly open Chrome
    const url = window.location.href.replace(/^https?:\/\//, '');
    const intent = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intent;
};

export const openAndroidTwa = (modelId?: string) => {
    if (typeof window === 'undefined') return;

    // Construct the fallback URL (e.g. Play Store or just stay on web)
    const currentUrl = window.location.href;
    const fallbackUrl = encodeURIComponent(currentUrl);

    // If modelId is provided, ensure we target the specific path
    const path = modelId ? `ar?model=${modelId}` : 'ar';
    const host = 'aura-room.ru';

    // Scheme: intent://aura-room.ru/ar?model=...#Intent;scheme=https;package=com.aura.shell;...end
    const intent =
        `intent://${host}/${path}#Intent;` +
        `scheme=https;` +
        `package=com.aura.shell;` +
        `S.browser_fallback_url=${fallbackUrl};` +
        `end`;

    console.log('[Android] Attempting to launch TWA:', intent);
    window.location.href = intent;
};
