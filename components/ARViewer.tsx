
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowsPointingOutIcon, XMarkIcon } from './icons';
import type { Product } from '../types';

interface ARViewerProps {
  src: string;
  iosSrc?: string;
  poster?: string;
  alt: string;
  product?: Product;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

// Умный прокси-роутер
const toProxyUrl = (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith('blob:') || src.startsWith('/') || src.startsWith('data:')) return src;
  
  const ext = src.split('.').pop()?.toLowerCase().split('?')[0];

  if (ext === 'usdz') {
    return `/api/proxy-model.usdz?url=${encodeURIComponent(src)}`;
  }
  if (ext === 'glb') {
    return `/api/proxy-model.glb?url=${encodeURIComponent(src)}`;
  }
  
  return `/api/proxy-model?url=${encodeURIComponent(src)}`;
};

// LABEL GUIDE: Шаг 5. AR/3D. 
// Сразу, без объяснений. Без обучения, окон, текста. 
// Пользователь ставит, двигает, смотрит.

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt }) => {
  const modelViewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const glbSrc = useMemo(() => toProxyUrl(src), [src]);
  const usdzSrc = useMemo(() => toProxyUrl(iosSrc), [iosSrc]);

  useEffect(() => {
    import('@google/model-viewer').catch(console.error);

    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleLoad = () => setIsLoading(false);
    viewer.addEventListener('load', handleLoad);

    return () => {
      viewer.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <div className='relative w-full h-full bg-warm-white'>
      
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-warm-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3 p-4 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-soft-black"></div>
                <span className="text-sm font-medium text-soft-black">Загрузка...</span>
            </div>
        </div>
      )}

      <model-viewer
        ref={modelViewerRef}
        src={glbSrc}
        ios-src={usdzSrc}
        poster={poster}
        alt={alt}
        camera-controls
        touch-action="pan-y"
        ar
        ar-modes="webxr scene-viewer quick-look"
        style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
        className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
      >
        {/* Кнопка AR теперь управляется через CSS переменные model-viewer */}
        <button slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-soft-black text-white px-6 py-3 rounded-xl font-medium shadow-soft">
          Посмотреть в AR
        </button>
      </model-viewer>
    </div>
  );
};
