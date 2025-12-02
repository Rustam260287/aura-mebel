import React, { memo, Fragment } from 'react';
import { XMarkIcon } from './Icons';
import Image from 'next/image';
import { Transition, Dialog } from '@headlessui/react';

interface ImageZoomModalProps {
  isOpen: boolean;
  imageUrl: string;
  productName: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = memo(({ isOpen, imageUrl, productName, onClose }) => {
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
                            src={imageUrl} 
                            alt={`Увеличенное изображение: ${productName}`}
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
