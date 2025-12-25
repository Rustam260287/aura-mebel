
import React, { useState, memo, useEffect } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import {
  ArrowLeftIcon,
  HeartIcon,
  ShareIcon,
  CheckCircleIcon,
} from './icons';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { ARViewer } from './ARViewer';
import Image from 'next/image';
import { Transition } from '@headlessui/react';
import { cn } from '../utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetailComponent: React.FC<ProductDetailProps> = ({
  product,
  onBack,
}) => {
  const [isAROpen, setIsAROpen] = useState(false);
  const [experienceCompleted, setExperienceCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [show3DHint, setShow3DHint] = useState(false);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  const isWished = isInWishlist(product.id);

  const handleTryAR = () => {
    if (product.model3dUrl) {
      setIsAROpen(true);
    } else {
      addToast('3D-модель для этого объекта пока не готова', 'info');
    }
  };

  const closeAR = () => {
    setIsAROpen(false);
    setExperienceCompleted(true);
  };

  const handleWishlistClick = () => {
    if (isWished) {
      removeFromWishlist(product.id);
      addToast(`${product.name} убран из сохранённых`, 'info');
    } else {
      addToWishlist(product.id);
      addToast(`${product.name} сохранён`, 'success');
    }
  };

  const handleAskPrice = () => {
    addToast(
      `Менеджер свяжется с вами по поводу "${product.name}"`,
      'success'
    );
  };

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };
    updateIsMobile();

    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !isMobile ||
      !product.model3dUrl
    ) {
      return undefined;
    }

    import('@google/model-viewer').catch(console.error);

    return undefined;
  }, [isMobile, product.model3dUrl]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !isMobile ||
      !product.model3dUrl
    ) {
      setShow3DHint(false);
      return undefined;
    }

    try {
      if (localStorage.getItem('label_3d_hint_shown')) {
        setShow3DHint(false);
        return undefined;
      }
    } catch {
      setShow3DHint(false);
      return undefined;
    }

    setShow3DHint(true);
    const timer = setTimeout(() => {
      setShow3DHint(false);
      try {
        localStorage.setItem('label_3d_hint_shown', '1');
      } catch {}
    }, 2500);

    return () => clearTimeout(timer);
  }, [isMobile, product.model3dUrl]);

  const ctaWrapperClass = isMobile
    ? 'fixed bottom-4 left-4 right-4 z-cta md:static md:mt-12'
    : 'mt-auto';
  const experienceExtrasClass = isMobile
    ? 'flex flex-col gap-3 pt-6 mt-4'
    : 'flex flex-col gap-3 pt-4 mt-4';

  if (isAROpen && product.model3dUrl) {
    return (
      <ARViewer
        src={product.model3dUrl}
        iosSrc={product.model3dIosUrl}
        alt={product.name}
        poster={product.imageUrls?.[0]}
        onClose={closeAR}
      />
    );
  }

  return (
    <div className="bg-warm-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center text-sm text-muted-gray hover:text-soft-black transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Назад
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Visual block */}
          <div className="flex flex-col gap-16">
            {isMobile && product.model3dUrl && (
              <div className="relative w-full h-[70vh] max-h-[520px] mb-10">
                <model-viewer
                  src={product.model3dUrl}
                  ios-src={product.model3dIosUrl}
                  poster={product.imageUrls?.[0]}
                  alt={product.name}
                  camera-controls
                  disable-pan
                  disable-tap
                  camera-orbit="0deg 75deg 1.2m"
                  min-camera-orbit="-30deg 65deg 1.1m"
                  max-camera-orbit="30deg 85deg 1.4m"
                  field-of-view="30deg"
                  className="w-full h-full rounded-2xl bg-white"
                />
                <AnimatePresence>
                  {show3DHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2
                                 bg-soft-black/60 text-white text-xs
                                 px-4 py-2 rounded-full pointer-events-none"
                    >
                      Поверните объект, чтобы рассмотреть
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {(product.imageUrls?.length ? product.imageUrls : ['/placeholder.svg']).map(
              (src, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-soft"
                >
                  <Image
                    src={src}
                    alt={`${product.name} — view ${index + 1}`}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    className="object-contain"
                  />
                </div>
              )
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col pt-4 justify-center pb-32 md:pb-0">
            <Transition
              show={experienceCompleted}
              enter="transition-all duration-500 ease-out"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
            >
              <div className="inline-flex items-center gap-2 mb-6 text-sm text-soft-black/60 bg-white/50 px-3 py-1.5 rounded-full border border-stone-beige/20 w-fit">
                <CheckCircleIcon className="w-4 h-4 text-brand-gold" />
                Вы примерили этот объект
              </div>
            </Transition>

            <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-10 leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className={ctaWrapperClass}>
              <Button
                onClick={handleTryAR}
                size="lg"
                className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-soft-black/10"
              >
                {experienceCompleted
                  ? 'Посмотреть ещё раз'
                  : 'Поставить в комнату'}
              </Button>
            </div>

            <Transition
              show={experienceCompleted}
              as="div"
              className={experienceExtrasClass}
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
                <button
                  onClick={handleWishlistClick}
                  className="flex items-center gap-2 text-sm text-muted-gray hover:text-soft-black transition-colors group"
                >
                  <HeartIcon
                    className={cn(
                      'w-5 h-5 group-hover:scale-110 transition-transform',
                      isWished &&
                        'fill-current text-brand-terracotta'
                    )}
                  />
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
  );
};

export const ProductDetail = memo(ProductDetailComponent);
