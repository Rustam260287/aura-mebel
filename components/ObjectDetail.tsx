
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { flushSync } from 'react-dom';
import type { ObjectPublic } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, CubeIcon, HeartIcon, PhotoIcon } from './icons';
import { useSaved } from '../contexts/SavedContext';
import { useToast } from '../contexts/ToastContext';
import { ARViewer, type ARViewerHandle } from './ARViewer';
import { trackJourneyEvent } from '../lib/journey/client';
import { autofitModelViewer } from '../lib/3d/model-viewer-autofit';
import { useExperience } from '../contexts/ExperienceContext';

interface ObjectDetailProps {
  object: ObjectPublic;
  onBack: () => void;
}

type Inline3DState = 'idle' | 'loading' | 'loaded' | 'error';
type MediaMode = 'photo' | '3d';

const ObjectDetailComponent: React.FC<ObjectDetailProps> = ({
  object,
  onBack,
}) => {
  const { emitEvent } = useExperience();
  const [isAROpen, setIsAROpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>('photo');
  const [inline3dState, setInline3dState] = useState<Inline3DState>('idle');
  const [inline3dError, setInline3dError] = useState<string | null>(null);
  const [inline3dProgress, setInline3dProgress] = useState<number | null>(null);

  const { isSaved, addToSaved, removeFromSaved } = useSaved();
  const { addToast } = useToast();
  const isObjectSaved = isSaved(object.id);
  const inlineModelViewerRef = useRef<HTMLElement | null>(null);
  const arViewerRef = useRef<ARViewerHandle | null>(null);
  const open3dLoggedForObjectRef = useRef<string | null>(null);

  const hasGlb = Boolean(object.modelGlbUrl);
  const hasUsdz = Boolean(object.modelUsdzUrl);
  // Use same-origin proxy to avoid CORS/Range issues when model-viewer streams GLB (Range requests).
  const threeDSrcUrl = hasGlb
    ? `/api/proxy-model?url=${encodeURIComponent(object.modelGlbUrl!)}`
    : undefined;
  const canPreview3d = Boolean(threeDSrcUrl);

  useEffect(() => {
    trackJourneyEvent({ type: 'VIEW_OBJECT', objectId: object.id });
  }, [object.id]);

  useEffect(() => {
    emitEvent({ type: 'VIEW_OBJECT', objectId: object.id, name: object.name, objectType: object.objectType });
  }, [emitEvent, object.id, object.name, object.objectType]);

  const closeAR = useCallback(
    (durationSec?: number) => {
      setIsAROpen(false);
      emitEvent({ type: 'EXIT_AR', durationSec });
    },
    [emitEvent],
  );


  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !hasGlb
    ) {
      return undefined;
    }

    import('@google/model-viewer').catch(console.error);

    return undefined;
  }, [hasGlb]);

  useEffect(() => {
    setInline3dError(null);
    setInline3dProgress(null);
    if (mediaMode !== '3d' || !hasGlb || !threeDSrcUrl) {
      setInline3dState('idle');
      return undefined;
    }
    setInline3dState('loading');
    let upgradeTimer: number | null = null;
    let slowTimer: number | null = null;
    const clearTimers = () => {
      if (upgradeTimer != null) window.clearTimeout(upgradeTimer);
      if (slowTimer != null) window.clearTimeout(slowTimer);
      upgradeTimer = null;
      slowTimer = null;
    };

    if (typeof window !== 'undefined') {
      upgradeTimer = window.setTimeout(() => {
        try {
          const defined = typeof window.customElements?.get === 'function' && window.customElements.get('model-viewer');
          if (!defined) {
            setInline3dState('error');
            setInline3dError('Не удалось инициализировать 3D‑просмотр. Обновите страницу.');
          }
        } catch {}
      }, 2500);

      slowTimer = window.setTimeout(() => {
        setInline3dState((prev) => {
          if (prev !== 'loading') return prev;
          setInline3dError('3D‑модель загружается слишком долго. Проверьте сеть или попробуйте позже.');
          return prev;
        });
      }, 25000);
    }

    const el = inlineModelViewerRef.current as any;
    if (!el || typeof el.addEventListener !== 'function') return undefined;

    let detachGlobalExit: (() => void) | null = null;
    let idleTimer: number | null = null;

    const clearIdle = () => {
      if (idleTimer == null) return;
      window.clearTimeout(idleTimer);
      idleTimer = null;
    };

    const attachGlobalExit = (exit: () => void) => {
      if (typeof window === 'undefined') return;
      if (detachGlobalExit) return;

      const onEnd = () => exit();
      window.addEventListener('pointerup', onEnd, true);
      window.addEventListener('pointercancel', onEnd, true);
      window.addEventListener('blur', onEnd, true);
      window.addEventListener('visibilitychange', onEnd, true);

      detachGlobalExit = () => {
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        window.removeEventListener('blur', onEnd, true);
        window.removeEventListener('visibilitychange', onEnd, true);
      };
    };

    const exit3d = () => {
      clearIdle();
      detachGlobalExit?.();
      detachGlobalExit = null;
      emitEvent({ type: 'EXIT_3D' });
    };

    const scheduleIdleExit = () => {
      if (typeof window === 'undefined') return;
      clearIdle();
      idleTimer = window.setTimeout(() => {
        exit3d();
      }, 1200);
    };

    const enter3d = () => {
      emitEvent({ type: 'ENTER_3D' });
      attachGlobalExit(exit3d);
      scheduleIdleExit();
    };

    const handleError = () => {
      clearTimers();
      setInline3dState('error');
      setInline3dError('Не удалось загрузить 3D‑модель');
    };

    const handleLoad = () => {
      clearTimers();
      setInline3dError(null);
      try {
        autofitModelViewer(el);
      } catch {}
      if (typeof el.zoomTo === 'function') {
        try {
          el.zoomTo({ duration: 300 });
        } catch {}
      } else if (typeof el.jumpCameraToGoal === 'function') {
        try {
          el.jumpCameraToGoal();
        } catch {}
      }
      // Fallback: some builds/environments do not emit `model-visibility` reliably.
      requestAnimationFrame(() => {
        setInline3dState('loaded');
      });
      emitEvent({ type: 'VIEW_3D' });
      if (open3dLoggedForObjectRef.current === object.id) return;
      open3dLoggedForObjectRef.current = object.id;
      trackJourneyEvent({ type: 'OPEN_3D', objectId: object.id });
    };

    const handleVisibility = (event: any) => {
      const visible = Boolean(event?.detail?.visible);
      if (!visible) return;
      clearTimers();
      setInline3dError(null);
      setInline3dState('loaded');
      setInline3dProgress(1);
      try {
        autofitModelViewer(el);
      } catch {}
      if (typeof el.zoomTo === 'function') {
        try {
          el.zoomTo({ duration: 300 });
        } catch {}
      } else if (typeof el.jumpCameraToGoal === 'function') {
        try {
          el.jumpCameraToGoal();
        } catch {}
      }
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);
    el.addEventListener('model-visibility', handleVisibility);
    const handleProgress = (event: any) => {
      const p = event?.detail?.totalProgress;
      if (typeof p === 'number' && Number.isFinite(p)) {
        setInline3dProgress(Math.max(0, Math.min(1, p)));
      }
    };
    el.addEventListener('progress', handleProgress);
    el.addEventListener('pointerdown', enter3d);
    el.addEventListener('pointermove', scheduleIdleExit);
    el.addEventListener('wheel', scheduleIdleExit, { passive: true });
    el.addEventListener('pointerup', exit3d);
    el.addEventListener('pointercancel', exit3d);
    el.addEventListener('mouseleave', exit3d);
    el.addEventListener('pointerleave', exit3d);
    el.addEventListener('pointerout', exit3d);
    el.addEventListener('touchend', exit3d, { passive: true });
    el.addEventListener('touchcancel', exit3d, { passive: true });
    return () => {
      clearTimers();
      clearIdle();
      detachGlobalExit?.();
      detachGlobalExit = null;
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
      el.removeEventListener('model-visibility', handleVisibility);
      el.removeEventListener('progress', handleProgress);
      el.removeEventListener('pointerdown', enter3d);
      el.removeEventListener('pointermove', scheduleIdleExit);
      el.removeEventListener('wheel', scheduleIdleExit as any);
      el.removeEventListener('pointerup', exit3d);
      el.removeEventListener('pointercancel', exit3d);
      el.removeEventListener('mouseleave', exit3d);
      el.removeEventListener('pointerleave', exit3d);
      el.removeEventListener('pointerout', exit3d);
      el.removeEventListener('touchend', exit3d as any);
      el.removeEventListener('touchcancel', exit3d as any);
      exit3d();
    };
  }, [emitEvent, mediaMode, object.id, hasGlb, threeDSrcUrl]);

  useEffect(() => {
    const el = inlineModelViewerRef.current as any;
    if (!el || inline3dState !== 'loaded') return undefined;

    let raf = 0;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          autofitModelViewer(el);
        } catch {}
      });
    };

    schedule();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      try {
        ro.observe(el);
      } catch {}
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', schedule);
      window.addEventListener('orientationchange', schedule);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (typeof window !== 'undefined' && !ro) {
        window.removeEventListener('resize', schedule);
        window.removeEventListener('orientationchange', schedule);
      }
    };
  }, [inline3dState, threeDSrcUrl]);

  const images = useMemo(
    () => (object.imageUrls?.length ? object.imageUrls : ['/placeholder.svg']),
    [object.imageUrls],
  );

  const handleToggle3d = useCallback(() => {
    if (!canPreview3d) return;
    setMediaMode((prev) => (prev === 'photo' ? '3d' : 'photo'));
  }, [canPreview3d]);

  const handleSaveToggle = useCallback(() => {
    if (isObjectSaved) {
      removeFromSaved(object.id);
      return;
    }
    addToSaved(object.id);
  }, [addToSaved, isObjectSaved, object.id, removeFromSaved]);

  const handleOpenAr = useCallback(() => {
    const isIOSDevice =
      typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const canStartArNow = isIOSDevice ? hasUsdz : hasGlb;

    if (!canStartArNow) {
      addToast('AR‑примерка сейчас недоступна для этого устройства', 'info');
      return;
    }

    emitEvent({ type: 'ENTER_AR' });
    flushSync(() => setIsAROpen(true));
    arViewerRef.current?.activateAR();
  }, [addToast, emitEvent, hasGlb, hasUsdz]);

  if (isAROpen && (object.modelGlbUrl || object.modelUsdzUrl)) {
    return (
      <ARViewer
        ref={arViewerRef}
        src={object.modelGlbUrl}
        iosSrc={object.modelUsdzUrl}
        alt={object.name}
        poster={object.imageUrls?.[0]}
        objectId={object.id}
        onClose={closeAR}
      />
    );
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <section className="relative">
        <div className="relative w-full h-[62vh] max-h-[640px] bg-white">
          {mediaMode === '3d' && canPreview3d ? (
            <>
              <model-viewer
                key={threeDSrcUrl}
                ref={inlineModelViewerRef as any}
                src={threeDSrcUrl}
                poster={images[0]}
                alt={object.name}
                crossorigin="anonymous"
                camera-controls
                disable-pan
                disable-tap
                interaction-prompt="none"
                bounds="tight"
                camera-target="auto auto auto"
                field-of-view="30deg"
                exposure="1"
                shadow-intensity="0.3"
                scale="1 1 1"
                style={{ touchAction: 'pan-y' }}
                className="w-full h-full"
              />

              {(inline3dState === 'loading' || inline3dState === 'idle') && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center px-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown" />
                    <div className="text-sm font-medium text-soft-black/70">
                      {inline3dProgress != null && inline3dProgress > 0
                        ? `Загружаю 3D… ${Math.round(inline3dProgress * 100)}%`
                        : 'Загружаю 3D…'}
                    </div>
                  </div>
                </div>
              )}

              {inline3dState === 'error' && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center px-6">
                    <div className="text-sm font-medium text-soft-black">3D сейчас недоступно</div>
                    <div className="text-xs text-muted-gray">{inline3dError || 'Попробуйте обновить страницу.'}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex">
              {images.map((src, index) => (
                <div key={`${src}:${index}`} className="relative min-w-full h-full snap-center bg-white">
                  <Image
                    src={src}
                    alt={`${object.name} — view ${index + 1}`}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Soft overlay for controls legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5" />

          {/* Back */}
          <button
            onClick={onBack}
            aria-label="Назад"
            className="absolute top-4 left-4 z-10 rounded-full bg-white/70 backdrop-blur-md border border-stone-beige/30 shadow-soft p-3 text-soft-black hover:bg-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          {/* 3D toggle (icon only) */}
          {canPreview3d && (
            <button
              onClick={handleToggle3d}
              aria-label={mediaMode === 'photo' ? 'Открыть 3D‑просмотр' : 'Показать фото'}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/70 backdrop-blur-md border border-stone-beige/30 shadow-soft p-3 text-soft-black hover:bg-white transition-colors"
            >
              {mediaMode === 'photo' ? <CubeIcon className="w-5 h-5" /> : <PhotoIcon className="w-5 h-5" />}
            </button>
          )}
        </div>

        <div className="px-5 pt-5 pb-28">
          <h1 className="text-[15px] font-medium text-soft-black/80 tracking-tight truncate">
            {object.name}
          </h1>
        </div>
      </section>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-stone-beige/30 shadow-soft p-2 flex items-center gap-2">
            <Button
              onClick={handleOpenAr}
              size="lg"
              variant="primary"
              className="flex-1 h-14 rounded-xl shadow-none"
            >
              Посмотреть в интерьере
            </Button>

            <button
              onClick={handleSaveToggle}
              aria-label={isObjectSaved ? 'Убрать из сохранённых' : 'Сохранить'}
              className="h-14 w-14 rounded-xl bg-white text-soft-black border border-stone-beige/40 hover:border-soft-black/40 transition-colors flex items-center justify-center"
            >
              <HeartIcon
                className={isObjectSaved ? 'w-6 h-6 fill-brand-brown text-brand-brown' : 'w-6 h-6'}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ObjectDetail = memo(ObjectDetailComponent);
