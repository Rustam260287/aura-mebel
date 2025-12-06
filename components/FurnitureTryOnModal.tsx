
import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import { Product } from '../types'; // Импортируем тип Product

interface FurnitureTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product; // Меняем на полный объект Product
}

export const FurnitureTryOnModal: React.FC<FurnitureTryOnModalProps> = ({ isOpen, onClose, product }) => {
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                
                <div className="flex justify-end">
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 outline-none">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-center pb-6">
                    <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4">
                        <CubeTransparentIcon className="w-8 h-8 text-brand-brown" />
                    </div>
                    <Dialog.Title as="h3" className="text-xl font-serif text-brand-brown mb-2">
                        AR Примерка
                    </Dialog.Title>
                    {/* Используем product.name */}
                    <p className="text-sm font-medium text-gray-900 mb-4">{product.name}</p>
                    
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                        Функция виртуальной примерки в вашем интерьере находится в активной разработке.
                        <br/>
                        Скоро вы сможете увидеть, как эта мебель смотрится у вас дома, используя камеру телефона.
                    </p>

                    <button 
                        onClick={onClose}
                        className="bg-brand-brown text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-brown/90 transition-colors w-full"
                    >
                        Понятно
                    </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
