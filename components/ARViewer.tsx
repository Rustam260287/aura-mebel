
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowsPointingOutIcon, XMarkIcon, CameraIcon, ShareIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
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

const toProxyUrl = (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith('blob:') || src.startsWith('/') || src.startsWith('data:')) return src;
  if (src.includes('firebasestorage') || src.includes('storage.googleapis.com')) {
    return `/api/proxy-model?url=${encodeURIComponent(src)}`;
  }
  return src;
};

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt, product, onAddToCart }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modelViewerRef = useRef<any>(null);
  const [currentMaterial, setCurrentMaterial] = useState<string | null>(null);

  const glbSrc = useMemo(() => toProxyUrl(src), [src]);
  const usdzSrc = useMemo(() => toProxyUrl(iosSrc), [iosSrc]);

  useEffect(() => {
    import('@google/model-viewer').catch(console.error);
    const handleSetMaterial = (event: CustomEvent) => {
      setCurrentMaterial(event.detail);
      setIsFullscreen(true);
    };
    window.addEventListener('set-material', handleSetMaterial as EventListener);
    return () => window.removeEventListener('set-material', handleSetMaterial as EventListener);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    const el = modelViewerRef.current as HTMLElement | null;
    if (!el) return;
    const stop = (e: TouchEvent) => e.stopPropagation();
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('touchstart', stop as any, { passive: true });
    el.addEventListener('touchend', stop as any, { passive: true });
    el.addEventListener('touchmove', preventScroll as any, { passive: false });
    return () => {
      el.removeEventListener('touchstart', stop as any);
      el.removeEventListener('touchend', stop as any);
      el.removeEventListener('touchmove', preventScroll as any);
    };
  }, [glbSrc]);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (viewer?.model && currentMaterial) {
        viewer.model.materials.forEach((m: any) => {
            if (m.name.toLowerCase() === currentMaterial.toLowerCase()) {
                m.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
            }
        });
    }
  }, [currentMaterial]);

  const takeScreenshot = async () => { if (modelViewerRef.current) { const blob = await modelViewerRef.current.toBlob({idealAspect: true}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${alt}.png`; a.click(); URL.revokeObjectURL(url); } };
  const shareProduct = async () => { if (navigator.share && product) { await navigator.share({ title: product.name, text: `Оцени ${product.name}!`, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); alert("Ссылка скопирована!"); }};

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[100] bg-black' : 'relative w-full h-full bg-gray-50 group'}>
      {!glbSrc && <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">3D модель недоступна</div>}
      {glbSrc && (
        <>
          <model-viewer
            ref={modelViewerRef}
      src={glbSrc}
      ios-src={usdzSrc}
      poster={poster}
      alt={alt}
      camera-controls
      auto-rotate
      touch-action="none"
      ar
      ar-modes="webxr scene-viewer quick-look"
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
          >
            {!isFullscreen && (
              <button slot="ar-button" className="absolute bottom-4 right-4 bg-brand-brown text-white px-4 py-2 rounded-full font-bold shadow-lg">
                AR Примерка
              </button>
            )}
          </model-viewer>

          <button
            onClick={() => setIsFullscreen(true)}
            className={isFullscreen ? 'hidden' : 'absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-md z-10'}
            aria-label="Fullscreen"
          >
            <ArrowsPointingOutIcon className="w-6 h-6" />
          </button>
        </>
      )}

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
