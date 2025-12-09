
'use client';

import React, { useEffect, useState } from 'react';

interface ARViewerProps {
  src: string;
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

export const ARViewer: React.FC<ARViewerProps> = ({ src, poster, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const proxySrc = src.includes('firebasestorage') 
    ? `/api/proxy-model?url=${encodeURIComponent(src)}` 
    : src;

  useEffect(() => {
    setIsClient(true);
    import('@google/model-viewer').catch(console.error);
  }, []);

  if (!isClient) {
      return (
        <div className="w-full h-[400px] md:h-[500px] bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
        </div>
      );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[500px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
      <model-viewer
        src={proxySrc}
        poster={poster}
        alt={alt}
        loading="eager"
        
        // Камера и управление
        camera-controls
        auto-rotate
        camera-target="auto auto auto" // Авто-центровка
        bounds="tight" // Авто-масштаб
        
        // AR
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        
        // Освещение и рендер
        shadow-intensity="1"
        shadow-softness="1"
        exposure="1"
        environment-image="neutral"
        
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setLoaded(true)}
        onError={(e: any) => console.error("Model viewer error:", e)}
      >
        <div slot="progress-bar"></div>
        
        <button slot="ar-button" className="absolute bottom-4 right-4 bg-brand-brown text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-brand-charcoal transition-transform hover:scale-105 active:scale-95 z-10 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            AR (Поставить в комнате)
        </button>

      </model-viewer>

      {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm z-0 pointer-events-none">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
          </div>
      )}
    </div>
  );
};
