import React, { useEffect, useMemo } from 'react';
import { useInline3D } from '../../lib/hooks/useInline3D';
import { formatModelViewerScale } from '../../lib/objects/runtimeScale';

type WizardLivePreviewProps = {
  glbUrl?: string;
  posterUrl?: string;
  objectId?: string;
  objectName: string;
  scale?: number;
};

export const WizardLivePreview: React.FC<WizardLivePreviewProps> = ({
  glbUrl,
  posterUrl,
  objectId,
  objectName,
  scale,
}) => {
  useEffect(() => {
    import('@google/model-viewer').catch(console.error);
  }, []);

  const proxiedGlbUrl = useMemo(() => {
    if (!glbUrl) return undefined;
    return `/api/proxy-model.glb?url=${encodeURIComponent(glbUrl)}`;
  }, [glbUrl]);

  const { modelViewerRef, state, error, progress } = useInline3D({
    active: Boolean(proxiedGlbUrl),
    modelUrl: proxiedGlbUrl,
    objectId,
    targetSize: scale,
  });

  if (!proxiedGlbUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-stone-beige/10 text-center px-6">
        <div className="text-4xl text-muted-gray">□</div>
        <div className="text-sm text-muted-gray">Для этого варианта пока доступно только фото-превью.</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-stone-beige/10">
      <model-viewer
        key={proxiedGlbUrl}
        ref={modelViewerRef as React.Ref<any>}
        src={proxiedGlbUrl}
        alt={objectName}
        poster={posterUrl}
        camera-controls
        interaction-prompt="none"
        auto-rotate
        bounds="tight"
        camera-target="auto auto auto"
        field-of-view="30deg"
        exposure="1"
        shadow-intensity="0.3"
        scale={formatModelViewerScale(scale)}
        style={{ touchAction: 'pan-y', background: 'transparent' }}
        className="w-full h-full bg-transparent"
      />

      {(state === 'loading' || state === 'idle') && (
        <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soft-black" />
            <div className="text-sm font-medium text-soft-black">
              {progress != null && progress > 0 ? `Загружаю 3D… ${Math.round(progress * 100)}%` : 'Загружаю 3D…'}
            </div>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 bg-white/78 backdrop-blur-[1px] flex items-center justify-center">
          <div className="max-w-[220px] text-center">
            <div className="text-sm font-medium text-soft-black">3D сейчас недоступно</div>
            <div className="mt-1 text-xs text-muted-gray">{error || 'Откройте объект, чтобы продолжить примерку.'}</div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-gray">
        3D превью
      </div>
    </div>
  );
};
