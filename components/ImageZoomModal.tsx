
import React, { memo, Fragment, useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import Image from 'next/image';
import { Transition, Dialog } from '@headlessui/react';

interface ImageZoomModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  productName: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = memo(({ isOpen, images = [], initialIndex = 0, productName, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]); // Добавил images.length, чтобы пересоздать обработчик, если набор картинок изменится

  if (!images || images.length === 0) {
    return null;
  }
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };


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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
            </Transition.Child>
            
            {/* Modal Content Wrapper */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <Dialog.Panel className="relative w-full h-full max-w-6xl max-h-[90vh]">
                        
                        {/* Image */}
                        <Image 
                            src={images[currentIndex]} 
                            alt={`Увеличенное изображение ${currentIndex + 1} из ${images.length}: ${productName}`}
                            className="object-contain"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                        />
                        
                        {/* Кнопки теперь ВНУТРИ Dialog.Panel */}

                        {/* Close Button */}
                        <button 
                            onClick={onClose} 
                            className="absolute -top-12 right-0 sm:top-0 sm:-right-12 text-white hover:text-gray-300 z-[110] p-2 bg-black/30 rounded-full transition-all hover:scale-110"
                            aria-label="Закрыть"
                        >
                            <XMarkIcon className="w-8 h-8" />
                        </button>

                        {/* Prev Button */}
                        {images.length > 1 && (
                          <button 
                              onClick={handlePrev} 
                              className="absolute left-0 sm:-left-12 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-2 bg-black/30 rounded-full transition-all hover:scale-110"
                              aria-label="Предыдущее изображение"
                          >
                              <ChevronLeftIcon className="w-8 h-8" />
                          </button>
                        )}

                        {/* Next Button */}
                        {images.length > 1 && (
                          <button 
                              onClick={handleNext} 
                              className="absolute right-0 sm:-right-12 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-2 bg-black/30 rounded-full transition-all hover:scale-110"
                              aria-label="Следующее изображение"
                          >
                              <ChevronRightIcon className="w-8 h-8" />
                          </button>
                        )}

                        {/* Counter */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white z-[110] p-2 bg-black/30 rounded-full text-sm font-medium">
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
