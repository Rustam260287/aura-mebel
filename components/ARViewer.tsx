
import React, { useRef, useEffect, useState, memo } from 'react';
import { Product } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerElement extends HTMLElement {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  poster?: string;
  'camera-controls'?: boolean;
  'disable-pan'?: boolean;
  'disable-tap'?: boolean;
  'auto-rotate'?: boolean;
  'ar'?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: string;
}

interface ARViewerProps {
  product: Product;
  onClose: () => void;
}

const ARViewerComponent: React.FC<ARViewerProps> = ({ product, onClose }) => {
  const modelViewerRef = useRef<ModelViewerElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    import('@google/model-viewer').catch(console.error);
  }, []);
  
  const modelUrl = isIOS ? product.models?.usdz : product.models?.glb;
  const hasAr = !!modelUrl;

  const handleModelLoad = () => setIsLoaded(true);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      modelViewer.addEventListener('load', handleModelLoad);
      return () => modelViewer.removeEventListener('load', handleModelLoad);
    }
  }, []);

  const handleActivateAR = () => {
    if (modelViewerRef.current && 'activateAR' in modelViewerRef.current) {
        (modelViewerRef.current as any).activateAR();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-warm-white flex items-center justify-center">
      {/* Model Viewer */}
      <model-viewer
        ref={modelViewerRef}
        src={product.models?.glb}
        ios-src={product.models?.usdz}
        alt={product.name}
        poster={product.imageUrls?.[0]}
        camera-controls
        disable-pan
        disable-tap
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        className="w-full h-full"
      />
      
      {/* Dim overlay while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-warm-white/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown" />
        </div>
      )}

      {/* AR Button */}
      {hasAr && isLoaded && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button 
                onClick={handleActivateAR}
                className="bg-brand-brown text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 font-medium hover:bg-brand-charcoal transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Поставить в комнате
            </button>
        </div>
      )}
      
      {/* Close Button */}
       <button 
            onClick={onClose} 
            className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft z-20 hover:bg-white transition-colors"
        >
           <svg className="w-5 h-5 text-soft-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
    </div>
  );
};

export const ARViewer = memo(ARViewerComponent);
