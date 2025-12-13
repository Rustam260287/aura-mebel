
'use client';

import React, { useEffect, useMemo, useRef, useState, Fragment } from 'react';
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

const PROXYABLE_HOSTS = new Set(['firebasestorage.googleapis.com', 'storage.googleapis.com']);

const resolveModelUrl = (rawUrl?: string) => {
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:') || rawUrl.startsWith('/')) {
    return rawUrl;
  }

  if (!(rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
    return rawUrl;
  }

  try {
    const u = new URL(rawUrl);
    if (!PROXYABLE_HOSTS.has(u.hostname)) return rawUrl;
    return `/api/proxy-model?url=${encodeURIComponent(rawUrl)}`;
  } catch {
    return rawUrl;
  }
};

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt }) => {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resolvedSrc = useMemo(() => resolveModelUrl(src), [src]);
  const resolvedIosSrc = useMemo(() => resolveModelUrl(iosSrc), [iosSrc]);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const inlineViewerRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Eagerly load the model-viewer library
    import('@google/model-viewer').catch(console.error);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [resolvedSrc, resolvedIosSrc]);

  useEffect(() => {
    const el = inlineViewerRef.current;
    if (!el) return;

    const handleLoad = () => setIsLoading(false);
    const handleError = (event: any) => {
      console.error('Model viewer error:', event);
      setHasError(true);
      setIsLoading(false);
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);
    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
    };
  }, [resolvedSrc, resolvedIosSrc, isClient]);

  const arModes = resolvedIosSrc ? 'webxr scene-viewer quick-look' : 'webxr scene-viewer';

  const ModelViewerContent = ({ viewerRef }: { viewerRef?: any }) => (
    <model-viewer
      ref={viewerRef}
      src={resolvedSrc}
      ios-src={resolvedIosSrc}
      poster={poster}
      alt={alt}
      loading="eager"
      camera-controls
      touch-action="pan-y"
      auto-rotate
      camera-target="auto auto auto"
      ar
      ar-modes={arModes}
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
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown mb-2"></div>
                <p className="text-xs text-gray-500">Загрузка 3D модели...</p>
            </div>
        )}

        {!isLoading && hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 px-6 text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">Не удалось загрузить 3D модель</p>
            <p className="text-xs text-gray-500">Проверьте ссылку на файл и попробуйте позже.</p>
          </div>
        )}

        {resolvedSrc && (
            <>
                <ModelViewerContent viewerRef={inlineViewerRef} />
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
