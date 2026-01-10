
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { trackJourneyEvent } from '../lib/journey/client';
import { useImmersive } from '../contexts/ImmersiveContext';
import { useToast } from '../contexts/ToastContext';
import { createArSessionId } from '../lib/journey/arSession';
import { createArSnapshot } from '../lib/journey/snapshotsClient';
import { ArBrowserGuard } from './ArBrowserGuard';

interface ModelViewerElement extends HTMLElement {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  poster?: string;
  'camera-controls'?: boolean;
  'disable-pan'?: boolean;
  'disable-tap'?: boolean;
  'auto-rotate'?: boolean;
  'ar'?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: string;
  activateAR?: () => void;
  toDataURL?: (type?: string, encoderOptions?: number) => string | Promise<string>;
}

interface ARViewerProps {
  src?: string;
  iosSrc?: string;
  alt: string;
  poster?: string;
  objectId?: string;
  open?: boolean;
  onClose?: (arDurationSec?: number) => void;
}

export type ARViewerHandle = {
  activateAR: () => void;
};

const ARViewerComponent = forwardRef<ARViewerHandle, ARViewerProps>(
  ({ src, iosSrc, alt, poster, objectId, open = false, onClose }, ref) => {
    const modelViewerRef = useRef<ModelViewerElement>(null);
    const quickLookRef = useRef<HTMLAnchorElement | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isIOS] = useState(() =>
      typeof navigator !== 'undefined' ? /iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    );
    const [isPresentingAr, setIsPresentingAr] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const open3dLoggedRef = useRef(false);
    const arStartLoggedRef = useRef(false);
    const arStartMsRef = useRef<number | null>(null);
    const arFinishedRef = useRef(false);
    const wasPresentingRef = useRef(false);
    const { setImmersive } = useImmersive();
    const pendingActivateRef = useRef(false);
    const hintArmedRef = useRef(false);
    const { addToast } = useToast();
    const [arSessionId, setArSessionId] = useState<string | null>(null);
    const arSessionIdRef = useRef<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const arModes = isIOS ? 'quick-look' : 'webxr';

    useEffect(() => {
      import('@google/model-viewer').catch(console.error);
    }, []);

    useEffect(() => {
      setImmersive(open);
      return () => setImmersive(false);
    }, [open, setImmersive]);

    useEffect(() => {
      if (!open) {
        setArSessionId(null);
        arSessionIdRef.current = null;
        return;
      }
      setArSessionId((prev) => {
        const next = prev || createArSessionId();
        arSessionIdRef.current = next;
        return next;
      });
    }, [open]);

    const ensureArSession = useCallback(() => {
      if (arSessionIdRef.current) return arSessionIdRef.current;
      const next = createArSessionId();
      arSessionIdRef.current = next;
      setArSessionId(next);
      return next;
    }, []);

    useEffect(() => {
      if (!open) return undefined;
      if (hintArmedRef.current) return undefined;
      hintArmedRef.current = true;
      if (typeof window === 'undefined') return undefined;
      try {
        if (window.localStorage.getItem('label_ar_floor_hint_shown')) return undefined;
      } catch {
        return undefined;
      }
      setShowHint(true);
      const timer = window.setTimeout(() => {
        setShowHint(false);
        try {
          window.localStorage.setItem('label_ar_floor_hint_shown', '1');
        } catch { }
      }, 2600);
      return () => window.clearTimeout(timer);
    }, [open]);

    // Quick Look is more reliable when the URL ends with the correct extension.
    const proxiedSrc = src ? `/api/proxy-model.glb?url=${encodeURIComponent(src)}` : undefined;
    const proxiedIosSrc = iosSrc ? `/api/proxy-model.usdz?url=${encodeURIComponent(iosSrc)}` : undefined;
    const effectiveIosSrc = proxiedIosSrc || iosSrc;

    const canPreview3d = Boolean(proxiedSrc);
    const canStartAr = isIOS ? Boolean(effectiveIosSrc) : Boolean(proxiedSrc);
    const canSnapshot =
      open &&
      isPresentingAr &&
      canPreview3d &&
      (typeof document === 'undefined' ? true : document.visibilityState === 'visible');

    const handleModelLoad = () => setIsLoaded(true);

    useEffect(() => {
      const modelViewer = modelViewerRef.current;
      if (modelViewer) {
        modelViewer.addEventListener('load', handleModelLoad);
        return () => modelViewer.removeEventListener('load', handleModelLoad);
      }
    }, []);

    useEffect(() => {
      if (!isLoaded || !objectId) return;
      if (open3dLoggedRef.current) return;
      open3dLoggedRef.current = true;
      trackJourneyEvent({ type: 'OPEN_3D', objectId });
    }, [isLoaded, objectId]);

    const finishArIfNeeded = useCallback((): number | null => {
      if (!objectId) return null;
      if (arFinishedRef.current) return null;
      const start = arStartMsRef.current;
      if (start == null) return null;
      arFinishedRef.current = true;
      const durationSec = Math.max(0, Math.round((Date.now() - start) / 1000));
      trackJourneyEvent({
        type: 'FINISH_AR',
        objectId,
        meta: { durationSec, ...(arSessionIdRef.current ? { arSessionId: arSessionIdRef.current } : {}) },
      });
      return durationSec;
    }, [objectId]);

    useEffect(() => {
      return () => {
        finishArIfNeeded();
      };
    }, [finishArIfNeeded]);

    useEffect(() => {
      const modelViewer = modelViewerRef.current as any;
      if (!modelViewer || typeof modelViewer.addEventListener !== 'function') return undefined;

      const handleArStatus = (event: any) => {
        const status = event?.detail?.status as unknown;

        if (status === 'session-started' || status === 'object-placed') {
          wasPresentingRef.current = true;
          setIsPresentingAr(true);
          if (objectId && !arStartLoggedRef.current) {
            arStartLoggedRef.current = true;
            if (arStartMsRef.current == null) arStartMsRef.current = Date.now();
            trackJourneyEvent({
              type: 'START_AR',
              objectId,
              meta: { ...(arSessionIdRef.current ? { arSessionId: arSessionIdRef.current } : {}) },
            });
          }
          return;
        }

        if (status === 'not-presenting') {
          const ended = wasPresentingRef.current;
          wasPresentingRef.current = false;
          setIsPresentingAr(false);
          if (ended) {
            const durationSec = finishArIfNeeded();
            onClose?.(durationSec ?? undefined);
          }
          return;
        }

        if (status === 'failed') {
          wasPresentingRef.current = false;
          setIsPresentingAr(false);
        }
      };

      modelViewer.addEventListener('ar-status', handleArStatus);
      return () => modelViewer.removeEventListener('ar-status', handleArStatus);
    }, [finishArIfNeeded, objectId, onClose]);

    useEffect(() => {
      if (typeof document === 'undefined') return undefined;

      const handleVisibility = () => {
        if (arStartMsRef.current == null) return;

        if (document.visibilityState === 'hidden') {
          // Native viewers often background the tab (Scene Viewer / Quick Look).
          wasPresentingRef.current = true;
          setIsPresentingAr(true);
          return;
        }

        if (document.visibilityState === 'visible') {
          const ended = wasPresentingRef.current;
          wasPresentingRef.current = false;
          setIsPresentingAr(false);
          if (ended) {
            const durationSec = finishArIfNeeded();
            onClose?.(durationSec ?? undefined);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [finishArIfNeeded, onClose]);

    const ensureModelViewerReady = useCallback(async () => {
      if (typeof window === 'undefined') return false;
      if (!window.customElements?.whenDefined) return true;
      try {
        await Promise.race([
          window.customElements.whenDefined('model-viewer'),
          new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 6000)),
        ]);
        return true;
      } catch {
        return false;
      }
    }, []);

    const handleActivateAR = () => {
      if (!canStartAr) return;
      if (!isIOS) {
        const xr = (navigator as any)?.xr;
        if (!xr || typeof xr.isSessionSupported !== 'function') {
          addToast('AR недоступен на этом устройстве', 'info', 2200);
          return;
        }
      }
      ensureArSession();
      if (objectId && arStartMsRef.current == null) {
        // Fallback for platforms where `ar-status` events are limited (e.g. native viewers).
        arStartMsRef.current = Date.now();
      }
      if (objectId && !arStartLoggedRef.current) {
        arStartLoggedRef.current = true;
        trackJourneyEvent({
          type: 'START_AR',
          objectId,
          meta: { ...(arSessionIdRef.current ? { arSessionId: arSessionIdRef.current } : {}) },
        });
      }
      const modelViewer = modelViewerRef.current as any;
      if (!modelViewer) return;

      const trySync = () => {
        // Maintain user-gesture context by calling activateAR synchronously whenever possible.
        if (!isIOS && proxiedSrc) {
          try {
            if (modelViewer.src !== proxiedSrc) modelViewer.src = proxiedSrc;
          } catch { }
        }
        if (typeof modelViewer.activateAR === 'function') {
          try {
            modelViewer.activateAR();
            pendingActivateRef.current = false;
            return true;
          } catch {
            // fall through
          }
        }
        return false;
      };

      if (trySync()) return;

      if (isIOS) {
        // Fallback for iOS: direct Quick Look link (proxied) with content scaling.
        quickLookRef.current?.click();
        pendingActivateRef.current = false;
        return;
      }

      // If model-viewer isn't upgraded yet (very slow networks), retry once it is defined.
      pendingActivateRef.current = true;
    };

    useImperativeHandle(
      ref,
      () => ({
        activateAR: handleActivateAR,
      }),
      [handleActivateAR],
    );

    useEffect(() => {
      if (!open) return;
      if (!pendingActivateRef.current) return;
      if (typeof window === 'undefined') return;

      let cancelled = false;
      void (async () => {
        const ok = await ensureModelViewerReady();
        if (!ok || cancelled) return;
        const modelViewer = modelViewerRef.current as any;
        if (!modelViewer) return;

        // Retry activation once the custom element is definitely upgraded.
        if (isIOS) {
          if (typeof modelViewer.activateAR === 'function') {
            try {
              modelViewer.activateAR();
              pendingActivateRef.current = false;
              return;
            } catch { }
          }
          quickLookRef.current?.click();
          pendingActivateRef.current = false;
          return;
        }

        if (proxiedSrc) {
          try {
            if (modelViewer.src !== proxiedSrc) modelViewer.src = proxiedSrc;
          } catch { }
        }
        if (typeof modelViewer.activateAR === 'function') {
          try {
            modelViewer.activateAR();
            pendingActivateRef.current = false;
          } catch { }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [ensureModelViewerReady, isIOS, open, proxiedSrc]);

    const captureModelViewerJpeg = useCallback(async (): Promise<{ blob: Blob; width?: number; height?: number }> => {
      const el = modelViewerRef.current as any;
      if (!el) throw new Error('model-viewer not ready');

      // Method 1: Canvas from Shadow Root (Most reliable for WebXR with preserve-drawing-buffer)
      const canvas = (el.shadowRoot?.querySelector?.('canvas') as HTMLCanvasElement | null) || null;
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const blob = await fetch(dataUrl).then((r) => r.blob());
          return { blob, width: canvas.width, height: canvas.height };
        } catch (e) {
          console.warn('Canvas capture failed, falling back to toDataURL API', e);
        }
      }

      // Method 2: model-viewer API (Fallback)
      if (typeof el.toDataURL === 'function') {
        const maybe = el.toDataURL('image/png');
        const dataUrl = typeof maybe === 'string' ? maybe : await maybe;
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
          const blob = await fetch(dataUrl).then((r) => r.blob());
          // Can't easily get dimensions here without loading image, assuming screen size approximately
          return { blob };
        }
      }

      throw new Error('snapshot not supported');
    }, []);

    const saveToDevice = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const shareSnapshot = async (file: File) => {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            text: 'Я примерил(а) этот предмет в своём интерьере ✨',
            url: `https://aura-room.ru/object/${objectId}?from=share`
          });
          trackJourneyEvent({ type: 'AR_SNAPSHOT_SHARED', objectId });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Share failed:', error);
          }
        }
      } else {
        // Fallback: copy link to clipboard? Or just do nothing (Quiet UX).
        // Given "Quiet UX", doing nothing is safer than a potentially confusing fallback.
      }
    };

    const handleSnapshot = useCallback(async () => {
      if (isCapturing) return;
      const sessionId = ensureArSession();
      if (!sessionId || !objectId) return;
      if (!isPresentingAr) return;

      trackJourneyEvent({ type: 'AR_SNAPSHOT_REQUESTED', objectId });
      setIsCapturing(true);

      // Flash effect immediately
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 150);

      try {
        const capture = await captureModelViewerJpeg();

        // 1. Immediate Save (Parallel)
        const filename = `aura-${new Date().toISOString().slice(0, 10)}.png`;
        saveToDevice(capture.blob, filename);

        // 2. Upload (Parallel)
        // We don't await this blocking the UI feedback.
        createArSnapshot({
          sessionId,
          objectId,
          capture,
          device: 'android',
          arMode: 'webxr'
        }).then(() => {
          trackJourneyEvent({ type: 'AR_SNAPSHOT_CREATED', objectId });
        }).catch(e => console.warn('Snapshot upload bg failed', e));

        // 3. Feedback (Toast with Share Action)
        const file = new File([capture.blob], filename, { type: 'image/png' });

        // Custom Toast Content
        addToast(
          <div className="flex items-center gap-3">
            <span>✅ Снимок сохранён</span>
            {typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] }) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  shareSnapshot(file);
                }}
                className="ml-2 bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1 rounded-full text-xs font-medium transition-colors backdrop-blur-sm"
              >
                🔗 Поделиться
              </button>
            )}
          </div>,
          'success',
          4500
        );

      } catch (e) {
        console.warn('[ARViewer] snapshot failed:', e);
        addToast('Не удалось сохранить снимок', 'error', 2200);
      } finally {
        setIsCapturing(false);
      }
    }, [addToast, captureModelViewerJpeg, ensureArSession, isCapturing, isPresentingAr, objectId]);

    return (
      <div
        className={[
          open
            ? 'fixed inset-0 z-ar bg-warm-white flex items-center justify-center'
            : 'fixed left-0 top-0 w-[1px] h-[1px] opacity-0 pointer-events-none -z-10 overflow-hidden',
        ].join(' ')}
        aria-hidden={!open}
      >
        {/* Flash Effect */}
        {showFlash && (
          <div className="absolute inset-0 z-[200] bg-white animate-fade-out pointer-events-none" />
        )}

        {/* Model Viewer (single entrypoint for Web/Android + iOS Quick Look via ios-src) */}
        <ArBrowserGuard>
          {canPreview3d || isIOS ? (
            <model-viewer
              ref={modelViewerRef}
              src={open && !isIOS ? proxiedSrc : undefined}
              ios-src={effectiveIosSrc}
              alt={alt}
              poster={poster}
              camera-controls
              auto-rotate
              interaction-prompt="none"
              scale="1 1 1"
              ar
              // IMPORTANT:
              // Do NOT add `scene-viewer` to ar-modes.
              // It causes Android to open Google Play via external intent.
              // Labelcom uses WebXR-only AR on Android by design.
              ar-modes={arModes}
              ar-scale="auto"
              style={{ touchAction: 'pan-y' }}
              className="w-full h-full"
              preserve-drawing-buffer
            >
              {/* Snapshot button (WebXR in-page only). Must be inside model-viewer DOM overlay on Android. */}
              {canSnapshot && (
                <button
                  type="button"
                  onClick={handleSnapshot}
                  aria-label="Сделать снимок"
                  disabled={isCapturing}
                  className="pointer-events-auto absolute z-20 left-1/2 -translate-x-1/2 bottom-[32px] w-14 h-14 bg-white/60 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center hover:bg-white/80 transition-all active:scale-95 disabled:opacity-50"
                  style={{ opacity: 0.7 }}
                >
                  <svg className="w-6 h-6 text-black opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <circle cx="12" cy="13" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </model-viewer>
          ) : (
            <div className="w-full h-full flex items-center justify-center px-6 text-center">
              <div className="max-w-sm">
                <div className="text-lg font-medium text-soft-black">AR примерка</div>
                <p className="mt-2 text-sm text-muted-gray">
                  На iPhone AR откроется в системном просмотре. Мы вернёмся сюда после примерки.
                </p>
              </div>
            </div>
          )}
        </ArBrowserGuard>

        {/* Hidden Quick Look anchor for iOS-only (USDZ) models */}
        {iosSrc && (
          <a
            ref={quickLookRef}
            href={`${(effectiveIosSrc || iosSrc).split('#')[0]}#allowsContentScaling=1`}
            rel="ar"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

        {/* Dim overlay while loading */}
        {open && canPreview3d && !isLoaded && (
          <div className="absolute inset-0 bg-warm-white/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown" />
          </div>
        )}

        {/* Quiet one-time hint */}
        {showHint && !isPresentingAr && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-soft-black/65 text-white text-xs backdrop-blur-md">
            Наведите камеру на пол
          </div>
        )}

        {/* Close Button */}
        {open && onClose && !isPresentingAr && (
          <button
            onClick={() => {
              const durationSec = finishArIfNeeded();
              onClose(durationSec ?? undefined);
            }}
            className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft z-[120] hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-soft-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
      </div>
    );
  });

export const ARViewer = memo(ARViewerComponent);
