import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ObjectPublic, ScenePresetPublic } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, CheckCircleIcon } from './icons/index';
import { ScenePreview3D } from './ScenePreview3D';
import { useToast } from '../contexts/ToastContext';
import { useExperience } from '../contexts/ExperienceContext';
import { trackJourneyEvent } from '../lib/journey/client';
import { getBrowserEnvironment, openInChromeAndroid, openInSafari } from '../lib/browserUtils';

const SceneARViewer = dynamic(() => import('./SceneARViewer').then((m) => m.SceneARViewer), { ssr: false });

interface SceneDetailProps {
  scene: ScenePresetPublic;
  objects: ObjectPublic[];
  onBack: () => void;
}

type SupportsAr = boolean | null;

const SceneDetailComponent: React.FC<SceneDetailProps> = ({ scene, objects, onBack }) => {
  const { addToast } = useToast();
  const { emitEvent } = useExperience();
  const [isArOpen, setIsArOpen] = useState(false);
  const [supportsWebXrAr, setSupportsWebXrAr] = useState<SupportsAr>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const opened3dRef = useRef(false);

  useEffect(() => {
    trackJourneyEvent({ type: 'VIEW_OBJECT', objectId: scene.id });
    emitEvent({ type: 'VIEW_OBJECT', objectId: scene.id, name: scene.title, objectType: 'scene' });
  }, [emitEvent, scene.id, scene.title]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !(navigator as any).xr?.isSessionSupported) {
      setSupportsWebXrAr(false);
      return;
    }
    let active = true;
    (navigator as any).xr
      .isSessionSupported('immersive-ar')
      .then((v: boolean) => {
        if (active) setSupportsWebXrAr(Boolean(v));
      })
      .catch(() => {
        if (active) setSupportsWebXrAr(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sceneObjects = scene.objects || [];

  const objectsById = useMemo(() => {
    const map = new Map<string, ObjectPublic>();
    for (const o of objects) map.set(o.id, o);
    return map;
  }, [objects]);

  const composedObjects = useMemo(() => {
    const isDev = process.env.NODE_ENV === 'development';
    return sceneObjects
      .map((entry) => objectsById.get(entry.objectId))
      .filter((v): v is ObjectPublic => {
        if (!v) return false;

        if (!isDev) {
          if (v.status === 'archived') return false;

          // Allow soft furniture drafts
          const SOFT_CATEGORIES = ['Мягкая мебель', 'sofa', 'Диваны', 'Кресла', 'Пуфы'];
          const category = v.category || '';
          const type = v.objectType || '';
          const isSoft = SOFT_CATEGORIES.some(c =>
            category.toLowerCase() === c.toLowerCase() ||
            type.toLowerCase() === c.toLowerCase()
          );

          if (!isSoft && v.status === 'draft') return false;
        }
        return true;
      });
  }, [objectsById, sceneObjects]);

  if (isArOpen) {
    return (
      <SceneARViewer
        scene={scene}
        objects={objects}
        onClose={(durationSec) => {
          setIsArOpen(false);
          emitEvent({ type: 'EXIT_AR', ...(typeof durationSec === 'number' ? { durationSec } : {}) });
        }}
        onSessionStart={() => emitEvent({ type: 'ENTER_AR' })}
      />
    );
  }

  const handleTrySceneAr = () => {
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
            openInChromeAndroid();
          } else {
            openInSafari();
          }
        }
        // ALWAYS exit here - never proceed to AR init in unsupported browsers
        return;
      }
    }

    if (supportsWebXrAr === false) {
      addToast('AR-комплекты доступны в Chrome на Android. На iPhone можно примерять предметы по отдельности.', 'info');
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (supportsWebXrAr === null) {
      addToast('Проверяю поддержку AR…', 'info', 1500);
      return;
    }
    emitEvent({ type: 'ENTER_AR' });
    setIsArOpen(true);
  };

  const enter3d = () => {
    emitEvent({ type: 'ENTER_3D' });
    if (!opened3dRef.current) {
      opened3dRef.current = true;
      emitEvent({ type: 'VIEW_3D' });
      trackJourneyEvent({ type: 'OPEN_3D', objectId: scene.id });
    }
  };

  const exit3d = () => {
    emitEvent({ type: 'EXIT_3D' });
  };

  return (
    <div className="bg-warm-white min-h-screen">
      <div className="container mx-auto px-6 py-10 md:py-14">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-beige/10 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-soft-black" />
          </button>
          <span className="text-sm text-muted-gray">Назад</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          <div className="space-y-8">
            <div
              className="relative w-full aspect-[4/3] rounded-2xl bg-white shadow-soft border border-stone-beige/20"
              onPointerDown={enter3d}
              onPointerUp={exit3d}
              onPointerCancel={exit3d}
              onPointerLeave={exit3d}
            >
              <ScenePreview3D className="w-full h-full" sceneObjects={sceneObjects} allObjects={objects} />
            </div>
          </div>

          <div className="flex flex-col pt-2 pb-24 md:pb-0">
            <div className="inline-flex items-center gap-2 mb-6 text-sm text-soft-black/60 bg-white/50 px-3 py-1.5 rounded-full border border-stone-beige/20 w-fit">
              <CheckCircleIcon className="w-4 h-4 text-brand-gold" />
              Композиция из отдельных предметов
            </div>

            <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-6 leading-tight tracking-tight">
              {scene.title}
            </h1>

            {scene.description && (
              <p className="text-muted-gray leading-relaxed mb-10 max-w-prose">{scene.description}</p>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleTrySceneAr}
                size="lg"
                variant="primary"
                className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-soft-black/10"
              >
                Примерить комплект в комнате
              </Button>

              <button
                type="button"
                onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="w-full text-sm text-muted-gray hover:text-soft-black transition-colors py-2"
              >
                Примерить по отдельности
              </button>
            </div>

            <div ref={listRef} className="mt-12">
              <h2 className="text-lg font-semibold text-soft-black mb-4">Состав</h2>
              <div className="space-y-3">
                {composedObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className="flex items-center justify-between gap-4 bg-white rounded-xl border border-stone-beige/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-soft-black truncate">{obj.name}</div>
                      <div className="text-xs text-muted-gray">{obj.objectType || 'объект'}</div>
                    </div>
                    <Link
                      href={`/objects/${obj.id}`}
                      prefetch={false}
                      className="text-sm font-semibold text-brand-brown hover:text-brand-charcoal transition-colors"
                    >
                      Открыть
                    </Link>
                  </div>
                ))}
                {composedObjects.length === 0 && (
                  <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    Эта сцена ещё не настроена: добавьте предметы в админке.
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-gray mt-6 leading-relaxed">
                На iPhone (Quick Look) пока доступна примерка предметов по отдельности. Комплекты в AR требуют WebXR.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SceneDetail = memo(SceneDetailComponent);
