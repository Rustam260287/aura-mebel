
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
    if (!description) {
        return { mainDesc: 'Подробное описание товара готовится к публикации.', techSpecs: '' };
    }
    const keywords = [
        'Размеры:', 'Шкаф:', 'Кровать:', 'Тумба:', 'Трельяж:', 
        'Длина:', 'Ширина:', 'Высота:', 'Глубина:', 'В комплект входят:'
    ];
    const lines = description.split('\n').map(line => line.trim()).filter(line => line);
    let separatorIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (keywords.some(keyword => lines[i].startsWith(keyword))) {
            separatorIndex = i;
            break;
        }
    }
    if (separatorIndex !== -1) {
        return { 
            mainDesc: lines.slice(0, separatorIndex).join('\n').trim() || 'Описание товара скоро будет добавлено.', 
            techSpecs: lines.slice(separatorIndex).join('\n').trim() 
        };
    }
    return { mainDesc: description.trim(), techSpecs: '' };
};

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const { reviews = [], imageUrls = [], description = '', videoUrl, model3dUrl, model3dIosUrl, ...restOfProduct } = product;
  const safeProduct = { reviews, imageUrls, description, videoUrl, model3dUrl, model3dIosUrl, ...restOfProduct };
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  
  const { addToCart } = useCartDispatch();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWished = isInWishlist(safeProduct.id);

  const galleryItems = useMemo((): GalleryItem[] => {
      const items: GalleryItem[] = imageUrls.filter(url => url).map(url => ({ type: 'image', url }));
      if (videoUrl) {
          items.push({ type: 'video', url: videoUrl });
      }
      if (model3dUrl) {
          items.push({ type: '3d', url: model3dUrl });
      }
      return items;
  }, [imageUrls, videoUrl, model3dUrl]);

  const { mainDesc, techSpecs } = useMemo(() => parseDescription(description), [description]);

  const handleNext = useCallback(() => { 
    if (galleryItems.length > 0) {
      setCurrentIndex(prev => (prev + 1) % galleryItems.length); 
    }
  }, [galleryItems.length]);

  const handlePrev = useCallback(() => { 
    if (galleryItems.length > 0) {
      setCurrentIndex(prev => (prev - 1 + galleryItems.length) % galleryItems.length); 
    }
  }, [galleryItems.length]);
  
  const pageSwipeHandlers = useSwipe({ onSwipeRight: onBack });
  const gallerySwipe = useSwipe({ onSwipeLeft: handleNext, onSwipeRight: handlePrev });
  const gallerySwipeHandlers = useMemo(() => ({
    onTouchStart: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchStart(e); },
    onTouchMove: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchMove(e); },
    onTouchEnd: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchEnd(); }
  }), [gallerySwipe]);

  const handleWishlistClick = useCallback(() => { if (isWished) { removeFromWishlist(safeProduct.id); } else { addToWishlist(safeProduct.id); } }, [isWished, safeProduct.id, addToWishlist, removeFromWishlist]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);

  const handleShareClick = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: safeProduct.name, text: `Оцените ${safeProduct.name} от Labelcom!`, url: window.location.href });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Ссылка на товар скопирована!', 'info');
    }
  }, [safeProduct.name, addToast]);

  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => {
    addToast('Спасибо за ваш отзыв! Он будет опубликован после модерации.', 'success');
  }, [addToast]);

  const currentItem = galleryItems[currentIndex];
  const imageItems = useMemo(() => galleryItems.filter(item => item.type === 'image').map(item => item.url), [galleryItems]);

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-8" {...pageSwipeHandlers}>
        {/* Mobile-only back button */}
        <div className="md:hidden mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад
          </Button>
        </div>

        {/* Desktop-only back button */}
        <Button variant="ghost" onClick={onBack} className="mb-8 hidden md:inline-flex">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад в каталог
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative group" {...gallerySwipeHandlers}>
              <div className="relative overflow-hidden rounded-lg shadow-md aspect-square bg-gray-50 flex items-center justify-center">
                {galleryItems.length > 0 && currentItem ? (
                    <>
                        {currentItem.type === 'image' ? (
                            <div className="w-full h-full relative cursor-zoom-in" onClick={() => setIsZoomModalOpen(true)}>
                                <Image src={currentItem.url} alt={`${safeProduct.name}`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 50vw" priority />
                            </div>
                        ) : currentItem.type === 'video' ? (
                            <video 
                                src={currentItem.url} 
                                controls 
                                className="w-full h-full object-contain bg-black" 
                                poster={imageUrls[0]}
                            />
                        ) : (
                            <ARViewer 
                                src={currentItem.url} 
                                iosSrc={model3dIosUrl}
                                alt={safeProduct.name}
                                poster={imageUrls[0]}
                            />
                        )}

                        {galleryItems.length > 1 && currentItem.type !== '3d' && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronRightIcon className="w-6 h-6" /></button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                    {galleryItems.map((_, idx) => (
                                        <div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }} className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${idx === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : ( <div className="w-full h-full flex items-center justify-center text-gray-300"><PhotoIcon className="w-24 h-24" /></div> )}
              </div>
            </div>
            {galleryItems.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                    {galleryItems.map((item, index) => (
                        <button 
                            key={index} 
                            onClick={() => setCurrentIndex(index)} 
                            className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentIndex === index ? 'border-brand-brown shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        >
                            {item.type === 'image' ? (
                                <Image src={item.url} alt={`Миниатюра ${index + 1}`} fill className="object-cover" sizes="80px" />
                            ) : item.type === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">VIDEO</span>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-brand-cream flex items-center justify-center flex-col">
                                    <CubeIcon className="w-6 h-6 text-brand-brown mb-1" />
                                    <span className="text-brand-brown text-[10px] font-bold">3D VIEW</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center gap-6 mb-6">
              <StarRating rating={safeProduct.rating ?? 0} />
              <span className="text-sm text-gray-500">({(safeProduct.reviews ?? []).length} отзывов)</span>
            </div>
            <div className="text-3xl sm:text-4xl font-light text-brand-charcoal mb-8">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(safeProduct.price)}
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <Button onClick={handleAddToCart} size="lg">Добавить в корзину</Button>
              <Button variant="outline" onClick={handleWishlistClick} aria-label="Добавить в избранное" className="p-3">
                <HeartIcon className={`w-6 h-6 transition-colors ${isWished ? 'text-red-500 fill-current' : 'text-brand-charcoal'}`} />
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-gray-300 bg-gray-100 text-gray-600 shadow-inner">
                    <CubeIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-brand-charcoal">Примерить в комнате (AI)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">скоро</span>
                </div>
                <Button variant="text" onClick={handleShareClick}>
                  <ArrowUpTrayIcon className="w-5 h-5 mr-2"/>
                  Поделиться
                </Button>
            </div>

            <div className="w-full max-w-full">
                 <Tab.Group>
                    <Tab.List className="flex border-b border-gray-200">
                        <Tab as={Fragment}>{
                            ({ selected }) => <button className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors outline-none ${selected ? 'text-brand-brown border-b-2 border-brand-brown' : 'text-gray-500 hover:text-brand-charcoal'}`}>Описание</button>
                        }</Tab>
                        {techSpecs && <Tab as={Fragment}>{ 
                            ({ selected }) => <button className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors outline-none ${selected ? 'text-brand-brown border-b-2 border-brand-brown' : 'text-gray-500 hover:text-brand-charcoal'}`}>Характеристики</button>
                        }</Tab>}
                        <Tab as={Fragment}>{
                             ({ selected }) => <button className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors outline-none ${selected ? 'text-brand-brown border-b-2 border-brand-brown' : 'text-gray-500 hover:text-brand-charcoal'}`}>Отзывы ({(safeProduct.reviews ?? []).length})</button>
                        }</Tab>
                    </Tab.List>
                    <Tab.Panels className="mt-6">
                        <Tab.Panel className="prose max-w-none text-gray-600 leading-relaxed">
                            <p>{mainDesc}</p>
                        </Tab.Panel>
                       {techSpecs && <Tab.Panel className="prose max-w-none text-gray-600">
                           <pre className="whitespace-pre-wrap font-sans text-sm">{techSpecs}</pre>
                        </Tab.Panel>}
                        <Tab.Panel>
                            <Reviews productId={safeProduct.id} reviews={safeProduct.reviews ?? []} onAddReview={handleAddReview} />
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
          </div>
        </div>
      </div>
      <ImageZoomModal 
        isOpen={isZoomModalOpen} 
        onClose={() => setIsZoomModalOpen(false)} 
        images={imageItems} 
        initialIndex={imageItems.indexOf(currentItem?.url)} 
        productName={safeProduct.name}
      />
      <FurnitureTryOnModal isOpen={isTryOnModalOpen} onClose={() => setIsTryOnModalOpen(false)} product={safeProduct} />
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
