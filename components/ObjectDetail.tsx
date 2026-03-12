import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { PostARBridge } from './ar/PostARBridge';
import { useRouter } from 'next/router';
import type { ObjectPublic } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, CubeIcon, HeartIcon, PhotoIcon } from './icons/index';
import { useSaved } from '../contexts/SavedContext';
import { useToast } from '../contexts/ToastContext';
import { ARViewer, type ARViewerHandle } from './ARViewer';
import { SceneARViewerV2, shouldUseSceneARV2 } from '../lib/ar/v2';
import { trackJourneyEvent, startViewTimer, stopViewTimer } from '../lib/journey/client';
import { autofitModelViewer } from '../lib/3d/model-viewer-autofit';
import { useExperience } from '../contexts/ExperienceContext';
import { useAssistant } from '../contexts/AssistantContext';
import { optimizeScene } from '../lib/3d/optimizer';
import { getArEnvironment, openInChromeAndroid, openInSafari } from '../lib/browserUtils';
import { formatModelViewerScale, parseObjectRuntimeScale } from '../lib/objects/runtimeScale';

interface ObjectDetailProps {
  object: ObjectPublic;
  onBack: () => void;
}

type Inline3DState = 'idle' | 'loading' | 'loaded' | 'error';
type MediaMode = 'photo' | '3d';
type ObjectPageUiState = 'DEFAULT' | 'IN_AR' | 'POST_AR';

const ObjectDetailComponent: React.FC<ObjectDetailProps> = ({
  object,
  onBack,
}) => {
  const router = useRouter();
  const { state: experienceState, emitEvent } = useExperience();
  const { emitMetaEvent } = useAssistant();
  const [isAROpen, setIsAROpen] = useState(false);
  const [uiState, setUiState] = useState<ObjectPageUiState>('DEFAULT');
  const [mediaMode, setMediaMode] = useState<MediaMode>('photo');
  const [showSceneARV2, setShowSceneARV2] = useState(false);
  const [inline3dState, setInline3dState] = useState<Inline3DState>('idle');
  // v1.1: AR Snapshot State

  const [inline3dProgress, setInline3dProgress] = useState<number | null>(null);
  const [inline3dError, setInline3dError] = useState<string | null>(null);
  const [postArHintVisible, setPostArHintVisible] = useState(false);
  const [showExternalBrowserModal, setShowExternalBrowserModal] = useState(false);

  const arEnv = useMemo(() => getArEnvironment(), []);
  const isIOSDevice = arEnv.platform === 'ios';
  const wizardScale = useMemo(() => parseObjectRuntimeScale(router.query.wizardScale), [router.query.wizardScale]);
  const modelViewerScale = useMemo(() => formatModelViewerScale(wizardScale), [wizardScale]);

  // Architecture Switch: Strict V1/V2 separation
  const shouldUseV2 = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !isIOSDevice && shouldUseSceneARV2();
  }, [isIOSDevice]);

  const { isSaved, addToSaved, removeFromSaved } = useSaved();
  const { addToast } = useToast();
  const isObjectSaved = isSaved(object.id);

  // View time tracking - starts on mount, stops on unmount or object change
  useEffect(() => {
    if (!object?.id) return;
    startViewTimer(object.id);
    return () => {
      stopViewTimer(object.id);
    };
  }, [object.id]);
  const inlineModelViewerRef = useRef<HTMLElement | null>(null);
  const arViewerRef = useRef<ARViewerHandle | null>(null);
  const open3dLoggedForObjectRef = useRef<string | null>(null);
  const lastArTouchMsRef = useRef<number>(0);

  const hasGlb = Boolean(object.modelGlbUrl);
  const hasUsdz = Boolean(object.modelUsdzUrl);
  // Use same-origin proxy to avoid CORS/Range issues when model-viewer streams GLB (Range requests).
  const threeDSrcUrl = hasGlb
    ? `/api/proxy-model.glb?url=${encodeURIComponent(object.modelGlbUrl!)}`
    : undefined;
  const canPreview3d = Boolean(threeDSrcUrl);

  const v2Objects = useMemo(() => {
    if (!object.id || !threeDSrcUrl) return [];
    return [{
      objectId: object.id,
      name: object.name,
      modelGlbUrl: threeDSrcUrl,
      scale: wizardScale ?? 1,
    }];
  }, [object.id, object.name, threeDSrcUrl, wizardScale]);

  useEffect(() => {
    trackJourneyEvent({ type: 'VIEW_OBJECT', objectId: object.id });
  }, [object.id]);

  useEffect(() => {
    emitEvent({ type: 'VIEW_OBJECT', objectId: object.id, name: object.name, objectType: object.objectType });
  }, [emitEvent, object.id, object.name, object.objectType]);

  const closeAR = useCallback(
    (durationSec?: number, hasStarted?: boolean, isFailed?: boolean) => {
      console.log('[ObjectDetail] closeAR called', { durationSec, hasStarted, isFailed });

      // 1. Synchronous state reset (order matters!)
      setShowSceneARV2(false);
      setIsAROpen(false);

      if (isFailed) {
        setShowExternalBrowserModal(true);
      }

      // 2. STRICT: Only go to POST_AR if hasStarted is EXPLICITLY true
      // This prevents false POST_AR from any code path where XR never actually started
      if (!isFailed && hasStarted === true) {
        setUiState('POST_AR');
      } else {
        setUiState('DEFAULT');
      }

      // 3. Emit analytics
      emitEvent({ type: 'EXIT_AR', durationSec });

      // 4. CRITICAL: Resume model-viewer AFTER AR cleanup
      // Double RAF to ensure AR WebGL context is fully disposed
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const mv = inlineModelViewerRef.current as any;
          if (mv) {
            console.log('[3D] Resuming model-viewer after AR');
            mv.style.visibility = 'visible';
            mv.play?.();
          }
        });
      });

      // 5. Dev assertion: Ensure no AR canvas remains
      if (process.env.NODE_ENV === 'development') {
        requestAnimationFrame(() => {
          const leftoverCanvas = document.querySelector('canvas[data-ar]');
          if (leftoverCanvas) {
            console.error('[ObjectDetail] WARNING: AR canvas not cleaned up!', leftoverCanvas);
          }
        });
      }
    },
    [emitEvent],
  );

  useEffect(() => {
    const reset = () => {
      setUiState('DEFAULT');
      setPostArHintVisible(false);
    };
    router.events.on('routeChangeStart', reset);
    return () => {
      router.events.off('routeChangeStart', reset);
    };
  }, [router.events]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (uiState !== 'IN_AR') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [uiState]);

  // --- Meta-Agent Integration: Tracking & Notifications ---
  // Replaces local hint logic with centralized Agent logic.

  // 1. Session Start (User Entered Object)
  useEffect(() => {
    emitMetaEvent({ type: 'USER_ENTERED_OBJECT', payload: { objectId: object.id } });
  }, [emitMetaEvent, object.id]);

  // 2. Clear Hints on Exit
  useEffect(() => {
    if (uiState !== 'POST_AR') {
      // Agent handles state, UI just renders what Agent says in ChatBubble.
      // We don't need local state for hints anymore unless for animation.
      setPostArHintVisible(false); // Keep for legacy or transitions if needed, but logic is moved.
    }
  }, [uiState]);


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
        const ready = async () => {
          try {
            if (typeof window.customElements?.whenDefined === 'function') {
              await Promise.race([
                window.customElements.whenDefined('model-viewer'),
                new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 6000)),
              ]);
              return true;
            }
            const defined = typeof window.customElements?.get === 'function' && window.customElements.get('model-viewer');
            return Boolean(defined);
          } catch {
            return false;
          }
        };
        void ready().then((ok) => {
          if (ok) return;
          setInline3dState('error');
          setInline3dError('Не удалось инициализировать 3D‑просмотр. Обновите страницу.');
        });
      }, 300);

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
      console.log('[ObjectDetail] handleLoad triggered for element:', el);
      clearTimers();
      setInline3dError(null);

      // Aura 3D Optimization
      try {
        console.log('[ObjectDetail] Checking properties of model-viewer element...');
        // Try known symbol descriptions for model-viewer v1/v2/v3
        const symbols = Object.getOwnPropertySymbols(el);
        const symbol = symbols.find(s => s.description === 'model-viewer' || s.description === 'model-viewer-internal-symbol');

        if (symbol) {
          const internal = (el as any)[symbol];
          const scene = internal?.model?.scene || internal?.scene;

          if (scene) {
            console.log('[ObjectDetail] Three.js scene found via symbol, running optimizer...');
            optimizeScene(scene);
          } else {
            console.warn('[ObjectDetail] Symbol found but scene property missing on internal object:', internal);
          }
        } else {
          // Fallback: Check if there is a direct 'model' property (sometimes exposed in dev builds or newer versions)
          // or try to find any property that looks like a scene
          console.warn('[ObjectDetail] No model-viewer symbol found. Available symbols:', symbols.map(s => s.description));
        }

        // DOUBLE CHECK: Call optimizeScene blindly with el if smart check fails, 
        // because optimizeScene now has safety checks inside? No, it expects a scene.
        // But let's log what we have.
      } catch (err) {
        console.error('[ObjectDetail] Error in handleLoad optimizer:', err);
      }

      try {
        autofitModelViewer(el, wizardScale != null ? { targetSize: wizardScale } : undefined);
      } catch { }
      if (typeof (el as any).zoomTo === 'function') {
        try {
          (el as any).zoomTo({ duration: 300 });
        } catch { }
      } else if (typeof (el as any).jumpCameraToGoal === 'function') {
        try {
          (el as any).jumpCameraToGoal();
        } catch { }
      }
      // Fallback: some builds/environments do not emit `model-visibility` reliably.
      requestAnimationFrame(() => {
        setInline3dState('loaded');
      });
      emitEvent({ type: 'VIEW_3D' });
      emitMetaEvent({ type: 'OPENED_3D' });
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
        autofitModelViewer(el, wizardScale != null ? { targetSize: wizardScale } : undefined);
      } catch { }
      if (typeof el.zoomTo === 'function') {
        try {
          el.zoomTo({ duration: 300 });
        } catch { }
      } else if (typeof el.jumpCameraToGoal === 'function') {
        try {
          el.jumpCameraToGoal();
        } catch { }
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
  }, [emitEvent, mediaMode, object.id, hasGlb, threeDSrcUrl, wizardScale]);

  useEffect(() => {
    const el = inlineModelViewerRef.current as any;
    if (!el || inline3dState !== 'loaded') return undefined;

    let raf = 0;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          autofitModelViewer(el, wizardScale != null ? { targetSize: wizardScale } : undefined);
        } catch { }
      });
    };

    schedule();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      try {
        ro.observe(el);
      } catch { }
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
  }, [inline3dState, threeDSrcUrl, wizardScale]);

  const validImages = useMemo(() => {
    const urls = object.imageUrls || [];
    return urls.filter(url => url && !url.includes('unsplash.com') && !url.includes('placeholder'));
  }, [object.imageUrls]);

  const images = validImages; // No placeholder fallback interaction


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

  const handleOpenAssistant = useCallback(() => {
    if (experienceState === 'AR_ACTIVE') return;
    if (experienceState === 'THREE_D_ACTIVE') {
      emitEvent({ type: 'EXIT_3D' });
    }
    emitMetaEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'object_detail_button' } });
  }, [emitEvent, emitMetaEvent, experienceState]);

  const handleBack = useCallback(() => {
    // If onBack is provided (e.g. from ObjectSheet overlay), use it directly
    onBack();
  }, [onBack]);

  const arUnavailableTrackedRef = useRef(false);
  const handleOpenAr = useCallback(() => {
    // 1. Detection on Click (New Architecture)
    const env = getArEnvironment();

    if (env.requiresExternalBrowser) {
      setShowExternalBrowserModal(true);
      if (env.platform === 'android') {
        openInChromeAndroid(); // Трим попытку автоматического редиректа
      }
      trackJourneyEvent({
        type: 'BROWSER_LIMITATION_DETECTED',
        meta: { limitations: { reason: 'in_app_browser', browser: 'webview', platform: env.platform, timestamp: new Date().toISOString() } }
      });
      return; // ЖЁСТКИЙ СТОП
    }

    // 2. Logic Selection (Android WebXR)
    if (env.platform === 'android') {
      if (!env.canUseWebXR) {
        addToast('AR недоступен на этом устройстве', 'info');
        return;
      }

      if (!hasGlb) {
        addToast('AR недоступен для этого объекта', 'info');
        return;
      }

      emitEvent({ type: 'ENTER_AR' });
      emitMetaEvent({ type: 'OPENED_AR' });
      setPostArHintVisible(false);
      setUiState('IN_AR');

      // CRITICAL: Pause model-viewer BEFORE opening AR
      const mv = inlineModelViewerRef.current as any;
      if (mv) {
        mv.pause?.();
        mv.style.visibility = 'hidden';
      }

      setShowSceneARV2(true);
      return;
    }

    // 3. Logic Selection (iOS Quick Look)
    if (env.platform === 'ios') {
      if (!env.canUseQuickLook) {
        setShowExternalBrowserModal(true);
        return; // ЖЁСТКИЙ СТОП
      }

      if (!hasUsdz) {
        addToast('AR недоступен для этого объекта', 'info');
        return;
      }

      emitEvent({ type: 'ENTER_AR' });
      emitMetaEvent({ type: 'OPENED_AR' });
      setPostArHintVisible(false);
      setIsAROpen(true);
      setTimeout(() => arViewerRef.current?.activateAR(), 100);
      return;
    }
  }, [emitEvent, emitMetaEvent, hasGlb, hasUsdz, addToast, setShowExternalBrowserModal]);

  const handleOpenArTap = useCallback(
    (event?: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now();
      const isTouch = Boolean((event as any)?.changedTouches);
      if (isTouch) {
        lastArTouchMsRef.current = now;
        handleOpenAr();
        return;
      }

      // Avoid duplicate click after touch (mobile browsers fire both).
      if (now - lastArTouchMsRef.current < 650) return;
      handleOpenAr();
    },
    [handleOpenAr],
  );

  const [isShareCapturing, setIsShareCapturing] = useState(false);

  // Simple link-only share (no screenshots)
  const handleShare = useCallback(async () => {
    if (isShareCapturing) return;
    if (!object.id) return;

    setIsShareCapturing(true);

    try {
      // Create share link via API
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId: object.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const { shareUrl } = await response.json();

      // Share via Web Share API or clipboard
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            text: 'Посмотри, как этот предмет смотрится в интерьере ✨',
            url: shareUrl,
          });
          addToast('Отправлено!', 'success', 2000);
          trackJourneyEvent({ type: 'AR_SNAPSHOT_SHARED', objectId: object.id }); // Reusing for share link
        } catch (e) {
          if ((e as Error).name === 'AbortError') {
            // User cancelled - silent (Quiet UX)
          } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(shareUrl);
            addToast('Ссылка скопирована', 'success', 2000);
          }
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        addToast('Ссылка скопирована', 'success', 2000);
      }
    } catch (e) {
      console.warn('[ARViewer] share failed:', e);
      addToast('Не удалось создать ссылку', 'error', 2000);
    } finally {
      setIsShareCapturing(false);
    }
  }, [addToast, isShareCapturing, object.id]);

  const arAvailability = useMemo(() => {
    if (arEnv.platform === 'ios') {
      return hasUsdz ? { available: true, message: null } : { available: false, message: 'AR недоступен для этой модели' };
    }
    if (arEnv.platform === 'android') {
      if (!hasGlb) return { available: false, message: 'AR недоступен для этой модели' };
      if (arEnv.requiresExternalBrowser) return { available: true, message: null }; // Will trigger redirect
      if (arEnv.canUseWebXR) return { available: true, message: null };
      return { available: false, message: 'AR недоступен на этом устройстве' };
    }
    return { available: false, message: 'AR доступен только на смартфонах' };
  }, [hasGlb, hasUsdz, arEnv]);

  return (
    <div className="fixed inset-0 bg-soft-black overflow-hidden">
      {/* Media layer (fullscreen) */}
      <section className="absolute inset-0 w-screen h-[100dvh] [height:calc(var(--vh,1vh)*100)] bg-soft-black">
        <div className="absolute inset-0">
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
                scale={modelViewerScale}
                style={{ touchAction: 'pan-y', background: 'transparent' }}
                className="w-full h-full bg-transparent"
              />

              {(inline3dState === 'loading' || inline3dState === 'idle') && (
                <div className="absolute inset-0 bg-soft-black/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center px-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-beige" />
                    <div className="text-sm font-medium text-white/80">
                      {inline3dProgress != null && inline3dProgress > 0
                        ? `Загружаю 3D… ${Math.round(inline3dProgress * 100)}%`
                        : 'Загружаю 3D…'}
                    </div>
                  </div>
                </div>
              )}

              {inline3dState === 'error' && (
                <div className="absolute inset-0 bg-soft-black/75 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center px-6">
                    <div className="text-sm font-medium text-white/90">3D сейчас недоступно</div>
                    <div className="text-xs text-white/60">{inline3dError || 'Попробуйте обновить страницу.'}</div>
                  </div>
                </div>
              )}
            </>
          ) : images.length > 0 ? (
            <div
              className="absolute inset-0 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex"
              onScroll={() => {
                // Debounce this if possible, or let Agent handle spam (SessionHistory.galleryScrolled is boolean, so 1 event is enough).
                // But to avoid flooding, maybe just check if not emitted?
                // Agent status is cheap to check locally or just emit.
                // emitting once per scroll session is hard without state.
                // I'll emit it, Agent handles dedup.
                emitMetaEvent({ type: 'SCROLLED_GALLERY' });
              }}
            >
              {images.map((src, index) => (
                <div key={`${src}:${index}`} className="relative min-w-full h-full snap-center bg-transparent">
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
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/2 h-1/2 rounded-full bg-stone-beige/10 blur-[80px]" />
            </div>
          )}

          {/* Quiet legibility gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25" />
        </div>
      </section>

      {/* Top overlay */}
      {/* Top overlay */}
      <div
        className={[
          'absolute inset-x-0 top-0 z-[60] px-4 pt-[calc(env(safe-area-inset-top)+14px)]',
          'transition-opacity duration-200 ease-out',
          uiState === 'IN_AR' || isAROpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto',
        ].join(' ')}
      >
        {/* ... (Existing Top Bar Content) ... */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Назад"
            className="pointer-events-auto rounded-full bg-white/70 backdrop-blur-md border border-stone-beige/30 shadow-soft p-3 text-soft-black hover:bg-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1 px-2 text-center">
            <div className="text-xs font-medium tracking-tight text-white/80 truncate">
              {object.name}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {canPreview3d && (
              <button
                onClick={handleToggle3d}
                aria-label={mediaMode === 'photo' ? 'Открыть 3D‑просмотр' : 'Показать фото'}
                className="rounded-full bg-white/70 backdrop-blur-md border border-stone-beige/30 shadow-soft p-3 text-soft-black hover:bg-white transition-colors"
              >
                {mediaMode === 'photo' ? <CubeIcon className="w-5 h-5" /> : <PhotoIcon className="w-5 h-5" />}
              </button>
            )}



            <button
              onClick={handleSaveToggle}
              aria-label={isObjectSaved ? 'Убрать из сохранённых' : 'Сохранить'}
              className="rounded-full bg-white/70 backdrop-blur-md border border-stone-beige/30 shadow-soft p-3 text-soft-black hover:bg-white transition-colors"
            >
              <HeartIcon className={isObjectSaved ? 'w-5 h-5 fill-soft-black/80 text-soft-black/80' : 'w-5 h-5'} />
            </button>
          </div>
        </div>
      </div>

      {/* Post-AR Modal (Root Level to avoid Transform stacking context issues) */}
      {uiState === 'POST_AR' && (
        <PostARBridge
          objectId={object.id}
          objectName={object.name}

          onClose={() => {
            setUiState('DEFAULT');

          }}
          onRestart={() => {
            setUiState('DEFAULT');
            setShowSceneARV2(false);


            // 🔒 Dirty Restart Protection: 1 frame gap ensure clean WebXR remount
            requestAnimationFrame(() => {
              handleOpenAr();
            });
          }}
        />
      )}

      {/* Bottom overlay (Regular Controls) */}
      <div
        className={[
          'absolute inset-x-0 bottom-0 z-[60] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4',
          'transition-[opacity,transform] duration-300 ease-out will-change-transform',
          uiState === 'IN_AR' || isAROpen || uiState === 'POST_AR' // Hide in Post-AR too
            ? 'opacity-0 translate-y-1 pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto',
        ].join(' ')}
      >
        <div className="mx-auto w-full max-w-md flex flex-col items-center">
          {(hasGlb || hasUsdz) && (
            <Button
              onClick={handleOpenArTap}
              onTouchEnd={handleOpenArTap as any}
              size="lg"
              variant="secondary"
              className={[
                'w-full h-14 rounded-2xl shadow-sm border-none',
                'bg-white/90 backdrop-blur-md text-soft-black hover:bg-white',
                'transition-all duration-300 ease-out active:scale-[0.98]',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <CubeIcon className="w-6 h-6 text-soft-black" />
                <span className="text-[17px] font-medium tracking-tight">Поместить в интерьер</span>
              </div>
            </Button>
          )}

          {/* Assistant Secondary CTA - Quiet */}
          <button
            onClick={handleOpenAssistant}
            className="mt-4 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            Спросить ассистента
          </button>

        </div>
      </div>


      {/* AR overlay: Strict Separation V1 / V2 */}
      {
        (object.modelGlbUrl || object.modelUsdzUrl) && (
          <>
            {shouldUseV2 ? (
              /* V2: Three.js + WebXR (Android) */
              showSceneARV2 && object.modelGlbUrl && (
                <SceneARViewerV2
                  sceneId={object.id}
                  sceneTitle={object.name}
                  objects={v2Objects}
                  onClose={(duration, hasStarted) => {
                    setShowSceneARV2(false);
                    closeAR(duration, hasStarted);
                  }}
                />
              )
            ) : (
              /* V1 + iOS: model-viewer / Quick Look */
              <ARViewer
                ref={arViewerRef}
                open={isAROpen}
                src={object.modelGlbUrl}
                iosSrc={object.modelUsdzUrl}
                alt={object.name}
                poster={object.imageUrls?.[0]}
                objectId={object.id}
                initialScale={wizardScale ?? undefined}
                onClose={closeAR}
              />
            )}
          </>
        )
      }
      {showExternalBrowserModal && (
        <div className="fixed inset-0 z-[10000] bg-warm-white dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-brand-brown/10 dark:bg-white/5 flex items-center justify-center relative shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand-brown dark:text-white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </div>

          <h2 className="text-2xl font-serif italic text-soft-black dark:text-white mb-3">
            Требуется браузер
          </h2>

          <div className="text-[#6B6B6B] dark:text-[#A0A0A0] text-[15px] max-w-[280px] mb-8 text-left mx-auto space-y-2">
            <p className="font-medium text-center mb-4">AR не работает внутри мессенджеров.</p>
            <p>1. Нажмите кнопку ниже.</p>
            <p>2. Ссылка будет скопирована.</p>
            <p>3. Откройте штатный браузер экрана (Safari/Chrome).</p>
            <p>4. Вставьте ссылку в адресную строку.</p>
          </div>

          <button
            onClick={() => {
              trackJourneyEvent({
                type: 'EXTERNAL_BROWSER_REDIRECT_TRIGGERED',
                meta: { action: { type: 'redirect', timestamp: new Date().toISOString(), browser: 'webview' } }
              });
              const env = getArEnvironment();
              if (env.platform === 'android') {
                const res = openInChromeAndroid();
                if (res === 'manual_needed') {
                  addToast('Ссылка скопирована! Откройте браузер и вставьте её.', 'info', 6000);
                }
              } else {
                const res = openInSafari();
                if (res === 'manual_needed') {
                  addToast('Ссылка скопирована! Откройте Safari и вставьте её.', 'info', 6000);
                }
              }
            }}
            className="w-full max-w-[280px] bg-brand-brown hover:bg-brand-brown/90 text-white font-medium py-[15px] px-6 rounded-full transition-transform active:scale-95 shadow-soft"
          >
            {getArEnvironment().platform === 'ios' ? '👉 Открыть в Safari' : '👉 Открыть в Chrome'}
          </button>

          <button
            onClick={() => setShowExternalBrowserModal(false)}
            className="mt-6 text-[15px] font-medium text-[#8E8E8E] px-4 py-2 hover:text-soft-black transition-colors"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
};

export const ObjectDetail = memo(ObjectDetailComponent);
