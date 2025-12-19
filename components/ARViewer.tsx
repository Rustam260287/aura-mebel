
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
    <div className={isFullscreen ? 'fixed inset-0 z-[100] bg-black' : 'relative w-full h-full bg-brand-cream/10 group'}>
      
      {/* --- ИНДИКАТОР ЗАГРУЗКИ --- */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm transition-opacity">
            <div className="flex items-center space-x-3 p-4 bg-white rounded-full shadow-lg border border-gray-100">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-brand-terracotta"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">Загрузка 3D...</span>
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
        <button slot="ar-button" className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-brand-terracotta hover:bg-brand-terracotta-dark text-white px-6 py-3 rounded-full font-bold shadow-xl shadow-brand-terracotta/30 flex items-center gap-2 transition-all transform hover:scale-105">
           <CubeTransparentIcon className="w-5 h-5" />
           <span className="text-xs uppercase tracking-widest">AR Примерка</span>
        </button>
      </model-viewer>

      <button
        onClick={() => setIsFullscreen(true)}
        className={isFullscreen ? 'hidden' : 'absolute top-4 right-4 bg-white/90 p-3 rounded-full shadow-lg z-10 text-brand-charcoal hover:text-brand-terracotta transition-colors'}
        aria-label="Fullscreen"
      >
        <ArrowsPointingOutIcon className="w-5 h-5" />
      </button>

      {isFullscreen && (
        <>
          <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 text-white/80 hover:text-white p-2 z-20 transition-colors" aria-label="Close">
            <XMarkIcon className="w-8 h-8" />
          </button>
          
          <div className="absolute top-6 left-6 z-20">
              <span className="text-white/50 text-xs uppercase tracking-widest font-bold border border-white/20 px-3 py-1 rounded-full">3D View Mode</span>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
            <button onClick={takeScreenshot} className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md transition-all" aria-label="Screenshot">
              <CameraIcon className="w-6 h-6" />
            </button>
            {onAddToCart && (
              <button onClick={onAddToCart} className="bg-brand-terracotta hover:bg-brand-terracotta-dark px-8 py-4 rounded-full text-white font-bold flex items-center gap-3 shadow-2xl shadow-brand-terracotta/20 transition-all transform hover:scale-105" aria-label="Add to cart">
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest">В корзину</span>
              </button>
            )}
            <button onClick={shareProduct} className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md transition-all" aria-label="Share">
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
