import React, { useEffect, useState } from 'react';
import { getBrowserEnvironment, openInChromeAndroid, openInSafari } from '../lib/browserUtils';
import { trackJourneyEvent } from '../lib/journey/client';

interface Props {
    children: React.ReactNode;
    onClose?: () => void;
}

export const ArBrowserGuard: React.FC<Props> = ({ children, onClose }) => {
    // Only check environment on client-side to avoid hydration mismatch
    const [env, setEnv] = useState<{ isSupported: boolean; platform: string; browser: string; requiresExternalBrowser: boolean } | null>(null);

    useEffect(() => {
        const currentEnv = getBrowserEnvironment();
        setEnv(currentEnv);

        if (currentEnv.requiresExternalBrowser) {
            trackJourneyEvent({
                type: 'BROWSER_LIMITATION_DETECTED',
                meta: {
                    limitations: {
                        reason: 'browser_unsupported',
                        browser: currentEnv.browser,
                        platform: currentEnv.platform,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }
    }, []);

    const handleRedirect = () => {
        if (!env) return;

        trackJourneyEvent({
            type: 'EXTERNAL_BROWSER_ACTION_CLICKED',
            meta: {
                action: {
                    type: 'open_browser',
                    browser: env.browser,
                    timestamp: new Date().toISOString()
                }
            }
        });

        if (env.platform === 'android') {
            openInChromeAndroid();
        } else {
            openInSafari();
        }
    };

    // While env is determining (ssr/first render), render children or null? 
    // Ideally duplicate children logic or null. 
    // To strictly support "not mounting WebXR", we wait for env.
    // Debug logging
    useEffect(() => {
        if (env) {
            console.log('[ArBrowserGuard] Env:', env);
        }
    }, [env]);

    if (!env) {
        // Strict Guard: Do not render children until we know the environment.
        // This prevents model-viewer from mounting in unsupported browsers.
        return null;
    }

    if (env.requiresExternalBrowser) {
        console.log('[ArBrowserGuard] Rendering Guard UI');
        return (
            <div
                className="absolute inset-0 z-[9999] bg-warm-white flex flex-col items-center justify-center p-8 text-center"
                style={{ backgroundColor: '#F7F7F5' }} // Force background color
            >
                <div className="w-16 h-16 mb-6 rounded-full bg-brand-cream/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </div>

                <h3 className="text-xl font-serif text-brand-brown mb-3">
                    Для 3D-примерки нужен браузер
                </h3>

                <p className="text-base text-muted-gray mb-8 max-w-sm leading-relaxed">
                    Встроенные браузеры приложений ограничивают AR-возможности.
                    <br />
                    <span className="text-sm opacity-75 mt-2 block">
                        Aura открывается в браузере для корректной примерки.
                    </span>
                </p>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <button
                        onClick={handleRedirect}
                        className="w-full px-6 py-4 bg-brand-brown text-white rounded-xl font-medium text-base shadow-sm hover:bg-brand-brown-dark transition-all active:scale-[0.98]"
                    >
                        Открыть в браузере
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-2 text-brand-brown/60 hover:text-brand-brown font-medium text-sm transition-colors"
                        >
                            Продолжить без 3D
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Supported environment
    return <>{children}</>;
};
