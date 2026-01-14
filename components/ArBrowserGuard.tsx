import React, { useEffect, useState } from 'react';
import { isYandexBrowser, isAndroid, openInChromeAndroid } from '../lib/browserUtils';
import { trackJourneyEvent } from '../lib/journey/client';

interface Props {
    children: React.ReactNode;
}

export const ArBrowserGuard: React.FC<Props> = ({ children }) => {
    useEffect(() => {
        // Seamless Chrome Handoff for Android + Yandex Browser
        // Yandex doesn't support WebXR properly, so we redirect to Chrome
        if (isAndroid() && isYandexBrowser()) {
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
            openInChromeAndroid();
        }
    }, []);

    // Always render children immediately
    return <>{children}</>;
};
