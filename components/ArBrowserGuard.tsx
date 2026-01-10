import React, { useEffect, useState } from 'react';
import { isYandexBrowser, isAndroid, openAndroidTwa } from '../lib/browserUtils';
import { trackJourneyEvent } from '../lib/journey/client';

interface Props {
    children: React.ReactNode;
}

export const ArBrowserGuard: React.FC<Props> = ({ children }) => {
    useEffect(() => {
        // Quiet TWA Handoff for Android + Yandex Browser
        if (isAndroid() && isYandexBrowser()) {
            // Attempt to switch to AuraShell TWA
            openAndroidTwa();

            // We just let the children render while the intent fires.
            // The browser will handle the switch or stay here if failed/ignored.

            // Optional: Analytics tracking for TWA attempt can be added here if needed
            trackJourneyEvent({
                type: 'HANDOFF_REQUESTED',
                meta: {
                    handoff: {
                        reason: 'contact', // Retaining 'contact' as a placeholder or defining a new technical reason if schema allows, but 'contact' is safe
                        actions: ['AR_TRY'],
                        lastQuestions: ['TWA Auto-Launch'],
                        timestamp: new Date().toISOString(),
                        arDurationSec: null
                    }
                }
            });
        }
    }, []);

    // Always render children immediately (WebXR / Fallback logic)
    // No blocking UI, no "AR Unavailable" screens.
    return <>{children}</>;
};
