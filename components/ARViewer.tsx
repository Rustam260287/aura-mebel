
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowsPointingOutIcon, XMarkIcon, CameraIcon, ShareIcon, ShoppingCartIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import type { Product } from '../types';

interface ARViewerProps {
  src: string;
  iosSrc?: string;
  poster?: string;
  alt: string;
  product?: Product;
  onAddToCart?: () => void;
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
  
  // Fallback
  console.warn(`Unknown 3D model extension: ${ext}. Using generic proxy.`);
  return `/api/proxy-model?url=${encodeURIComponent(src)}`;
};

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt, product, onAddToCart }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modelViewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const glbSrc = useMemo(() => toProxyUrl(src), [src]);
  const usdzSrc = useMemo(() => toProxyUrl(iosSrc), [iosSrc]);

  useEffect(() => {
    import('@google/model-viewer').catch(console.error);

    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleLoad = () => setIsLoading(false);
    const handleProgress = (event: any) => {
        // Можно добавить более детальный прогресс-бар, если нужно
        // console.log(`Loading progress: ${event.detail.totalProgress * 100}%`);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('progress', handleProgress);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('progress', handleProgress);
    };
  }, []);

  const takeScreenshot = async () => { /* ... */ };
  const shareProduct = async () => { /* ... */ };

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[100] bg-black' : 'relative w-full h-full bg-gray-50 group'}>
      
      {/* --- ИНДИКАТОР ЗАГРУЗКИ --- */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm transition-opacity">
            <div className="flex items-center space-x-3 p-4 bg-white/80 rounded-full shadow-md">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-brown"></div>
                <span className="text-sm font-medium text-brand-charcoal">Загрузка 3D модели...</span>
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
        auto-rotate
        touch-action="pan-y"
        ar
        ar-modes="webxr scene-viewer quick-look"
        style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
        class={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
      >
        <button slot="ar-button" className="absolute bottom-4 right-4 bg-brand-brown text-white px-4 py-2 rounded-full font-bold shadow-lg">
          AR Примерка
        </button>
      </model-viewer>

      <button
        onClick={() => setIsFullscreen(true)}
        className={isFullscreen ? 'hidden' : 'absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-md z-10'}
        aria-label="Fullscreen"
      >
        <ArrowsPointingOutIcon className="w-6 h-6" />
      </button>

      {isFullscreen && (
        <>
          <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white p-2 z-20" aria-label="Close">
            <XMarkIcon className="w-8 h-8" />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
            <button onClick={takeScreenshot} className="bg-white/10 p-4 rounded-full text-white" aria-label="Screenshot">
              <CameraIcon className="w-6 h-6" />
            </button>
            {onAddToCart && (
              <button onClick={onAddToCart} className="bg-brand-brown px-6 py-4 rounded-full text-white font-bold flex items-center gap-2" aria-label="Add to cart">
                <ShoppingCartIcon className="w-6 h-6" />
                <span>В корзину</span>
              </button>
            )}
            <button onClick={shareProduct} className="bg-white/10 p-4 rounded-full text-white" aria-label="Share">
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
