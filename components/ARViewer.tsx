
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
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.blob(); })
            .then(blob => { if (isActive) { setBlobUrl(URL.createObjectURL(blob)); }})
            .catch(err => { console.error("Model blob failed:", err); if (isActive) setBlobUrl(src); })
            .finally(() => { if (isActive) setLoading(false); });
        return () => { isActive = false; };
    }, [src]);
    return { blobUrl, loading };
};

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt, product, onAddToCart }) => {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modelViewerRef = useRef<any>(null);
  const [currentMaterial, setCurrentMaterial] = useState<string | null>(null);

  const { blobUrl: glbBlobUrl, loading: isLoadingGlb } = useModelBlob(src);
  const usdzProxyUrl = useMemo(() => iosSrc ? `/api/proxy-model?url=${encodeURIComponent(iosSrc)}` : undefined, [iosSrc]);

  useEffect(() => {
    setIsClient(true);
    import('@google/model-viewer').catch(console.error);
    const handleSetMaterial = (event: CustomEvent) => {
      setCurrentMaterial(event.detail);
      setIsFullscreen(true);
    };
    window.addEventListener('set-material', handleSetMaterial as EventListener);
    return () => window.removeEventListener('set-material', handleSetMaterial as EventListener);
  }, []);

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

  const ModelViewerContent = ({ isFull = false }) => (
    <model-viewer
      ref={isFull ? modelViewerRef : null}
      src={glbBlobUrl}
      ios-src={usdzProxyUrl}
      poster={poster}
      alt={alt}
      camera-controls
      auto-rotate
      ar
      ar-modes="webxr scene-viewer quick-look"
      style={{ width: '100%', height: '100%' }}
    >
      {!isFull && (
        <button slot="ar-button" className="absolute bottom-4 right-4 bg-brand-brown text-white px-4 py-2 rounded-full font-bold shadow-lg">
            AR Примерка
        </button>
      )}
    </model-viewer>
  );

  return (
    <>
        <div className="relative w-full h-full bg-gray-50 group">
        {isLoadingGlb && <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div></div>}
        {glbBlobUrl && (
            <>
                <ModelViewerContent />
                <button onClick={() => setIsFullscreen(true)} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-md z-10"><ArrowsPointingOutIcon className="w-6 h-6" /></button>
            </>
        )}
        </div>

        <Transition show={isFullscreen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={() => setIsFullscreen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/80" /></Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full h-full relative bg-black">
                        <ModelViewerContent isFull={true} />
                        <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white p-2 z-20"><XMarkIcon className="w-8 h-8" /></button>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                            <button onClick={takeScreenshot} className="bg-white/10 p-4 rounded-full text-white"><CameraIcon className="w-6 h-6" /></button>
                            {onAddToCart && <button onClick={onAddToCart} className="bg-brand-brown px-6 py-4 rounded-full text-white font-bold flex items-center gap-2"><ShoppingCartIcon className="w-6 h-6" /><span>В корзину</span></button>}
                            <button onClick={shareProduct} className="bg-white/10 p-4 rounded-full text-white"><ShareIcon className="w-6 h-6" /></button>
                        </div>
                    </Dialog.Panel>
                </Transition.Child></div>
            </Dialog>
        </Transition>
    </>
  );
};
