
'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import { ArrowLeftIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useImmersive } from '../contexts/ImmersiveContext';

interface ARViewerProps {
  src: string;
  iosSrc?: string;
  poster?: string;
  alt: string;
  onClose: () => void;
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
  
  const ext = src.split('.').pop()?.toLowerCase().split('?')[0];

  if (ext === 'usdz') return `/api/proxy-model.usdz?url=${encodeURIComponent(src)}`;
  if (ext === 'glb') return `/api/proxy-model.glb?url=${encodeURIComponent(src)}`;
  
  return `/api/proxy-model?url=${encodeURIComponent(src)}`;
};

const ARViewerComponent: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt, onClose }) => {
  const { setImmersive } = useImmersive();
  const modelViewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [isInArSession, setIsInArSession] = useState(false);

  const glbSrc = useMemo(() => toProxyUrl(src), [src]);
  const usdzSrc = useMemo(() => toProxyUrl(iosSrc), [iosSrc]);

  useLayoutEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  useEffect(() => {
    import('@google/model-viewer').catch(console.error);
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleLoad = () => setIsLoading(false);
    viewer.addEventListener('load', handleLoad);

    const handleArStatus = (event: any) => {
      const status = event?.detail?.status;
      if (status === 'session-started') setIsInArSession(true);
      if (status === 'session-ended' || status === 'not-presenting' || status === 'failed') {
        setIsInArSession(false);
      }
    };
    viewer.addEventListener('ar-status', handleArStatus);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setIsInArSession(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const hintTimer = setTimeout(() => setShowHint(false), 3500);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('ar-status', handleArStatus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(hintTimer);
    };
  }, []);

  return (
    <div className='fixed inset-0 z-[100] bg-warm-white'>
      
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-warm-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3 p-4 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-soft-black"></div>
                <span className="text-sm font-medium text-soft-black">Загрузка объекта...</span>
            </div>
        </div>
      )}

      <model-viewer
        ref={modelViewerRef}
        src={glbSrc}
        ios-src={usdzSrc}
        poster={poster}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-placement="floor"
        camera-controls
        style={{
          width: '100%',
          height: '100%',
          '--poster-color': 'transparent',
        }}
        className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
      >
        {!isInArSession && (
          <button
            slot="ar-button"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-soft-black text-white px-6 py-3 rounded-xl font-medium shadow-soft"
          >
            Посмотреть в комнате
          </button>
        )}
      </model-viewer>

      <AnimatePresence>
        {showHint && !isInArSession && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-soft-black/60 text-white text-sm px-4 py-2 rounded-full pointer-events-none z-20"
            >
            Используйте жесты для перемещения
            </motion.div>
        )}
      </AnimatePresence>
      
      {!isInArSession && (
        <button
          onClick={onClose}
          className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft z-20 hover:bg-white transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-soft-black" />
        </button>
      )}
    </div>
  );
};

export const ARViewer = memo(ARViewerComponent);
