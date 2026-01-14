import { useCallback, useEffect, useRef, useState } from 'react';
import { autofitModelViewer } from '../3d/model-viewer-autofit';
import { optimizeScene } from '../3d/optimizer';

type Inline3DState = 'idle' | 'loading' | 'loaded' | 'error';

interface UseInline3DOptions {
    /** Whether 3D mode is currently active */
    active: boolean;
    /** URL to the 3D model (proxied GLB) */
    modelUrl?: string;
    /** Object ID for tracking */
    objectId?: string;
    /** Callback when 3D view is entered (interaction starts) */
    onEnter3D?: () => void;
    /** Callback when 3D view is exited (interaction ends) */
    onExit3D?: () => void;
    /** Callback when model is loaded */
    onLoad?: () => void;
}

interface UseInline3DReturn {
    /** Ref to attach to model-viewer element */
    modelViewerRef: React.RefObject<HTMLElement | null>;
    /** Current loading state */
    state: Inline3DState;
    /** Error message if any */
    error: string | null;
    /** Loading progress 0-1 */
    progress: number | null;
}

/**
 * Hook for managing inline 3D model viewer state.
 * Handles loading, error states, interaction tracking, and idle exit.
 */
export const useInline3D = ({
    active,
    modelUrl,
    objectId,
    onEnter3D,
    onExit3D,
    onLoad,
}: UseInline3DOptions): UseInline3DReturn => {
    const modelViewerRef = useRef<HTMLElement>(null);
    const [state, setState] = useState<Inline3DState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    // Reset state when deactivated
    useEffect(() => {
        if (!active) {
            setState('idle');
            setError(null);
            setProgress(null);
        }
    }, [active]);

    // Main lifecycle effect
    useEffect(() => {
        if (!active || !modelUrl) {
            setState('idle');
            return;
        }

        setState('loading');
        setError(null);
        setProgress(null);

        let upgradeTimer: number | null = null;
        let slowTimer: number | null = null;
        let idleTimer: number | null = null;
        let detachGlobalExit: (() => void) | null = null;

        const clearTimers = () => {
            if (upgradeTimer) window.clearTimeout(upgradeTimer);
            if (slowTimer) window.clearTimeout(slowTimer);
            if (idleTimer) window.clearTimeout(idleTimer);
            upgradeTimer = slowTimer = idleTimer = null;
        };

        // Check if model-viewer is defined
        if (typeof window !== 'undefined') {
            upgradeTimer = window.setTimeout(async () => {
                try {
                    if (typeof window.customElements?.whenDefined === 'function') {
                        await Promise.race([
                            window.customElements.whenDefined('model-viewer'),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
                        ]);
                    }
                } catch {
                    setState('error');
                    setError('Не удалось инициализировать 3D. Обновите страницу.');
                }
            }, 300);

            slowTimer = window.setTimeout(() => {
                setState(prev => {
                    if (prev === 'loading') {
                        setError('3D-модель загружается слишком долго.');
                    }
                    return prev;
                });
            }, 25000);
        }

        const el = modelViewerRef.current as any;
        if (!el || typeof el.addEventListener !== 'function') return;

        // Interaction handlers
        const exit3d = () => {
            if (idleTimer) window.clearTimeout(idleTimer);
            idleTimer = null;
            detachGlobalExit?.();
            detachGlobalExit = null;
            onExit3D?.();
        };

        const scheduleIdleExit = () => {
            if (idleTimer) window.clearTimeout(idleTimer);
            idleTimer = window.setTimeout(exit3d, 1200);
        };

        const attachGlobalExit = () => {
            if (detachGlobalExit) return;
            const onEnd = () => exit3d();
            window.addEventListener('pointerup', onEnd, true);
            window.addEventListener('pointercancel', onEnd, true);
            window.addEventListener('blur', onEnd, true);
            detachGlobalExit = () => {
                window.removeEventListener('pointerup', onEnd, true);
                window.removeEventListener('pointercancel', onEnd, true);
                window.removeEventListener('blur', onEnd, true);
            };
        };

        const enter3d = () => {
            onEnter3D?.();
            attachGlobalExit();
            scheduleIdleExit();
        };

        // Event handlers
        const handleError = () => {
            clearTimers();
            setState('error');
            setError('Не удалось загрузить 3D-модель');
        };

        const handleLoad = () => {
            clearTimers();
            setError(null);

            // Optimize scene if accessible
            try {
                const symbols = Object.getOwnPropertySymbols(el);
                const symbol = symbols.find(s =>
                    s.description === 'model-viewer' || s.description === 'model-viewer-internal-symbol'
                );
                if (symbol) {
                    const internal = (el as any)[symbol];
                    const scene = internal?.model?.scene || internal?.scene;
                    if (scene) optimizeScene(scene);
                }
            } catch { }

            try { autofitModelViewer(el); } catch { }

            requestAnimationFrame(() => setState('loaded'));
            onLoad?.();
        };

        const handleProgress = (event: any) => {
            const p = event?.detail?.totalProgress;
            if (typeof p === 'number' && Number.isFinite(p)) {
                setProgress(Math.max(0, Math.min(1, p)));
            }
        };

        // Attach listeners
        el.addEventListener('load', handleLoad);
        el.addEventListener('error', handleError);
        el.addEventListener('progress', handleProgress);
        el.addEventListener('pointerdown', enter3d);
        el.addEventListener('pointermove', scheduleIdleExit);
        el.addEventListener('wheel', scheduleIdleExit, { passive: true });
        el.addEventListener('pointerup', exit3d);
        el.addEventListener('pointercancel', exit3d);
        el.addEventListener('mouseleave', exit3d);

        return () => {
            clearTimers();
            detachGlobalExit?.();
            el.removeEventListener('load', handleLoad);
            el.removeEventListener('error', handleError);
            el.removeEventListener('progress', handleProgress);
            el.removeEventListener('pointerdown', enter3d);
            el.removeEventListener('pointermove', scheduleIdleExit);
            el.removeEventListener('wheel', scheduleIdleExit as any);
            el.removeEventListener('pointerup', exit3d);
            el.removeEventListener('pointercancel', exit3d);
            el.removeEventListener('mouseleave', exit3d);
        };
    }, [active, modelUrl, objectId, onEnter3D, onExit3D, onLoad]);

    // Autofit on resize
    useEffect(() => {
        const el = modelViewerRef.current as any;
        if (!el || state !== 'loaded') return;

        let raf = 0;
        const schedule = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                try { autofitModelViewer(el); } catch { }
            });
        };

        schedule();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(schedule);
            try { ro.observe(el); } catch { }
        }

        return () => {
            if (raf) cancelAnimationFrame(raf);
            ro?.disconnect();
        };
    }, [state]);

    return {
        modelViewerRef,
        state,
        error,
        progress,
    };
};
