
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
import Image from 'next/image';
import { Tab } from '@headlessui/react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

// Умный парсер описания
const parseDescription = (description: string) => {
    if (!description) {
        return { mainDesc: 'Подробное описание товара готовится к публикации.', techSpecs: '' };
    }
    
    // Ключевые слова, обозначающие начало блока характеристик
    const keywords = [
        'Размеры:', 'Шкаф:', 'Кровать:', 'Тумба:', 'Трельяж:', 
        'Длина:', 'Ширина:', 'Высота:', 'Глубина:', 'В комплект входят:'
    ];
    
    const lines = description.split('\n').map(line => line.trim()).filter(line => line);
    
    let separatorIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (keywords.some(keyword => line.startsWith(keyword))) {
            separatorIndex = i;
            break;
        }
    }

    if (separatorIndex !== -1) {
        const mainDesc = lines.slice(0, separatorIndex).join('\n').trim();
        const techSpecs = lines.slice(separatorIndex).join('\n').trim();
        return { 
            mainDesc: mainDesc || 'Описание товара скоро будет добавлено.', 
            techSpecs 
        };
    }

    return { mainDesc: description.trim(), techSpecs: '' };
};

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const { reviews = [], imageUrls = [], description = '', ...restOfProduct } = product;
  const safeProduct = { reviews, imageUrls, description, ...restOfProduct };
  
  const [currentReviews, setCurrentReviews] = useState<Review[]>(safeProduct.reviews);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  
  const { addToCart } = useCartDispatch();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWished = isInWishlist(safeProduct.id);

  const galleryImages = useMemo(() => imageUrls.filter(url => url), [imageUrls]);

  const { mainDesc, techSpecs } = useMemo(() => parseDescription(description), [description]);

  const handleNextImage = useCallback(() => { 
    if (galleryImages.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % galleryImages.length); 
    }
  }, [galleryImages.length]);

  const handlePrevImage = useCallback(() => { 
    if (galleryImages.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length); 
    }
  }, [galleryImages.length]);
  
  const pageSwipeHandlers = useSwipe({ onSwipeRight: onBack });
  
  const gallerySwipe = useSwipe({ onSwipeLeft: handleNextImage, onSwipeRight: handlePrevImage });
  const gallerySwipeHandlers = useMemo(() => ({
    onTouchStart: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchStart(e); },
    onTouchMove: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchMove(e); },
    onTouchEnd: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchEnd(); }
  }), [gallerySwipe]);

  const handleWishlistClick = useCallback(() => { if (isWished) { removeFromWishlist(safeProduct.id); } else { addToWishlist(safeProduct.id); } }, [isWished, safeProduct.id, addToWishlist, removeFromWishlist]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);

  const handleShareClick = useCallback(async () => {
    const productUrl = `${window.location.origin}/products/${safeProduct.id}`;
    const shareData = {
        title: safeProduct.name,
        text: `Посмотрите этот товар в Labelcom Мебель: ${safeProduct.name}`,
        url: productUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareData.url);
            addToast('Ссылка на товар скопирована!', 'info');
        } catch (err) {
            addToast('Не удалось скопировать ссылку.', 'error');
        }
    }
  }, [safeProduct.id, safeProduct.name, addToast]);

  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => {
    const newReview: Review = { ...newReviewData, date: new Date().toISOString() };
    setCurrentReviews(prev => [newReview, ...prev]);
    addToast('Спасибо за ваш отзыв!', 'success');
  }, [addToast]);

  return (
    <>
      <div className="container mx-auto px-6 py-12" {...pageSwipeHandlers}>
        <Button variant="ghost" onClick={onBack} className="mb-8 hidden md:inline-flex">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад в каталог
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative group" {...gallerySwipeHandlers}>
              <div className="relative overflow-hidden rounded-lg shadow-md aspect-square bg-gray-50">
                {galleryImages.length > 0 ? (
                    <>
                        <div className="flex transition-transform duration-300 ease-in-out h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                            {galleryImages.map((url, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 relative cursor-zoom-in" onClick={() => setIsZoomModalOpen(true)}>
                                    <Image src={url} alt={`${safeProduct.name} - изображение ${index + 1}`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 50vw" />
                                </div>
                            ))}
                        </div>
                        {galleryImages.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Предыдущее изображение"><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Следующее изображение"><ChevronRightIcon className="w-6 h-6" /></button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{galleryImages.map((_, idx) => (<div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white'}`} />))}</div>
                            </>
                        )}
                    </>
                ) : ( <div className="w-full h-full flex items-center justify-center text-gray-300"><PhotoIcon className="w-24 h-24" /></div> )}
              </div>
            </div>
            {galleryImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">{galleryImages.map((url, index) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === index ? 'border-brand-brown shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}><Image src={url} alt={`Миниатюра ${index + 1}`} fill className="object-cover" sizes="80px" /></button>))}</div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center mb-4"><StarRating rating={safeProduct.rating} /><span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span></div>
            <p className="text-3xl lg:text-4xl font-serif text-brand-charcoal mb-8">{safeProduct.price.toLocaleString('ru-RU')} ₽</p>
            
            <div className="flex items-center gap-2 mb-4">
                <Button size="lg" onClick={handleAddToCart} className="flex-grow shadow-lg hover:shadow-xl transition-shadow">Добавить в корзину</Button>
                <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4 shadow-sm hover:shadow-md transition-shadow"><HeartIcon className={`w-6 h-6 ${isWished ? 'text-red-500 fill-current' : ''}`} /></Button>
                <Button variant="outline" size="lg" onClick={handleShareClick} className="px-4 shadow-sm hover:shadow-md transition-shadow"><ArrowUpTrayIcon className="w-6 h-6" /></Button>
            </div>
            
            <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setIsTryOnModalOpen(true)} 
                className="mb-8 w-full border-2 border-dashed border-brand-brown text-brand-brown hover:bg-brand-brown hover:text-white transition-all duration-300 group"
            >
                <CubeIcon className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                Примерить в комнате
            </Button>

            <div className="w-full">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-brand-cream-dark p-1">
                  <Tab as={Fragment}>{({ selected }) => ( <button className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${ selected ? 'bg-white shadow text-brand-brown' : 'text-brand-charcoal hover:bg-white/[0.6]' }`}>Описание</button> )}</Tab>
                  {techSpecs && <Tab as={Fragment}>{({ selected }) => ( <button className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${ selected ? 'bg-white shadow text-brand-brown' : 'text-brand-charcoal hover:bg-white/[0.6]' }`}>Характеристики</button> )}</Tab>}
                </Tab.List>
                <Tab.Panels className="mt-4">
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow-inner border border-brand-cream-dark prose max-w-none text-brand-charcoal prose-p:my-2 prose-headings:my-4">
                    <div dangerouslySetInnerHTML={{ __html: mainDesc.replace(/\n/g, '<br />') }} />
                  </Tab.Panel>
                  {techSpecs && <Tab.Panel className="rounded-xl bg-white p-6 shadow-inner border border-brand-cream-dark prose max-w-none text-brand-charcoal prose-p:my-2">
                     <div className="whitespace-pre-line font-mono text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: techSpecs }} />
                  </Tab.Panel>}
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        </div>
        <Reviews reviews={currentReviews} onAddReview={handleAddReview} />
      </div>
      
      {isZoomModalOpen && galleryImages.length > 0 && ( 
        <ImageZoomModal 
            isOpen={isZoomModalOpen} 
            onClose={() => setIsZoomModalOpen(false)} 
            images={galleryImages} 
            initialIndex={currentImageIndex}
            productName={safeProduct.name} 
        /> 
      )}
        
      {isTryOnModalOpen && (
        <FurnitureTryOnModal 
            isOpen={isTryOnModalOpen} 
            onClose={() => setIsTryOnModalOpen(false)} 
            productImage={galleryImages[currentImageIndex] || ''} 
            productName={safeProduct.name} 
        />
      )}
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
