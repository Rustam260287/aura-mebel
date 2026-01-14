import React, { useEffect, useState } from 'react';
import { isYandexBrowser, isAndroid, openInChromeAndroid } from '../lib/browserUtils';
import { trackJourneyEvent } from '../lib/journey/client';

interface Props {
    children: React.ReactNode;
}

export const ArBrowserGuard: React.FC<Props> = ({ children }) => {
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Seamless Chrome Handoff for Android + Yandex Browser
        // Yandex doesn't support WebXR properly, so we redirect to Chrome
        if (isAndroid() && isYandexBrowser()) {
            setIsRedirecting(true);

            trackJourneyEvent({
                type: 'HANDOFF_REQUESTED',
                meta: {
                    handoff: {
                        reason: 'contact', // browser_switch tracked via lastQuestions
                        actions: ['AR_TRY'],
                        lastQuestions: ['Yandex → Chrome'],
                        timestamp: new Date().toISOString(),
                        arDurationSec: null
                    }
                }
            });

            // Redirect to Chrome immediately
            setTimeout(() => {
                openInChromeAndroid();
            }, 100);
        }
    }, []);

    if (isRedirecting) {
        return (
            <div className="absolute inset-0 z-50 bg-warm-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 mb-4 rounded-full bg-brand-cream flex items-center justify-center animate-pulse">
                    <svg className="w-6 h-6 text-brand-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-soft-black mb-2">Переходим в Chrome</h3>
                <p className="text-sm text-muted-gray mb-6 max-w-xs">
                    Для работы AR нужна поддержка Google Play Services, которая работает лучше всего в Chrome.
                </p>
                <button
                    onClick={() => openInChromeAndroid()}
                    className="px-6 py-3 bg-brand-brown text-white rounded-full font-medium text-sm hover:bg-brand-brown-dark transition-colors"
                >
                    Открыть вручную
                </button>
            </div>
        );
    }

    // Always render children immediately if not redirecting
    return <>{children}</>;
};
