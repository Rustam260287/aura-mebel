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
import { getArEnvironment, openInChromeAndroid, openInSafari } from '../lib/browserUtils';

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
  const [showExternalBrowserModal, setShowExternalBrowserModal] = useState(false);
  const [supportsWebXrAr, setSupportsWebXrAr] = useState<SupportsAr>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const opened3dRef = useRef(false);

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
        onClose={(durationSec, hasStarted) => {
          setIsArOpen(false);
          if (hasStarted === true) {
            emitEvent({ type: 'EXIT_AR', ...(typeof durationSec === 'number' ? { durationSec } : {}) });
          }
        }}
        onSessionStart={() => emitEvent({ type: 'ENTER_AR' })}
      />
    );
  }

  const handleTrySceneAr = () => {
    // 1. Detection on Click (New Architecture)
    const env = getArEnvironment();

    if (env.requiresExternalBrowser) {
      setShowExternalBrowserModal(true);
      if (env.platform === 'android') {
        openInChromeAndroid();
      }
      trackJourneyEvent({
        type: 'BROWSER_LIMITATION_DETECTED',
        meta: { limitations: { reason: 'in_app_browser', browser: 'webview', platform: env.platform, timestamp: new Date().toISOString() } }
      });
      return; // ЖЁСТКИЙ СТОП
    }

    if (env.platform === 'ios') {
      addToast('На iPhone можно примерять предметы из сцены по отдельности. Полная сцена в AR доступна на Android с WebXR.', 'info');
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!env.canUseWebXR) {
      addToast('AR не поддерживается вашим браузером или устройством.', 'info');
      return;
    }
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
              Сцена из отдельных предметов
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
                Посмотреть сцену в комнате
              </Button>

              <button
                type="button"
                onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="w-full text-sm text-muted-gray hover:text-soft-black transition-colors py-2"
              >
                Открыть предметы по отдельности
              </button>
            </div>

            <div ref={listRef} className="mt-12">
              <h2 className="text-lg font-semibold text-soft-black mb-4">Предметы в этой сцене</h2>
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
                На iPhone можно примерять предметы по отдельности. Полная сцена в AR пока доступна на устройствах с WebXR.
              </p>
            </div>
          </div>
        </div>
      </div>

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

export const SceneDetail = memo(SceneDetailComponent);
