
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import { Product } from '../types';

interface FurnitureTryOnModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  product?: Product;
}

export const FurnitureTryOnModal: React.FC<FurnitureTryOnModalProps> = ({ 
    isOpen: controlledIsOpen, 
    onClose: controlledOnClose, 
    product: controlledProduct 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [internalProduct, setInternalProduct] = useState<{ name: string; imageUrl?: string } | null>(null);

  const isControlled = typeof controlledIsOpen !== 'undefined';
  const show = isControlled ? controlledIsOpen : internalIsOpen;
  
  const close = () => {
      if (isControlled && controlledOnClose) {
          controlledOnClose();
      } else {
          setInternalIsOpen(false);
      }
  };

  const productData = isControlled ? controlledProduct : internalProduct;

  useEffect(() => {
      if (isControlled) return;

      const handleOpenEvent = (event: CustomEvent) => {
          const { productName, productImage } = event.detail;
          setInternalProduct({ name: productName, imageUrl: productImage });
          setInternalIsOpen(true);
      };

      window.addEventListener('openFurnitureTryOn', handleOpenEvent as EventListener);
      return () => {
          window.removeEventListener('openFurnitureTryOn', handleOpenEvent as EventListener);
      };
  }, [isControlled]);

  const handleGoToRedesign = () => {
    close();
    if (productData) {
        const params = new URLSearchParams();
        if (productData.name) params.append('furnitureName', productData.name);
        // @ts-ignore
        const img = productData.imageUrl || productData.imageUrls?.[0];
        if (img) params.append('furnitureImage', img);
        
        window.location.href = `/ai-room-makeover?${params.toString()}`;
    } else {
        window.location.href = '/ai-room-makeover';
    }
  };

  if (!productData) return null;

  return (
    <Transition show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-2xl transition-all border border-white/20">
                
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {/* @ts-ignore */}
                    {productData.imageUrl || productData.imageUrls?.[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                         <img 
                            /* @ts-ignore */
                            src={productData.imageUrl || productData.imageUrls?.[0]} 
                            alt={productData.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-cream text-brand-brown/30">
                            <CubeTransparentIcon className="w-16 h-16" />
                        </div>
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                     <button onClick={close} className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 backdrop-blur-sm transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-6 text-white">
                        <h3 className="text-xl font-serif font-bold">{productData.name}</h3>
                        <p className="text-sm opacity-90">AR Примерка</p>
                    </div>
                </div>

                <div className="p-8 text-center">
                    
                    <p className="text-gray-600 mb-8 text-base leading-relaxed">
                        Хотите увидеть, как <b>{productData.name}</b> будет смотреться в вашей комнате? 
                        <br/><br/>
                        Загрузите фото вашей комнаты в <b>AI Редизайн</b>, и мы постараемся стилизовать интерьер под эту модель.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleGoToRedesign}
                            className="bg-brand-brown text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-charcoal transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Перейти к примерке
                        </button>
                        <button 
                            onClick={close}
                            className="text-gray-400 hover:text-gray-600 font-medium py-2 text-sm"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
