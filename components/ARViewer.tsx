
'use client';

import React, { useEffect, useState } from 'react';

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

export const ARViewer: React.FC<ARViewerProps> = ({ src, iosSrc, poster, alt }) => {
  const [isClient, setIsClient] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    import('@google/model-viewer').catch(console.error);
  }, []);

  // "Ручная" загрузка файла для обхода проблем с CORS и редиректами в model-viewer
  useEffect(() => {
    if (!src) return;

    let isActive = true;
    setLoading(true);
    
    // Используем прокси только если это не Signed URL (в Signed URL уже есть токен)
    const finalUrl = (src.includes('firebasestorage') && !src.includes('Goog-Algorithm'))
        ? `/api/proxy-model?url=${encodeURIComponent(src)}`
        : src;

    fetch(finalUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (isActive) {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Manual model load failed:", err);
        if (isActive) {
            // Если ручная загрузка не удалась, пробуем отдать исходный URL (авось сработает)
            setBlobUrl(src); 
            setLoading(false);
        }
      });

    return () => {
      isActive = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (!isClient) {
      return (
        <div className="w-full h-[400px] md:h-[500px] bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
        </div>
      );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[500px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner group">
      {/* Если загрузка идет, показываем спиннер */}
      {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown mb-2"></div>
              <p className="text-xs text-gray-500">Загрузка 3D модели...</p>
          </div>
      )}

      {blobUrl && (
          <model-viewer
            src={blobUrl}
            ios-src={iosSrc}
            poster={poster}
            alt={alt}
            loading="eager"
            
            camera-controls
            auto-rotate
            camera-target="auto auto auto"
            bounds="tight" 
            
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            
            shadow-intensity="1.5"
            shadow-softness="0.8"
            exposure="1.2"
            environment-image="neutral"
            
            style={{ width: '100%', height: '100%' }}
            onError={(e: any) => console.error("Model viewer internal error:", e)}
          >
            <div slot="progress-bar"></div>
            
            <button slot="ar-button" className="absolute bottom-4 right-4 bg-brand-brown text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-brand-charcoal transition-transform hover:scale-105 active:scale-95 z-10 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                AR (Примерить)
            </button>
          </model-viewer>
      )}
    </div>
  );
};
