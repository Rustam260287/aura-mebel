
'use client';

import React, { useEffect, useState, useMemo, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowsPointingOutIcon, XMarkIcon, CameraIcon, ShareIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import type { Product } from '../types';

interface ARViewerProps {
  src: string;
  iosSrc?: string;
  poster?: string;
  alt: string;
  product?: Product; // For UI info
  onAddToCart?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

const useModelBlob = (src?: string) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!src) {
            setLoading(false);
            setBlobUrl(null);
            return;
        }

        let isActive = true;
        setLoading(true);

        const finalUrl = (src.includes('firebasestorage') && !src.startsWith('blob:'))
            ? `/api/proxy-model?url=${encodeURIComponent(src)}`
            : src;
        
        if (src.startsWith('blob:')) {
            setBlobUrl(src);
            setLoading(false);
            return;
        }

        fetch(finalUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status} fetching model`);
                return res.blob();
            })
            .then(blob => {
                if (isActive) {
                    const objectUrl = URL.createObjectURL(blob);
                    setBlobUrl(objectUrl);
                }
            })
            .catch(err => {
                console.error("Model blob creation failed:", err);
                if (isActive) setBlobUrl(src);
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
            if (blobUrl && blobUrl.startsWith('blob:') && !src.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [src]);

    return { blobUrl, loading };
};

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt, product, onAddToCart }) => {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modelViewerRef = useRef<any>(null);

  const { blobUrl: glbBlobUrl, loading: isLoadingGlb } = useModelBlob(src);
  
  const usdzProxyUrl = useMemo(() => {
    if (!iosSrc) return undefined;
    return `/api/proxy-model?url=${encodeURIComponent(iosSrc)}`;
  }, [iosSrc]);

  useEffect(() => {
    setIsClient(true);
    import('@google/model-viewer').catch(console.error);
  }, []);

  const takeScreenshot = async () => {
      if (!modelViewerRef.current) return;
      try {
          const blob = await modelViewerRef.current.toBlob({ mimeType: 'image/png' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `aura-mebel-${alt}.png`;
          a.click();
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Screenshot failed", e);
      }
  };

  const shareProduct = async () => {
      if (navigator.share && product) {
          try {
              await navigator.share({
                  title: product.name,
                  text: `Посмотри этот ${product.name} в 3D!`,
                  url: window.location.href
              });
          } catch (e) {
              console.log("Share cancelled");
          }
      } else {
          // Fallback: Copy link
          navigator.clipboard.writeText(window.location.href);
          alert("Ссылка скопирована!");
      }
  };

  const ModelViewerContent = ({ isFull = false }) => (
    <model-viewer
      ref={isFull ? modelViewerRef : undefined}
      src={glbBlobUrl}
      ios-src={usdzProxyUrl}
      poster={poster}
      alt={alt}
      loading="eager"
      camera-controls
      touch-action="pan-y"
      auto-rotate
      camera-target="auto auto auto"
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="auto"
      shadow-intensity="1.5"
      shadow-softness="0.8"
      exposure="1.2"
      environment-image="neutral"
      style={{ width: '100%', height: '100%' }}
    >
      <div slot="progress-bar"></div>
      
      {!isFull && (
        <button slot="ar-button" className="absolute bottom-6 right-6 bg-brand-brown text-white px-5 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-brand-charcoal transition-transform hover:scale-105 active:scale-95 z-10 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
            AR (Примерить)
        </button>
      )}
    </model-viewer>
  );

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
      </div>
    );
  }

  return (
    <>
        <div className="relative w-full h-full bg-gray-50 overflow-hidden border border-gray-100 shadow-inner group">
        {isLoadingGlb && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown mb-2"></div>
                <p className="text-xs text-gray-500">Загрузка 3D модели...</p>
            </div>
        )}

        {glbBlobUrl && (
            <>
                <ModelViewerContent />
                <button onClick={() => setIsFullscreen(true)} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-md hover:bg-white text-gray-700 hover:text-brand-brown transition-all z-10" title="На весь экран">
                    <ArrowsPointingOutIcon className="w-6 h-6" />
                </button>
            </>
        )}
        </div>

        <Transition show={isFullscreen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={() => setIsFullscreen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full h-full relative bg-black">
                                <ModelViewerContent isFull={true} />
                                
                                {/* Close Button */}
                                <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-md transition-all z-20">
                                    <XMarkIcon className="w-8 h-8" />
                                </button>

                                {/* Action Bar (Bottom) */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                                    <button 
                                        onClick={takeScreenshot}
                                        className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                                        title="Сделать фото"
                                    >
                                        <CameraIcon className="w-6 h-6" />
                                    </button>

                                    {onAddToCart && (
                                        <button 
                                            onClick={onAddToCart}
                                            className="bg-brand-brown/90 backdrop-blur-md px-6 py-4 rounded-full text-white font-bold hover:bg-brand-brown transition-all active:scale-95 shadow-lg flex items-center gap-2"
                                        >
                                            <ShoppingCartIcon className="w-6 h-6" />
                                            <span className="hidden sm:inline">В корзину</span>
                                            {product && <span className="text-sm opacity-80 border-l border-white/20 pl-2 ml-1">{product.price.toLocaleString()} ₽</span>}
                                        </button>
                                    )}

                                    <button 
                                        onClick={shareProduct}
                                        className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                                        title="Поделиться"
                                    >
                                        <ShareIcon className="w-6 h-6" />
                                    </button>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    </>
  );
};
