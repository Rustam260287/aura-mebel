
import React, { memo, Fragment, useState, useEffect, useCallback } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import Image from 'next/image';
import { Transition, Dialog } from '@headlessui/react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageZoomModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  productName: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = memo(({ isOpen, images = [], initialIndex = 0, productName, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev]);

  if (!images || images.length === 0) {
    return null;
  }
  
  return (
    <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={onClose}>
            {/* Overlay */}
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
            </Transition.Child>
            
            {/* Modal Content Wrapper */}
            <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <Dialog.Panel className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center">
                        
                        {/* Zoomable Image Container */}
                        <div className="w-full h-full flex items-center justify-center">
                            <TransformWrapper
                                initialScale={1}
                                minScale={1}
                                maxScale={4}
                                centerOnInit
                            >
                                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
                                        {/* Используем обычный img для лучшей совместимости с зум-библиотекой или Next Image с правильно настроенными стилями.
                                            Для зума проще использовать обычный img, так как Next Image требует fill/absolute, что конфликтует с transform.
                                        */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={images[currentIndex]} 
                                            alt={`${productName} - ${currentIndex + 1}`}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </TransformComponent>
                            </TransformWrapper>
                        </div>
                        
                        {/* Controls - Absolute positioned on top of everything */}
                        
                        {/* Close Button */}
                        <button 
                            onClick={onClose} 
                            className="absolute top-4 right-4 sm:-top-12 sm:-right-12 text-white hover:text-gray-300 z-[120] p-3 bg-black/40 rounded-full backdrop-blur-md transition-all hover:scale-110"
                            aria-label="Закрыть"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        {/* Prev Button */}
                        {images.length > 1 && (
                          <button 
                              onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
                              className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[120] p-3 bg-black/40 rounded-full backdrop-blur-md transition-all hover:scale-110"
                              aria-label="Предыдущее изображение"
                          >
                              <ChevronLeftIcon className="w-8 h-8" />
                          </button>
                        )}

                        {/* Next Button */}
                        {images.length > 1 && (
                          <button 
                              onClick={(e) => { e.stopPropagation(); handleNext(); }} 
                              className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[120] p-3 bg-black/40 rounded-full backdrop-blur-md transition-all hover:scale-110"
                              aria-label="Следующее изображение"
                          >
                              <ChevronRightIcon className="w-8 h-8" />
                          </button>
                        )}

                        {/* Counter */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white z-[120] px-4 py-1 bg-black/40 rounded-full text-sm font-medium backdrop-blur-md">
                          {currentIndex + 1} / {images.length}
                        </div>

                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </Dialog>
    </Transition>
  );
});

ImageZoomModal.displayName = 'ImageZoomModal';
