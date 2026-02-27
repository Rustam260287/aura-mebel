import React, { useEffect, useState } from 'react';
import { detectWebView, openInChromeAndroid, openInSafari } from '../lib/browserUtils';
import { trackJourneyEvent } from '../lib/journey/client';

export const WebViewAutoRedirectGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isWebView, setIsWebView] = useState(false);
    const [platform, setPlatform] = useState<'desktop' | 'ios' | 'android' | 'unknown'>('unknown');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const webviewInfo = detectWebView();

        if (webviewInfo.isWebView) {
            setIsWebView(true);
            setPlatform(webviewInfo.platform);

            // Aggressive auto-redirect on mount
            trackJourneyEvent({
                type: 'BROWSER_LIMITATION_DETECTED',
                meta: { limitations: { reason: 'in_app_browser', browser: webviewInfo.browser, platform: webviewInfo.platform, timestamp: new Date().toISOString() } }
            });

            // Attempt redirect once per session
            let hasRedirected = false;
            try {
                hasRedirected = sessionStorage.getItem('webview_redirect_attempted') === '1';
            } catch { }

            if (!hasRedirected) {
                try {
                    sessionStorage.setItem('webview_redirect_attempted', '1');
                } catch { }

                trackJourneyEvent({
                    type: 'EXTERNAL_BROWSER_REDIRECT_TRIGGERED',
                    meta: { action: { type: 'auto_redirect_on_mount', browser: webviewInfo.browser, timestamp: new Date().toISOString() } }
                });

                // A slight delay prevents some webviews from immediately blocking the navigation
                // Note: We intentionally do not auto-redirect on iOS because window.location.href 
                // often fails to break out of the in-app browser silently, making it look like 
                // nothing happened. Instead, we show the fallback UI immediately on iOS.
                if (webviewInfo.platform === 'android') {
                    setTimeout(() => {
                        openInChromeAndroid();
                    }, 600);
                }
            }
        }
    }, []);

    // If not a webview, just render children seamlessly
    if (!isWebView) {
        return <>{children}</>;
    }

    // Fallback UI if we are in a webview (and the auto-redirect didn't navigate away)
    return (
        <div className="fixed inset-0 z-[10000] bg-warm-white dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 mb-6 rounded-2xl bg-brand-brown/10 dark:bg-white/5 flex items-center justify-center relative shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand-brown dark:text-white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </div>

            <h2 className="text-2xl font-serif italic text-soft-black dark:text-white mb-3">
                Требуется браузер
            </h2>

            <p className="text-[#6B6B6B] dark:text-[#A0A0A0] text-[15px] max-w-[280px] mb-8">
                Aura не работает полноценно внутри мессенджеров
            </p>

            <button
                onClick={() => {
                    trackJourneyEvent({
                        type: 'EXTERNAL_BROWSER_REDIRECT_TRIGGERED',
                        meta: { action: { type: 'manual_redirect_click', browser: detectWebView().browser, timestamp: new Date().toISOString() } }
                    });
                    if (platform === 'android') {
                        openInChromeAndroid();
                    } else {
                        openInSafari();
                    }
                }}
                className="w-full max-w-[280px] bg-brand-brown hover:bg-brand-brown/90 text-white font-medium py-[15px] px-6 rounded-full transition-transform active:scale-95 shadow-soft"
            >
                {platform === 'ios' ? '👉 Открыть в Safari' : '👉 Открыть в Chrome'}
            </button>

            <p className="mt-8 text-sm text-[#8E8E8E] leading-relaxed">
                Или нажмите <strong className="text-soft-black dark:text-white">⋯</strong> в углу экрана<br />и выберите «Открыть в браузере»
            </p>
        </div>
    );
};
