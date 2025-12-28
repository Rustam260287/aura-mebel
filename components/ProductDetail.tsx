
import React, { useState, memo, useEffect } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
} from './icons';
import { useRouter } from 'next/router';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { ARViewer } from './ARViewer';
import Image from 'next/image';
import { Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetailComponent: React.FC<ProductDetailProps> = ({
  product,
  onBack,
}) => {
  const router = useRouter();
  const [isAROpen, setIsAROpen] = useState(false);
  const [experienceCompleted, setExperienceCompleted] = useState(false);
  const [postArSheetOpen, setPostArSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [show3DHint, setShow3DHint] = useState(false);

  const { isInWishlist, addToWishlist } = useWishlist();
  const { addToast } = useToast();
  const isWished = isInWishlist(product.id);

  const handleTryAR = () => {
    if (product.models?.glb) {
      setIsAROpen(true);
    } else {
      addToast('3D-модель для этого объекта пока не готова', 'info');
    }
  };

  const closeAR = () => {
    setIsAROpen(false);
    setExperienceCompleted(true);
    setPostArSheetOpen(true);
  };

  const handleSaveToWishlist = () => {
    if (!isWished) {
      addToWishlist(product.id);
      addToast(`${product.name} сохранён`, 'success');
    }
  };

  const handleOpenWishlist = () => router.push('/wishlist');

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
      !product.models?.glb
    ) {
      return undefined;
    }

    import('@google/model-viewer').catch(console.error);

    return undefined;
  }, [isMobile, product.models?.glb]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !isMobile ||
      !product.models?.glb
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
  }, [isMobile, product.models?.glb]);

  const ctaWrapperClass = isMobile
    ? 'fixed bottom-4 left-4 right-4 z-cta md:static md:mt-12'
    : 'mt-auto';

  if (isAROpen && product.models?.glb) {
    return (
      <ARViewer
        src={product.models.glb}
        iosSrc={product.models.usdz}
        alt={product.name}
        poster={product.imageUrls?.[0]}
        onClose={closeAR}
      />
    );
  }

  const primaryCta =
    !product.models?.glb
      ? { label: isWished ? 'Открыть подборку' : 'Сохранить в подборку', onClick: isWished ? handleOpenWishlist : handleSaveToWishlist }
      : {
          label: experienceCompleted ? 'Примерить ещё раз' : 'Поставить в комнату',
          onClick: handleTryAR,
        };

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
            {isMobile && product.models?.glb && (
              <div className="relative w-full h-[70vh] max-h-[520px] mb-10">
                <model-viewer
                  src={product.models.glb}
                  ios-src={product.models.usdz}
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
                onClick={primaryCta.onClick}
                size="lg"
                className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-soft-black/10"
              >
                {primaryCta.label}
              </Button>
            </div>

            <AnimatePresence>
              {experienceCompleted && postArSheetOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-soft-black/20 backdrop-blur-sm"
                  onClick={() => setPostArSheetOpen(false)}
                  role="dialog"
                  aria-modal="true"
                >
                  <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="absolute bottom-0 left-0 right-0 bg-warm-white rounded-t-3xl border-t border-stone-beige/30 shadow-soft p-5 sm:p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-sm text-soft-black/70">
                          <CheckCircleIcon className="w-4 h-4 text-brand-gold" />
                          Спокойно зафиксируем впечатление
                        </div>
                        <h2 className="text-xl font-medium text-soft-black mt-2">
                          Хотите сохранить этот объект?
                        </h2>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-soft-black/10"
                      onClick={() => {
                        if (isWished) {
                          handleOpenWishlist();
                        } else {
                          handleSaveToWishlist();
                        }
                      }}
                    >
                      {isWished ? 'Открыть подборку' : 'Сохранить в подборку'}
                    </Button>

                    <button
                      type="button"
                      className="w-full mt-4 text-sm text-muted-gray hover:text-soft-black transition-colors"
                      onClick={() => setPostArSheetOpen(false)}
                    >
                      Продолжить без сохранения
                    </button>

                    <p className="mt-5 text-xs text-muted-gray leading-relaxed">
                      Если захочется обсудить детали, напишите в чат — без спешки.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
