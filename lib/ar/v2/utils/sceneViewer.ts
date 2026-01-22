/**
 * Scene Viewer Fallback — Android AR via Google Scene Viewer
 * 
 * When WebXR fails, we redirect to Scene Viewer which uses native ARCore.
 * This works on devices where WebXR is technically "supported" but fails to start.
 * 
 * Scene Viewer is an Android Intent that opens the Google app or a compatible viewer.
 * It requires a GLB URL that is publicly accessible.
 */

export interface SceneViewerOptions {
    /** Public URL to the GLB model (must be HTTPS, publicly accessible) */
    glbUrl: string;
    /** Title shown in Scene Viewer */
    title?: string;
    /** Optional link to show in Scene Viewer */
    link?: string;
    /** Whether to enable AR mode (default: true) */
    arMode?: boolean;
}

/**
 * Opens Google Scene Viewer with the specified model.
 * Returns true if the intent was opened, false if it failed.
 */
export function openSceneViewer(options: SceneViewerOptions): boolean {
    const { glbUrl, title = 'AR Preview', link, arMode = true } = options;

    // Validate URL
    if (!glbUrl || !glbUrl.startsWith('http')) {
        console.error('[SceneViewer] Invalid GLB URL:', glbUrl);
        return false;
    }

    // Build Scene Viewer URL
    // Documentation: https://developers.google.com/ar/develop/scene-viewer
    const params = new URLSearchParams({
        file: glbUrl,
        mode: arMode ? 'ar_preferred' : '3d_only',
        title: title,
        resizable: 'true',
    });

    if (link) {
        params.set('link', link);
    }

    // Intent URL format for Android
    const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?${params.toString()}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://arvr.google.com/scene-viewer?${params.toString()};end;`;

    console.log('[SceneViewer] Opening fallback AR:', glbUrl);

    try {
        // Open Scene Viewer via window.location
        // This triggers the Android intent system
        window.location.href = sceneViewerUrl;
        return true;
    } catch (e) {
        console.error('[SceneViewer] Failed to open:', e);
        return false;
    }
}

/**
 * Check if Scene Viewer fallback should be attempted.
 * Only on Android devices.
 */
export function shouldUseSceneViewerFallback(): boolean {
    if (typeof navigator === 'undefined') return false;

    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    const isChrome = ua.includes('chrome') && !ua.includes('edg');

    // Scene Viewer works best on Android Chrome
    return isAndroid && isChrome;
}
