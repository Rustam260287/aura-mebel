import React, { memo, Fragment } from 'react';
import { XMarkIcon } from './Icons';
import Image from 'next/image';
import { Transition, Dialog } from '@headlessui/react';

interface ImageZoomModalProps {
  isOpen: boolean; // <-- ДОБАВЛЕНО
  imageUrl: string;
  productName: string; // <-- ДОБАВЛЕНО
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = memo(({ isOpen, imageUrl, productName, onClose }) => {
  return (
    <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
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

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="relative w-full h-full max-w-4xl max-h-[80vh] transform text-left align-middle transition-all">
                             <button 
                                onClick={onClose} 
                                className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10 p-2 bg-black/30 rounded-full transition-colors"
                                aria-label="Закрыть"
                            >
                                <XMarkIcon className="w-8 h-8" />
                            </button>
                            <div className="relative w-full h-full">
                                <Image 
                                    src={imageUrl} 
                                    alt={`Увеличенное изображение: ${productName}`}
                                    className="object-contain rounded-lg shadow-2xl"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 80vw"
                                />
                             </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
  );
});

ImageZoomModal.displayName = 'ImageZoomModal';
