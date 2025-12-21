
import React, { useState, memo, useMemo, Fragment, TouchEvent, useCallback } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, HeartIcon, ShareIcon, CubeTransparentIcon, CheckCircleIcon } from './icons';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { ARViewer } from './ARViewer'; 
import Image from 'next/image';
import { Transition } from '@headlessui/react';
import { cn } from '../utils';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

// LABEL GUIDE: Шаг 4-6. Экран объекта. 
// Фокус на "Поставить в комнату". Цена и характеристики — после опыта.

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const [showAR, setShowAR] = useState(false);
  const [experienceCompleted, setExperienceCompleted] = useState(false);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  const isWished = isInWishlist(product.id);

  const handleToggleAR = () => {
    if (product.model3dUrl) {
        setShowAR(!showAR);
        if (!showAR) {
            // Пользователь выходит из AR - считаем опыт завершенным
             // В реальном flow это срабатывает при закрытии, здесь симулируем
        }
    } else {
        addToast("3D-модель для этого объекта пока не готова", "info");
    }
  };

  // Эмуляция завершения просмотра (в реальности model-viewer имеет события)
  const handleCloseAR = () => {
      setShowAR(false);
      setExperienceCompleted(true);
  }

  const handleWishlistClick = () => { 
    if (isWished) {
        removeFromWishlist(product.id);
        addToast(`${product.name} убран из сохраненных`, 'info');
    } else {
        addToWishlist(product.id);
        addToast(`${product.name} сохранен`, 'success');
    }
  };

  const handleAskPrice = () => {
    addToast(`Менеджер скоро свяжется с вами по поводу стоимости "${product.name}"`, 'success');
  };

  if (showAR && product.model3dUrl) {
    return (
        <div className="fixed inset-0 z-[100] bg-warm-white">
            <ARViewer 
                src={product.model3dUrl} 
                iosSrc={product.model3dIosUrl}
                alt={product.name}
                poster={product.imageUrls?.[0]}
                product={product}
            />
            {/* Кнопка Закрыть AR */}
            <button 
                onClick={handleCloseAR} 
                className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft z-20 hover:bg-white transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5 text-soft-black" />
            </button>
        </div>
    );
  }

  return (
    <>
      <div className="bg-warm-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
            {/* Back Navigation */}
            <div className="mb-8">
                <button 
                    onClick={onBack} 
                    className="group inline-flex items-center text-sm font-normal text-muted-gray hover:text-soft-black transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Назад
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Visual */}
            <div className="relative aspect-square lg:aspect-auto rounded-2xl overflow-hidden shadow-soft bg-white">
                <Image 
                    src={product.imageUrls?.[0] || '/placeholder.svg'} 
                    alt={product.name} 
                    fill 
                    sizes="(max-width: 1024px) 100vw, 50vw" 
                    priority 
                    className="object-cover" 
                />
            </div>

            {/* Info & Actions */}
            <div className="flex flex-col pt-4 justify-center">
                
                {/* Status Badge (After AR) */}
                <Transition
                    show={experienceCompleted}
                    enter="transition-all duration-500 ease-out"
                    enterFrom="opacity-0 -translate-y-2"
                    enterTo="opacity-100 translate-y-0"
                >
                    <div className="inline-flex items-center gap-2 mb-6 text-sm text-soft-black/60 bg-white/50 px-3 py-1.5 rounded-full border border-stone-beige/20 w-fit">
                        <CheckCircleIcon className="w-4 h-4 text-brand-gold" />
                        Вы уже посмотрели этот объект
                    </div>
                </Transition>

                <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-4 leading-tight tracking-tight">
                    {product.name}
                </h1>

                <p className="text-base text-muted-gray leading-relaxed max-w-lg mb-10">
                    {product.description?.split('\n')[0]} 
                </p>
                
                {/* Главный CTA */}
                <div className="mt-auto space-y-4">
                    <Button 
                        onClick={handleToggleAR} 
                        size="lg"
                        className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-soft-black/10 flex items-center justify-center gap-3"
                    >
                        <CubeTransparentIcon className="w-6 h-6 stroke-1" />
                        {experienceCompleted ? 'Посмотреть ещё раз' : 'Поставить в комнату'}
                    </Button>

                    {/* Вторичные действия - появляются ПОСЛЕ опыта */}
                    <Transition
                        show={experienceCompleted}
                        as="div"
                        className="flex flex-col gap-3 pt-2"
                        enter="transition-all duration-700 delay-100 ease-out"
                        enterFrom="opacity-0 translate-y-4"
                        enterTo="opacity-100 translate-y-0"
                    >
                        <Button 
                            variant="secondary" 
                            className="w-full h-14 text-base font-medium rounded-xl border-stone-beige/30 hover:border-soft-black"
                            onClick={handleAskPrice}
                        >
                            Узнать стоимость
                        </Button>

                        <div className="flex items-center justify-center gap-8 mt-4">
                            <button onClick={handleWishlistClick} className="flex items-center gap-2 text-sm text-muted-gray hover:text-soft-black transition-colors group">
                                <HeartIcon className={cn("w-5 h-5 group-hover:scale-110 transition-transform", isWished && "fill-current text-brand-terracotta")} />
                                <span>{isWished ? 'В подборке' : 'Сохранить'}</span>
                            </button>
                            <button className="flex items-center gap-2 text-sm text-muted-gray hover:text-soft-black transition-colors group">
                                <ShareIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Поделиться</span>
                            </button>
                        </div>
                    </Transition>
                </div>
            </div>
            </div>
        </div>
      </div>
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
