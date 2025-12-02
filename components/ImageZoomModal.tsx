
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

  if (!images || images.length === 0) {
    return null;
  }
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
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

            {/* Close Button */}
             <button 
                onClick={onClose} 
                className="fixed top-4 right-4 text-white hover:text-gray-300 z-[110] p-2 bg-black/30 rounded-full transition-all hover:scale-110"
                aria-label="Закрыть"
            >
                <XMarkIcon className="w-8 h-8" />
            </button>

            {/* Counter */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 text-white z-[110] p-2 bg-black/30 rounded-full text-lg">
              {currentIndex + 1} / {images.length}
            </div>


            {/* Prev Button */}
            {images.length > 1 && (
              <button 
                  onClick={handlePrev} 
                  className="fixed left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-2 bg-black/30 rounded-full transition-all hover:scale-110"
                  aria-label="Предыдущее изображение"
              >
                  <ChevronLeftIcon className="w-8 h-8" />
              </button>
            )}

            {/* Next Button */}
            {images.length > 1 && (
              <button 
                  onClick={handleNext} 
                  className="fixed right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-2 bg-black/30 rounded-full transition-all hover:scale-110"
                  aria-label="Следующее изображение"
              >
                  <ChevronRightIcon className="w-8 h-8" />
              </button>
            )}


            {/* Modal Content */}
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
                        <Image 
                            src={images[currentIndex]} 
                            alt={`Увеличенное изображение ${currentIndex + 1} из ${images.length}: ${productName}`}
                            className="object-contain"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                        />
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </Dialog>
    </Transition>
  );
});

ImageZoomModal.displayName = 'ImageZoomModal';
