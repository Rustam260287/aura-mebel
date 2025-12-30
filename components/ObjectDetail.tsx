
import React, { useState, memo, useEffect, useRef } from 'react';
import type { ObjectPublic } from '../types';
import { Button } from './Button';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
} from './icons';
import { useRouter } from 'next/router';
import { useSaved } from '../contexts/SavedContext';
import { useToast } from '../contexts/ToastContext';
import { ARViewer } from './ARViewer';
import Image from 'next/image';
import { Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { trackJourneyEvent } from '../lib/journey/client';
import { autofitModelViewer } from '../lib/3d/model-viewer-autofit';
import { useExperience } from '../contexts/ExperienceContext';

interface ObjectDetailProps {
  object: ObjectPublic;
  onBack: () => void;
}

type Inline3DState = 'idle' | 'loading' | 'loaded' | 'error';

const ObjectDetailComponent: React.FC<ObjectDetailProps> = ({
  object,
  onBack,
}) => {
  const router = useRouter();
  const { state: experienceState, emitEvent } = useExperience();
  const [isAROpen, setIsAROpen] = useState(false);
  const [experienceCompleted, setExperienceCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [show3DHint, setShow3DHint] = useState(false);
  const [inline3dState, setInline3dState] = useState<Inline3DState>('idle');
  const [inline3dError, setInline3dError] = useState<string | null>(null);
  const [inline3dProgress, setInline3dProgress] = useState<number | null>(null);

  const { isSaved, addToSaved } = useSaved();
  const { addToast } = useToast();
  const alreadySaved = isSaved(object.id);
  const inlineModelViewerRef = useRef<HTMLElement | null>(null);
  const open3dLoggedForObjectRef = useRef<string | null>(null);

  const hasGlb = Boolean(object.modelGlbUrl);
  const hasUsdz = Boolean(object.modelUsdzUrl);
  // Use same-origin proxy to avoid CORS/Range issues when model-viewer streams GLB (Range requests).
  const threeDSrcUrl = hasGlb
    ? `/api/proxy-model?url=${encodeURIComponent(object.modelGlbUrl!)}`
    : undefined;

  useEffect(() => {
    trackJourneyEvent({ type: 'VIEW_OBJECT', objectId: object.id });
  }, [object.id]);

  useEffect(() => {
    emitEvent({ type: 'VIEW_OBJECT', objectId: object.id, name: object.name, objectType: object.objectType });
  }, [emitEvent, object.id, object.name, object.objectType]);

  const handleTryAR = () => {
    if (!canStartAr) {
      addToast('AR‑примерка сейчас недоступна для этого устройства', 'info');
      return;
    }
    emitEvent({ type: 'ENTER_AR' });
    setIsAROpen(true);
  };

  const closeAR = (durationSec?: number) => {
    setIsAROpen(false);
    setExperienceCompleted(true);
    emitEvent({ type: 'EXIT_AR', durationSec });
  };

  const handleSaveToSaved = () => {
    if (!alreadySaved) {
      addToSaved(object.id);
    }
  };

  const handleOpenSaved = () => router.push('/saved');

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };
    updateIsMobile();

    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

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
    if (!hasGlb || !threeDSrcUrl) {
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
  }, [emitEvent, object.id, hasGlb, threeDSrcUrl]);

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

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !hasGlb
    ) {
      setShow3DHint(false);
      return undefined;
    }

    try {
      if (localStorage.getItem('label_3d_hint_shown')) {
        setShow3DHint(false);
        return undefined;
      }
    } catch {
      setShow3DHint(false);
      return undefined;
    }

    setShow3DHint(true);
    const timer = setTimeout(() => {
      setShow3DHint(false);
      try {
        localStorage.setItem('label_3d_hint_shown', '1');
      } catch {}
    }, 2500);

    return () => clearTimeout(timer);
  }, [hasGlb]);

  const ctaWrapperClass = isMobile
    ? 'fixed bottom-4 left-4 right-4 z-cta md:static md:mt-12'
    : 'mt-auto';

  const canStartAr = isMobile ? (isIOS ? hasUsdz : hasGlb) : hasGlb;

  if (isAROpen && canStartAr && (object.modelGlbUrl || object.modelUsdzUrl)) {
    return (
      <ARViewer
        src={object.modelGlbUrl}
        iosSrc={object.modelUsdzUrl}
        alt={object.name}
        poster={object.imageUrls?.[0]}
        objectId={object.id}
        onClose={closeAR}
      />
    );
  }

  const primaryCta =
    experienceCompleted
      ? {
          label: 'Задать вопрос',
          onClick: () => {
            if (experienceState === 'THREE_D_ACTIVE') {
              emitEvent({ type: 'EXIT_3D' });
            }
            emitEvent({ type: 'OPEN_ASSISTANT' });
          },
        }
      : !canStartAr
        ? {
            label: alreadySaved ? 'Открыть подборку' : 'Сохранить в подборку',
            onClick: alreadySaved ? handleOpenSaved : handleSaveToSaved,
          }
        : {
            label: 'Примерить в комнате',
            onClick: handleTryAR,
          };

  const ctaVariant: 'primary' | 'secondary' =
    experienceCompleted ? 'primary' : canStartAr ? (isMobile ? 'primary' : 'secondary') : 'primary';

  return (
    <div className="bg-warm-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center text-sm text-muted-gray hover:text-soft-black transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Назад
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Visual block */}
          <div className="flex flex-col gap-16">
            <div
              className={[
                'relative w-full mb-10 rounded-2xl bg-white shadow-soft ring-1 ring-black/5',
                isMobile ? 'h-[70vh] max-h-[520px]' : 'aspect-[4/3] min-h-[360px]',
              ].join(' ')}
            >
              {hasGlb && threeDSrcUrl ? (
                <>
                  <div className="absolute inset-0 p-4">
                    <model-viewer
                      key={threeDSrcUrl}
                      ref={inlineModelViewerRef as any}
                      src={threeDSrcUrl}
                      poster={object.imageUrls?.[0]}
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
                      className="w-full h-full bg-white rounded-2xl"
                    />
                  </div>

                  {(inline3dState === 'loading' || inline3dState === 'idle') && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                      <div className="flex flex-col items-center gap-2 text-center px-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown" />
                        <div className="text-sm font-medium text-soft-black/70">
                          {inline3dProgress != null && inline3dProgress > 0
                            ? `Загружаю 3D… ${Math.round(inline3dProgress * 100)}%`
                            : 'Загружаю 3D…'}
                        </div>
                        <div className="text-xs text-muted-gray">Можно спокойно подождать пару секунд.</div>
                      </div>
                    </div>
                  )}

                  {inline3dState === 'error' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                      <div className="flex flex-col items-center gap-2 text-center px-6">
                        <div className="text-sm font-medium text-soft-black">3D сейчас недоступно</div>
                        <div className="text-xs text-muted-gray">{inline3dError || 'Попробуйте обновить страницу.'}</div>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {show3DHint && inline3dState === 'loaded' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2
                                   bg-soft-black/60 text-white text-xs
                                   px-4 py-2 rounded-full pointer-events-none"
                      >
                        Поверните объект, чтобы рассмотреть
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center">
                  <div className="max-w-sm">
                    <div className="text-sm font-medium text-soft-black">3D‑модель готовится</div>
                    <p className="mt-2 text-xs text-muted-gray leading-relaxed">
                      Этот объект уже можно рассмотреть по фото. 3D‑просмотр для браузера добавим, как только модель будет готова.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {(object.imageUrls?.length ? object.imageUrls : ['/placeholder.svg']).map(
              (src, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-soft"
                >
                  <Image
                    src={src}
                    alt={`${object.name} — view ${index + 1}`}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    className="object-contain"
                  />
                </div>
              )
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col pt-4 justify-center pb-32 md:pb-0">
            <Transition
              show={experienceCompleted}
              enter="transition-all duration-500 ease-out"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
            >
              <div className="inline-flex items-center gap-2 mb-6 text-sm text-soft-black/60 bg-white/50 px-3 py-1.5 rounded-full border border-stone-beige/20 w-fit">
                <CheckCircleIcon className="w-4 h-4 text-brand-gold" />
                Вы примерили этот объект
              </div>
            </Transition>

            <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-10 leading-tight tracking-tight">
              {object.name}
            </h1>

            <div className={ctaWrapperClass}>
              <Button
                onClick={primaryCta.onClick}
                size="lg"
                variant={ctaVariant}
                className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-soft-black/10"
              >
                {primaryCta.label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ObjectDetail = memo(ObjectDetailComponent);
