/**
 * SceneViewerBridge — Wrapper component that handles Scene Viewer fallback with Post-AR UI
 * 
 * This component wraps the AR experience and:
 * 1. Detects when Scene Viewer is used as fallback
 * 2. Listens for user return (visibilitychange)
 * 3. Shows Post-AR UI after valid return
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { openSceneViewer, shouldUseSceneViewerFallback } from '../utils/sceneViewer';
import { PostARBridge } from '../../../../components/ar/PostARBridge';
import { MIN_BACKGROUND_DURATION_MS } from '../constants';
import { trackJourneyEvent } from '../../../journey/client';
import { createArSessionId } from '../../../journey/arSession';

interface SceneViewerBridgeProps {
    /** Object ID */
    objectId: string;
    /** Object name for display */
    objectName?: string;
    /** GLB URL for Scene Viewer */
    glbUrl?: string;
    /** Whether the bridge is currently active */
    isActive: boolean;
    /** Called when user dismisses UI (close or after share/retry) */
    onDismiss: () => void;
    /** Called when user wants to share */
    onShare?: (objectId: string, objectName?: string) => void;
}

export const SceneViewerBridge: React.FC<SceneViewerBridgeProps> = ({
    objectId,
    objectName,
    glbUrl,
    isActive,
    onDismiss,
    onShare,
}) => {
    const [showPostAR, setShowPostAR] = useState(false);
    const [durationSec, setDurationSec] = useState<number | undefined>();

    const isWaitingForReturnRef = useRef(false);
    const openedAtRef = useRef<number | null>(null);
    const arSessionIdRef = useRef(createArSessionId());

    // Launch Scene Viewer
    const launchSceneViewer = useCallback(() => {
        if (!glbUrl) return;

        const opened = openSceneViewer({
            glbUrl,
            title: objectName || 'AR Preview',
        });

        if (opened) {
            isWaitingForReturnRef.current = true;
            openedAtRef.current = Date.now();

            trackJourneyEvent({
                type: 'AR_FALLBACK_SCENE_VIEWER',
                objectId,
                meta: {
                    arSessionId: arSessionIdRef.current,
                    runtime: 'scene_viewer'
                },
            });
        }
    }, [glbUrl, objectName, objectId]);

    // Listen for visibility change (return from Scene Viewer)
    useEffect(() => {
        if (!isActive) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            if (!isWaitingForReturnRef.current || !openedAtRef.current) return;

            const now = Date.now();
            const elapsed = now - openedAtRef.current;

            console.log(`[SceneViewerBridge] Returned after ${elapsed}ms`);

            if (elapsed < MIN_BACKGROUND_DURATION_MS) {
                console.log('[SceneViewerBridge] Too fast, likely failed to open');
                isWaitingForReturnRef.current = false;
                openedAtRef.current = null;
                onDismiss();
                return;
            }

            // Valid return!
            const duration = Math.round(elapsed / 1000);
            setDurationSec(duration);

            trackJourneyEvent({
                type: 'FINISH_AR',
                objectId,
                meta: {
                    arSessionId: arSessionIdRef.current,
                    durationSec: duration,
                    runtime: 'scene_viewer'
                },
            });

            isWaitingForReturnRef.current = false;
            openedAtRef.current = null;
            setShowPostAR(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isActive, objectId, onDismiss]);

    // Handle share
    const handleShare = useCallback(async () => {
        if (onShare) {
            onShare(objectId, objectName);
        } else {
            // Default: Web Share API
            const shareUrl = `${window.location.origin}/objects/${objectId}`;
            const shareData = {
                title: objectName || 'Посмотри',
                text: 'Смотри, что я примеряю в Aura',
                url: shareUrl,
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    trackJourneyEvent({
                        type: 'AR_SNAPSHOT_SHARED',
                        objectId,
                        meta: { runtime: 'scene_viewer' },
                    });
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareUrl);
                    // Could show toast here
                }
            } catch (e) {
                console.log('[SceneViewerBridge] Share cancelled or failed:', e);
            }
        }

        setShowPostAR(false);
        onDismiss();
    }, [objectId, objectName, onShare, onDismiss]);

    // Handle retry
    const handleRetry = useCallback(() => {
        setShowPostAR(false);
        // Generate new session ID for retry
        arSessionIdRef.current = createArSessionId();
        launchSceneViewer();
    }, [launchSceneViewer]);

    // Handle close
    const handleClose = useCallback(() => {
        setShowPostAR(false);
        onDismiss();
    }, [onDismiss]);

    // Auto-launch on activation if not already showing post-AR
    useEffect(() => {
        if (isActive && !showPostAR && !isWaitingForReturnRef.current) {
            launchSceneViewer();
        }
    }, [isActive, showPostAR, launchSceneViewer]);

    // Render Post-AR UI
    if (showPostAR) {
        return (
            <PostARBridge
                objectId={objectId}
                objectName={objectName}
                arSessionId={arSessionIdRef.current}
                onRestart={handleRetry}
                onClose={handleClose}
            />
        );
    }

    return null;
};
