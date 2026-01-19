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
import { getBrowserEnvironment, openInChromeAndroid, openInSafari } from '../lib/browserUtils';

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
  const [postArSnapshot, setPostArSnapshot] = useState<string | null>(null);
  const [inline3dProgress, setInline3dProgress] = useState<number | null>(null);
  const [inline3dError, setInline3dError] = useState<string | null>(null);
  const [postArHintVisible, setPostArHintVisible] = useState(false);
  const [isIOSDevice] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && (navigator as any).maxTouchPoints > 1)
    );
  });
  const [webXrArSupported, setWebXrArSupported] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (isIOSDevice) {
      setWebXrArSupported(null);
      return;
    }
    if (typeof navigator === 'undefined') return;
    const xr = (navigator as any).xr as { isSessionSupported?: (mode: string) => Promise<boolean> } | undefined;
    if (!xr || typeof xr.isSessionSupported !== 'function') {
      setWebXrArSupported(false);
      return;
    }
    let cancelled = false;
    void xr
      .isSessionSupported('immersive-ar')
      .then((supported) => {
        if (!cancelled) setWebXrArSupported(Boolean(supported));
      })
      .catch(() => {
        if (!cancelled) setWebXrArSupported(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isIOSDevice]);

  useEffect(() => {
    trackJourneyEvent({ type: 'VIEW_OBJECT', objectId: object.id });
  }, [object.id]);

  useEffect(() => {
    emitEvent({ type: 'VIEW_OBJECT', objectId: object.id, name: object.name, objectType: object.objectType });
  }, [emitEvent, object.id, object.name, object.objectType]);

  const closeAR = useCallback(
    (durationSec?: number, hasStarted?: boolean, snapshotUrl?: string | null) => {
      console.log('[ObjectDetail] closeAR called', { durationSec, hasStarted, hasSnapshot: !!snapshotUrl });

      // STRICT: Only go to POST_AR if hasStarted is EXPLICITLY true
      // This prevents false POST_AR from any code path where XR never actually started
      if (hasStarted === true) {
        setUiState('POST_AR');
        if (snapshotUrl) {
          setPostArSnapshot(snapshotUrl);
        }
      } else {
        setUiState('DEFAULT');
      }

      setShowSceneARV2(false);
      setIsAROpen(false);

      emitEvent({ type: 'EXIT_AR', durationSec });
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

  // 1. Session Start (User Entered Object) & Time Tick
  useEffect(() => {
    const startTime = Date.now();
    emitMetaEvent({ type: 'USER_ENTERED_OBJECT', payload: { objectId: object.id } });

    const interval = setInterval(() => {
      const timeOnPage = Date.now() - startTime;
      emitMetaEvent({ type: 'TIME_TICK', payload: { timeOnPage } });
    }, 1000); // 1s tick for precision in Agent

    return () => clearInterval(interval);
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
        autofitModelViewer(el);
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
        autofitModelViewer(el);
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
  }, [inline3dState, threeDSrcUrl]);

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
    if (typeof window !== 'undefined') {
      try {
        const entry = window.sessionStorage.getItem('label_last_entry_path');
        if (entry && entry !== router.asPath) {
          router.push(entry);
          return;
        }
      } catch { }
    }
    router.push('/objects');
  }, [router]);

  const arUnavailableTrackedRef = useRef(false);
  const supportsWebXrAr = !isIOSDevice && webXrArSupported === true;
  const handleOpenAr = useCallback(() => {
    // 1. Detection on Click (New Architecture)
    // 1. Detection on Click (New Architecture)
    if (typeof window !== 'undefined') {
      const env = getBrowserEnvironment();

      if (env.requiresExternalBrowser) {
        let hasRedirected = false;
        try {
          hasRedirected = Boolean(window.sessionStorage.getItem('ar_redirected'));
        } catch { }

        if (!hasRedirected) {
          try {
            window.sessionStorage.setItem('ar_redirected', '1');
          } catch { }

          trackJourneyEvent({
            type: 'BROWSER_LIMITATION_DETECTED',
            meta: { limitations: { reason: 'in_app_browser', browser: env.browser, platform: env.platform, timestamp: new Date().toISOString() } }
          });
          trackJourneyEvent({
            type: 'EXTERNAL_BROWSER_REDIRECT_TRIGGERED',
            meta: { action: { type: 'redirect', browser: env.browser, timestamp: new Date().toISOString() } }
          });

          if (env.platform === 'android') {
            const result = openInChromeAndroid();
            if (result === 'manual_needed') {
              addToast('✨ Ссылка скопирована! Откройте Chrome и вставьте — AR заработает там.', 'info', 6000);
            }
          } else {
            openInSafari();
          }
        }
        return;
      }
    }

    // 2. Logic Selection
    if (isIOSDevice) {
      if (!hasUsdz) {
        addToast('AR недоступен для этого объекта', 'info');
        return;
      }

      emitEvent({ type: 'ENTER_AR' });
      emitMetaEvent({ type: 'OPENED_AR' });
      setPostArHintVisible(false);
      setUiState('IN_AR');
      setIsAROpen(true);
      setTimeout(() => arViewerRef.current?.activateAR(), 100);
      return;
    }

    // Android: SceneARViewer v2
    if (shouldUseV2) {
      if (!hasGlb) {
        addToast('AR недоступен для этого объекта', 'info');
        return;
      }
      // V2 is autonomous. No activateAR call, no isAROpen state.
      emitEvent({ type: 'ENTER_AR' });
      emitMetaEvent({ type: 'OPENED_AR' });
      setPostArHintVisible(false);
      setUiState('IN_AR');
      setShowSceneARV2(true);
      return;
    }

    // Android: Fallback (v1 model-viewer)
    if (!supportsWebXrAr) {
      // Log unavailability
      if (!arUnavailableTrackedRef.current) {
        arUnavailableTrackedRef.current = true;
        trackJourneyEvent({
          type: 'AR_UNAVAILABLE_WEBXR',
          objectId: object.id,
          meta: { platform: 'android', reason: 'webxr_not_supported' },
        });
      }
      addToast('AR недоступен на этом устройстве', 'info');
      return;
    }

    // V1 Activation
    emitEvent({ type: 'ENTER_AR' });
    emitMetaEvent({ type: 'OPENED_AR' });
    setPostArHintVisible(false);
    setUiState('IN_AR');
    setIsAROpen(true);
    arViewerRef.current?.activateAR();
  }, [addToast, emitEvent, hasGlb, hasUsdz, isIOSDevice, supportsWebXrAr, object.id, emitMetaEvent, shouldUseV2]);

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
    if (isIOSDevice) {
      return hasUsdz ? { available: true, message: null } : { available: false, message: 'AR недоступен для этой модели' };
    }
    if (!hasGlb) return { available: false, message: 'AR недоступен для этой модели' };
    if (webXrArSupported === true) return { available: true, message: null };
    if (webXrArSupported === false) return { available: false, message: 'AR недоступен на этом устройстве' };
    return { available: false, message: null as string | null };
  }, [hasGlb, hasUsdz, isIOSDevice, webXrArSupported]);

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
                scale="1 1 1"
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
      <div
        className={[
          'absolute inset-x-0 top-0 z-[60] px-4 pt-[calc(env(safe-area-inset-top)+14px)]',
          'transition-opacity duration-200 ease-out',
          uiState === 'IN_AR' || isAROpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto',
        ].join(' ')}
      >
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

            {experienceState !== 'THREE_D_ACTIVE' && (
              <button
                onClick={handleOpenAssistant}
                aria-label="Задать вопрос"
                className="rounded-full bg-white/70 backdrop-blur-md border border-stone-beige/30 shadow-soft p-3 text-soft-black hover:bg-white transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
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

      {/* Bottom overlay */}
      <div
        className={[
          'absolute inset-x-0 bottom-0 z-[60] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4',
          'transition-[opacity,transform] duration-300 ease-out will-change-transform',
          uiState === 'IN_AR' || isAROpen
            ? 'opacity-0 translate-y-1 pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto',
        ].join(' ')}
      >
        <div className="mx-auto w-full max-w-md">
          {uiState === 'POST_AR' && !isObjectSaved && (
            <div
              className={[
                'pointer-events-none mb-2 px-3 text-center text-xs text-white/55',
                'transition-opacity duration-300 ease-out',
                postArHintVisible ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              Можно сохранить, чтобы вернуться позже.
            </div>
          )}

          {uiState === 'POST_AR' ? (
            <PostARBridge
              objectId={object.id}
              objectName={object.name}
              snapshotUrl={postArSnapshot || undefined}
              onClose={() => {
                setUiState('DEFAULT');
                setPostArSnapshot(null);
              }}
              onRestart={() => {
                setUiState('DEFAULT');
                setShowSceneARV2(false);
                setPostArSnapshot(null);

                // 🔒 Dirty Restart Protection: 1 frame gap ensure clean WebXR remount
                requestAnimationFrame(() => {
                  handleOpenAr();
                });
              }}
              onSendToManager={() => {
                emitMetaEvent({
                  type: 'REQUEST_MANAGER_CONTACT',
                  payload: {
                    objectId: object.id,
                    name: object.name,
                    snapshotUrl: postArSnapshot
                  }
                });
              }}
            />
          ) : (hasGlb || hasUsdz) && (
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
              Поместить в интерьер
            </Button>
          )}
        </div>
      </div>

      {/* AR overlay: Strict Separation V1 / V2 */}
      {(object.modelGlbUrl || object.modelUsdzUrl) && (
        <>
          {shouldUseV2 ? (
            /* V2: Three.js + WebXR (Android) */
            showSceneARV2 && object.modelGlbUrl && (
              <SceneARViewerV2
                sceneId={object.id}
                sceneTitle={object.name}
                objects={[{ objectId: object.id, name: object.name, modelGlbUrl: object.modelGlbUrl }]}
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
              onClose={closeAR}
            />
          )}
        </>
      )}
    </div>
  );
};

export const ObjectDetail = memo(ObjectDetailComponent);
