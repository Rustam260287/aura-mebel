
'use client';

import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ARViewerProps {
  src: string;
  iosSrc?: string;
  poster?: string;
  alt: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

// Custom hook to create a blob URL from a source URL
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

        // Use proxy for Firebase storage URLs that are not already proxied or blobs
        const finalUrl = (src.includes('firebasestorage') && !src.startsWith('blob:'))
            ? `/api/proxy-model?url=${encodeURIComponent(src)}`
            : src;

        // If it's already a blob, just use it
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
                if (isActive) setBlobUrl(src); // Fallback to original src on error
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
            // Revoke blob URL only if it was created by this hook
            if (blobUrl && blobUrl.startsWith('blob:') && !src.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [src]); // blobUrl removed from dependencies to prevent re-running

    return { blobUrl, loading };
};

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt }) => {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { blobUrl: glbBlobUrl, loading: isLoadingGlb } = useModelBlob(src);
  
  // For iOS, we will pass the proxied URL directly without creating a blob
  const usdzProxyUrl = useMemo(() => {
    if (!iosSrc) return undefined;
    return `/api/proxy-model?url=${encodeURIComponent(iosSrc)}`;
  }, [iosSrc]);

  useEffect(() => {
    setIsClient(true);
    // Eagerly load the model-viewer library
    import('@google/model-viewer').catch(console.error);
  }, []);

  const ModelViewerContent = () => (
    <model-viewer
      src={glbBlobUrl}
      ios-src={usdzProxyUrl} // Use direct proxied URL for iOS
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
      <button slot="ar-button" className="absolute bottom-6 right-6 bg-brand-brown text-white px-5 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-brand-charcoal transition-transform hover:scale-105 active:scale-95 z-10 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
          AR (Примерить)
      </button>
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
                                <ModelViewerContent />
                                <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-all z-20">
                                    <XMarkIcon className="w-8 h-8" />
                                </button>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    </>
  );
};
