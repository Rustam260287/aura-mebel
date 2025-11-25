
import React, { useState, memo, useCallback, useMemo, Fragment } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { ImageZoomModal } from './ImageZoomModal';
import Image from 'next/image';
import { Tab } from '@headlessui/react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const parseDescription = (description: string) => {
    if (!description) {
        return { mainDesc: '', techSpecs: '' };
    }
    const separator = 'Техническая информация:';
    const separatorIndex = description.indexOf(separator);

    if (separatorIndex !== -1) {
        const mainDesc = description.substring(0, separatorIndex).trim();
        const techSpecs = description.substring(separatorIndex + separator.length).trim();
        return { mainDesc, techSpecs };
    }

    return { mainDesc: description.trim(), techSpecs: '' };
};

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const safeProduct = { reviews: [], imageUrls: [], description: '', ...product };
  
  const [currentReviews, setCurrentReviews] = useState<Review[]>(safeProduct.reviews);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWished = isInWishlist(safeProduct.id);

  // **ИСПРАВЛЕНИЕ:** Перемещаем объявление images ВВЕРХ
  const images = useMemo(() => safeProduct.imageUrls.filter(url => url), [safeProduct.imageUrls]);

  const { mainDesc, techSpecs } = useMemo(() => parseDescription(safeProduct.description), [safeProduct.description]);

  const handleNextImage = useCallback(() => { setCurrentImageIndex(prev => (prev + 1) % images.length); }, [images.length]);
  const handlePrevImage = useCallback(() => { setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length); }, [images.length]);
  const handleWishlistClick = useCallback(() => { if (isWished) { removeFromWishlist(safeProduct.id); } else { addToWishlist(safeProduct.id); } }, [isWished, safeProduct.id, addToWishlist, removeFromWishlist]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);

  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => {
    const newReview: Review = { ...newReviewData, date: new Date().toISOString() };
    setCurrentReviews(prev => [newReview, ...prev]);
    addToast('Спасибо за ваш отзыв!', 'success');
  }, [addToast]);

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={onBack} className="mb-8 hidden md:inline-flex">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад в каталог
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-lg shadow-md aspect-square bg-gray-50">
                {images.length > 0 ? (
                    <>
                        <div className="flex transition-transform duration-300 ease-in-out h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }} onClick={() => setIsZoomModalOpen(true)}>
                            {images.map((url, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 relative cursor-zoom-in">
                                    <Image src={url} alt={`${safeProduct.name} - изображение ${index + 1}`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 50vw" />
                                </div>
                            ))}
                        </div>
                        {images.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Предыдущее изображение"><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Следующее изображение"><ChevronRightIcon className="w-6 h-6" /></button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{images.map((_, idx) => (<div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />))}</div>
                            </>
                        )}
                    </>
                ) : ( <div className="w-full h-full flex items-center justify-center text-gray-300"><PhotoIcon className="w-24 h-24" /></div> )}
              </div>
            </div>
            {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">{images.map((url, index) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === index ? 'border-brand-brown shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}><Image src={url} alt={`Миниатюра ${index + 1}`} fill className="object-cover" sizes="80px" /></button>))}</div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center mb-4"><StarRating rating={safeProduct.rating} /><span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span></div>
            <p className="text-3xl lg:text-4xl font-serif text-brand-charcoal mb-8">{safeProduct.price.toLocaleString('ru-RU')} ₽</p>
            <div className="flex items-center gap-4 mb-8">
                <Button size="lg" onClick={handleAddToCart} className="flex-grow shadow-lg hover:shadow-xl transition-shadow">Добавить в корзину</Button>
                <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4 shadow-sm hover:shadow-md transition-shadow"><HeartIcon className={`w-6 h-6 ${isWished ? 'text-red-500 fill-current' : ''}`} /></Button>
            </div>
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
                  {techSpecs && <Tab.Panel className="rounded-xl bg-white p-6 shadow-inner border border-brand-cream-dark prose max-w-none text-brand-charcoal prose-p:my-2 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1">
                     <div dangerouslySetInnerHTML={{ __html: techSpecs.replace(/\n/g, '<br />') }} />
                  </Tab.Panel>}
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        </div>
        <Reviews reviews={currentReviews} onAddReview={handleAddReview} />
        {isZoomModalOpen && images.length > 0 && ( <ImageZoomModal isOpen={isZoomModalOpen} onClose={() => setIsZoomModalOpen(false)} imageUrl={images[currentImageIndex] || ''} productName={safeProduct.name} /> )}
      </div>
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
