import React, { memo } from 'react';
import { XMarkIcon } from './Icons';
import Image from 'next/image';

interface ImageZoomModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = memo(({ imageUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-black/30 rounded-full transition-colors"
        aria-label="Закрыть"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>
      <div 
        className="relative max-w-full max-h-full animate-scale-in"
        onClick={e => e.stopPropagation()} 
      >
        <Image 
          src={imageUrl} 
          alt="Увеличенное изображение товара" 
          className="object-contain rounded-lg shadow-2xl"
          fill
          sizes="100vw"
        />
      </div>
    </div>
  );
});

ImageZoomModal.displayName = 'ImageZoomModal';
