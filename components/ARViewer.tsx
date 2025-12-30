
import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { trackJourneyEvent } from '../lib/journey/client';

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
}

interface ARViewerProps {
  src?: string;
  iosSrc?: string;
  alt: string;
  poster?: string;
  objectId?: string;
  onClose?: (arDurationSec?: number) => void;
}

const ARViewerComponent: React.FC<ARViewerProps> = ({ src, iosSrc, alt, poster, objectId, onClose }) => {
  const modelViewerRef = useRef<ModelViewerElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPresentingAr, setIsPresentingAr] = useState(false);
  const open3dLoggedRef = useRef(false);
  const arStartLoggedRef = useRef(false);
  const arStartMsRef = useRef<number | null>(null);
  const arFinishedRef = useRef(false);
  const wasPresentingRef = useRef(false);

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    import('@google/model-viewer').catch(console.error);
  }, []);
  
  const proxiedSrc = src ? `/api/proxy-model?url=${encodeURIComponent(src)}` : undefined;
  const canPreview3d = Boolean(proxiedSrc);
  const canStartAr = isIOS ? Boolean(iosSrc) : Boolean(proxiedSrc);

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
    trackJourneyEvent({ type: 'FINISH_AR', objectId, meta: { durationSec } });
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

      if (status === 'session-started') {
        wasPresentingRef.current = true;
        setIsPresentingAr(true);
        if (objectId && !arStartLoggedRef.current) {
          arStartLoggedRef.current = true;
          if (arStartMsRef.current == null) arStartMsRef.current = Date.now();
          trackJourneyEvent({ type: 'START_AR', objectId });
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

  const handleActivateAR = () => {
    if (!canStartAr) return;
    if (objectId && arStartMsRef.current == null) {
      // Fallback for platforms where `ar-status` events are limited (e.g. native viewers).
      arStartMsRef.current = Date.now();
    }
    if (objectId && !arStartLoggedRef.current) {
      arStartLoggedRef.current = true;
      trackJourneyEvent({ type: 'START_AR', objectId });
    }
    if (modelViewerRef.current && 'activateAR' in modelViewerRef.current) {
      (modelViewerRef.current as any).activateAR();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-warm-white flex items-center justify-center">
      {/* Model Viewer */}
      {canPreview3d ? (
        <model-viewer
          ref={modelViewerRef}
          src={proxiedSrc}
          ios-src={iosSrc}
          alt={alt}
          poster={poster}
          camera-controls
          disable-pan
          disable-tap
          auto-rotate
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          className="w-full h-full"
        />
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
      
      {/* Dim overlay while loading */}
      {canPreview3d && !isLoaded && (
        <div className="absolute inset-0 bg-warm-white/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown" />
        </div>
      )}

      {/* AR Button */}
      {canStartAr && (isLoaded || !canPreview3d) && !isPresentingAr && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            {isIOS && !canPreview3d ? (
              <a
                href={iosSrc}
                rel="ar"
                onClick={handleActivateAR}
                className="bg-brand-brown text-white px-8 py-4 rounded-xl shadow-lg inline-flex items-center gap-3 font-medium hover:bg-brand-charcoal transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Примерить в комнате
              </a>
            ) : (
              <button 
                  onClick={handleActivateAR}
                  className="bg-brand-brown text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 font-medium hover:bg-brand-charcoal transition-colors"
              >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Примерить в комнате
              </button>
            )}
        </div>
      )}
      
      {/* Close Button */}
      {onClose && !isPresentingAr && (
        <button
          onClick={() => {
            const durationSec = finishArIfNeeded();
            onClose(durationSec ?? undefined);
          }}
          className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft z-20 hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5 text-soft-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
    </div>
  );
};

export const ARViewer = memo(ARViewerComponent);
