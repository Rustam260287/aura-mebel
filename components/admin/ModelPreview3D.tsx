'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { autofitModelViewer } from '../../lib/3d/model-viewer-autofit';

type Props = {
  glbUrl?: string;
  usdzUrl?: string;
  posterUrl?: string;
  name?: string;
};

const Badge: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <span
    className={[
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
      active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200',
    ].join(' ')}
  >
    {label}
  </span>
);

export const ModelPreview3D: React.FC<Props> = ({ glbUrl, usdzUrl, posterUrl, name }) => {
  const [isReady, setIsReady] = useState(false);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    import('@google/model-viewer').then(
      () => setIsReady(true),
      () => setIsReady(false),
    );
  }, []);

  const hasGlb = typeof glbUrl === 'string' && glbUrl.length > 0;
  const hasUsdz = typeof usdzUrl === 'string' && usdzUrl.length > 0;

  const proxiedGlbUrl = useMemo(() => {
    if (!hasGlb) return undefined;
    return `/api/proxy-model?url=${encodeURIComponent(glbUrl!)}`;
  }, [glbUrl, hasGlb]);

  const proxiedUsdzUrl = useMemo(() => {
    if (!hasUsdz) return undefined;
    return `/api/proxy-model?url=${encodeURIComponent(usdzUrl!)}`;
  }, [usdzUrl, hasUsdz]);

  useEffect(() => {
    setLoadError(null);
    if (!hasGlb) {
      setLoadState('idle');
      return;
    }
    if (!isReady) {
      setLoadState('loading');
      return;
    }
    setLoadState('loading');
  }, [hasGlb, proxiedGlbUrl, isReady]);

  useEffect(() => {
    if (!hasGlb || !isReady) return;
    const el = viewerRef.current as any;
    if (!el?.addEventListener) return;

    const onLoad = () => {
      try {
        autofitModelViewer(el);
      } catch {}
      setLoadError(null);
      setLoadState('loaded');
    };
    const onError = () => {
      setLoadState('error');
      setLoadError('Не удалось загрузить 3D (проверьте доступность ссылки)');
    };

    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, [hasGlb, isReady, proxiedGlbUrl]);

  const statusLabel = useMemo(() => {
    if (hasGlb && hasUsdz) return 'GLB и USDZ загружены';
    if (hasGlb) return 'GLB загружен';
    if (hasUsdz) return 'USDZ загружен';
    return 'Превью появится после загрузки';
  }, [hasGlb, hasUsdz]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">Превью</p>
          <p className="text-xs text-gray-500 truncate">{statusLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label="GLB" active={hasGlb} />
          <Badge label="USDZ" active={hasUsdz} />
        </div>
      </div>

      {hasGlb && isReady ? (
        <div className="relative flex-1 min-h-[260px] rounded-xl border border-gray-200 bg-white p-3">
          <model-viewer
            key={proxiedGlbUrl}
            ref={(node: HTMLElement | null) => {
              viewerRef.current = node;
            }}
            src={proxiedGlbUrl}
            ios-src={hasUsdz ? proxiedUsdzUrl : undefined}
            alt={name || '3D model'}
            poster={posterUrl}
            camera-controls
            auto-rotate
            interaction-prompt="none"
            bounds="tight"
            camera-target="auto auto auto"
            field-of-view="30deg"
            shadow-intensity="0.8"
            exposure="1.0"
            className="w-full h-full rounded-lg"
          />
          {(loadState === 'loading' || loadState === 'idle') && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 rounded-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown mb-3" />
              <p className="text-sm font-medium text-gray-700">Загружаю 3D…</p>
              <p className="text-xs text-gray-500 mt-1">Это может занять несколько секунд.</p>
            </div>
          )}
          {loadState === 'error' && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 rounded-xl">
              <p className="text-sm font-semibold text-red-600">3D не загрузилось</p>
              <p className="text-xs text-gray-600 mt-1">{loadError || 'Ошибка загрузки модели'}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-[260px] rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            {hasGlb
              ? isReady
                ? 'GLB модель загружена'
                : 'Загрузка 3D-превью...'
              : hasUsdz
                ? 'USDZ модель загружена'
                : '3D модель пока не загружена'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {hasUsdz && !hasGlb
              ? 'USDZ используется для iPhone (AR Quick Look). Для 3D-превью в браузере нужен GLB.'
              : hasGlb && !isReady
                ? 'Секунду: загружаю 3D-компонент для превью.'
                : 'Загрузите GLB (Android/Web) и/или USDZ (iPhone).'}
          </p>

          {(hasGlb || hasUsdz) && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {hasGlb && (
                <a
                  href={glbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-brown hover:text-brand-charcoal underline"
                >
                  Открыть GLB
                </a>
              )}
              {hasUsdz && (
                <a
                  href={usdzUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-brown hover:text-brand-charcoal underline"
                >
                  Открыть USDZ
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
