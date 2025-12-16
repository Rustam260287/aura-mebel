
import React, { useState, memo, useMemo, Fragment, TouchEvent, useCallback } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon, ArrowUpTrayIcon, CubeIcon } from './Icons';
import { useCartDispatch } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useSwipe } from '../hooks/useSwipe';
import { ImageZoomModal } from './ImageZoomModal';
import { FurnitureTryOnModal } from './FurnitureTryOnModal';
import { ARViewer } from './ARViewer'; 
import Image from 'next/image';
import { Tab } from '@headlessui/react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

type GalleryItem = {
  type: 'image' | 'video' | '3d';
  url: string;
};

const parseDescription = (description: string) => {
    if (!description) return { mainDesc: 'Подробное описание товара готовится к публикации.', techSpecs: '' };
    const keywords = ['Размеры:', 'Шкаф:', 'Кровать:', 'Тумба:', 'Трельяж:', 'Длина:', 'Ширина:', 'Высота:', 'Глубина:', 'В комплект входят:'];
    const lines = description.split('\n').map(line => line.trim()).filter(line => line);
    let separatorIndex = lines.findIndex(line => keywords.some(keyword => line.startsWith(keyword)));
    if (separatorIndex !== -1) {
        return { 
            mainDesc: lines.slice(0, separatorIndex).join('\n').trim() || 'Описание товара скоро будет добавлено.', 
            techSpecs: lines.slice(separatorIndex).join('\n').trim() 
        };
    }
    return { mainDesc: description.trim(), techSpecs: '' };
};

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const safeProduct = useMemo(() => ({
    ...product,
    reviews: product.reviews ?? [],
    imageUrls: product.imageUrls ?? [],
    description: product.description ?? '',
  }), [product]);
  
  const { imageUrls, videoUrl, model3dUrl, model3dIosUrl, description } = safeProduct;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCartDispatch();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWished = isInWishlist(safeProduct.id);

  const galleryItems = useMemo((): GalleryItem[] => {
      const items: GalleryItem[] = imageUrls.filter(url => url).map(url => ({ type: 'image', url }));
      if (videoUrl) items.push({ type: 'video', url: videoUrl });
      if (model3dUrl) items.push({ type: '3d', url: model3dUrl });
      return items;
  }, [imageUrls, videoUrl, model3dUrl]);

  const { mainDesc, techSpecs } = useMemo(() => parseDescription(description), [description]);
  const currentItem = galleryItems[currentIndex];

  const handleNext = useCallback(() => galleryItems.length > 0 && setCurrentIndex(prev => (prev + 1) % galleryItems.length), [galleryItems.length]);
  const handlePrev = useCallback(() => galleryItems.length > 0 && setCurrentIndex(prev => (prev - 1 + galleryItems.length) % galleryItems.length), [galleryItems.length]);
  
  const pageSwipe = useSwipe({ onSwipeRight: onBack });
  const pageSwipeHandlers = useMemo(
    () => ({
      onTouchStart: (e: TouchEvent<HTMLElement>) => {
        if (currentItem?.type !== '3d') pageSwipe.onTouchStart(e);
      },
      onTouchMove: (e: TouchEvent<HTMLElement>) => {
        if (currentItem?.type !== '3d') pageSwipe.onTouchMove(e);
      },
      onTouchEnd: () => {
        if (currentItem?.type !== '3d') pageSwipe.onTouchEnd();
      },
    }),
    [pageSwipe, currentItem],
  );
  const gallerySwipe = useSwipe({ onSwipeLeft: handleNext, onSwipeRight: handlePrev });
  
  const gallerySwipeHandlers = useMemo(() => ({
    onTouchStart: (e: TouchEvent<HTMLElement>) => { if (currentItem?.type !== '3d') gallerySwipe.onTouchStart(e); },
    onTouchMove: (e: TouchEvent<HTMLElement>) => { if (currentItem?.type !== '3d') gallerySwipe.onTouchMove(e); },
    onTouchEnd: () => { if (currentItem?.type !== '3d') gallerySwipe.onTouchEnd(); }
  }), [gallerySwipe, currentItem]);

  const handleWishlistClick = useCallback(() => { if (isWished) removeFromWishlist(safeProduct.id); else addToWishlist(safeProduct.id); }, [isWished, safeProduct.id, addToWishlist, removeFromWishlist]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);
  const handleShareClick = useCallback(async () => { /* ... share logic ... */ }, [safeProduct.name, addToast]);
  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => addToast('Спасибо за ваш отзыв!', 'success'), [addToast]);
  const imageItems = useMemo(() => galleryItems.filter(item => item.type === 'image').map(item => item.url), [galleryItems]);

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-8" {...pageSwipeHandlers}>
        <div className="md:hidden mb-4"><Button variant="ghost" onClick={onBack}><ArrowLeftIcon className="w-5 h-5 mr-2" />Назад</Button></div>
        <Button variant="ghost" onClick={onBack} className="mb-8 hidden md:inline-flex"><ArrowLeftIcon className="w-5 h-5 mr-2" />Назад в каталог</Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative group" {...gallerySwipeHandlers}>
              <div className="relative overflow-hidden rounded-lg shadow-md aspect-square bg-gray-50 flex items-center justify-center">
                {currentItem ? (
                    <>
                        {currentItem.type === 'image' && (
                            <div className="w-full h-full relative cursor-zoom-in" onClick={() => setIsZoomModalOpen(true)}>
                                <Image src={currentItem.url} alt={safeProduct.name} fill sizes="100vw" priority className="object-cover" />
                            </div>
                        )}
                        {currentItem.type === 'video' && <video src={currentItem.url} controls className="w-full h-full object-contain bg-black" poster={imageUrls[0]}/>}
                        {currentItem.type === '3d' && (
                            <ARViewer 
                                src={currentItem.url} 
                                iosSrc={model3dIosUrl}
                                alt={safeProduct.name}
                                poster={imageUrls[0]}
                                product={safeProduct}
                                onAddToCart={handleAddToCart}
                            />
                        )}
                        {galleryItems.length > 1 && currentItem.type !== '3d' && (
                            <>
                                <button onClick={handlePrev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md z-10"><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={handleNext} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md z-10"><ChevronRightIcon className="w-6 h-6" /></button>
                            </>
                        )}
                    </>
                ) : <div className="text-gray-300"><PhotoIcon className="w-24 h-24" /></div>}
              </div>
            </div>
            {galleryItems.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {galleryItems.map((item, index) => (
                        <button key={index} onClick={() => setCurrentIndex(index)} className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${currentIndex === index ? 'border-brand-brown' : 'border-transparent'}`}>
                            {item.type === 'image' ? <Image src={item.url} alt={`Thumb ${index + 1}`} fill sizes="80px" className="object-cover" /> :
                             item.type === 'video' ? <div className="w-full h-full bg-black flex items-center justify-center"><span className="text-white text-xs">VIDEO</span></div> :
                             <div className="w-full h-full bg-brand-cream flex items-center justify-center"><CubeIcon className="w-6 h-6 text-brand-brown" /></div>}
                        </button>
                    ))}
                </div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center gap-6 mb-6"><StarRating rating={safeProduct.rating ?? 0} /><span className="text-sm text-gray-500">({(safeProduct.reviews ?? []).length} отзывов)</span></div>
            <div className="text-3xl sm:text-4xl font-light text-brand-charcoal mb-8">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(safeProduct.price)}</div>
            <div className="flex items-center gap-4 mb-8">
              <Button onClick={handleAddToCart} size="lg">Добавить в корзину</Button>
              <Button variant="outline" onClick={handleWishlistClick} className="p-3"><HeartIcon className={`w-6 h-6 ${isWished ? 'text-red-500 fill-current' : ''}`} /></Button>
            </div>
            {/* ... rest of the component ... */}
          </div>
        </div>
      </div>
      <ImageZoomModal isOpen={isZoomModalOpen} onClose={() => setIsZoomModalOpen(false)} images={imageItems} initialIndex={imageItems.indexOf(currentItem?.url)} productName={safeProduct.name}/>
      {/* <FurnitureTryOnModal isOpen={isTryOnModalOpen} onClose={() => setIsTryOnModalOpen(false)} product={safeProduct} /> */}
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
