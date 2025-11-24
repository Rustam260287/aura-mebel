
import React, { useState, TouchEvent, memo, useCallback, useMemo } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PinterestIcon, PhotoIcon, CubeTransparentIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useSwipe } from '../hooks/useSwipe';
import { ImageZoomModal } from './ImageZoomModal';
import Image from 'next/image';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const safeProduct = {
    reviews: [],
    imageUrls: [],
    details: { dimensions: '', material: '', care: '' },
    description: '',
    ...product,
  };

  const [currentReviews, setCurrentReviews] = useState<Review[]>(safeProduct.reviews);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const pageSwipeHandlers = useSwipe({ onSwipeRight: onBack });
  
  const isWished = isInWishlist(safeProduct.id);

  // --- ЛОГИКА РАЗДЕЛЕНИЯ ОПИСАНИЯ ---
  const { mainDescription, techSpecs } = useMemo(() => {
    const description = safeProduct.description || '';
    const separator = 'Техническая информация:';
    const parts = description.split(separator);
    
    const main = parts[0].replace('Описание', '').trim();
    const technical = parts[1] ? parts[1].trim().split('\n').filter(line => line.trim() !== '') : [];

    return { mainDescription: main, techSpecs: technical };
  }, [safeProduct.description]);

  // ... (остальные хуки без изменений)
  const handleNextImage = useCallback(() => { setCurrentImageIndex(prev => (prev + 1) % safeProduct.imageUrls.length); }, [safeProduct.imageUrls.length]);
  const handlePrevImage = useCallback(() => { setCurrentImageIndex(prev => (prev - 1 + safeProduct.imageUrls.length) % safeProduct.imageUrls.length); }, [safeProduct.imageUrls.length]);
  const gallerySwipe = useSwipe({ onSwipeLeft: handleNextImage, onSwipeRight: handlePrevImage });
  const gallerySwipeHandlers = useMemo(() => ({ onTouchStart: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchStart(e); }, onTouchMove: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchMove(e); }, onTouchEnd: () => { gallerySwipe.onTouchEnd(); }, }), [gallerySwipe]);
  const handleWishlistClick = useCallback(() => { if (isWished) { removeFromWishlist(safeProduct.id); addToast(`${safeProduct.name} удален из избранного`, 'info'); } else { addToWishlist(safeProduct.id); addToast(`${safeProduct.name} добавлен в избранное`, 'success'); } }, [isWished, safeProduct.id, safeProduct.name, addToWishlist, removeFromWishlist, addToast]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);
  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => { const newReview: Review = { ...newReviewData, date: new Date().toISOString() }; setCurrentReviews(prev => [newReview, ...prev]); addToast('Спасибо за ваш отзыв!', 'success'); }, [addToast]);

  return (
    <>
      <div className="container mx-auto px-6 py-12" {...pageSwipeHandlers}>
        <Button variant="ghost" onClick={onBack} className="mb-8">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад в каталог
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="relative group" {...gallerySwipeHandlers}>
            {/* ... (код галереи без изменений) ... */}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center mb-4">
              <StarRating rating={safeProduct.rating} />
              <span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span>
            </div>
            <p className="text-3xl font-serif text-brand-charcoal mb-6">{safeProduct.price.toLocaleString('ru-RU')} ₽</p>
            
            {/* --- ОБНОВЛЕННЫЙ БЛОК ОПИСАНИЯ --- */}
            {mainDescription && (
              <div className="prose prose-lg text-brand-charcoal max-w-none mb-8">
                <p>{mainDescription}</p>
              </div>
            )}
            
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-4">
                  <Button size="lg" onClick={handleAddToCart} className="flex-grow">Добавить в корзину</Button>
                  <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4"><HeartIcon className={`w-6 h-6 ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : ''}`} /></Button>
              </div>
            </div>

            {/* --- ОБНОВЛЕННЫЙ БЛОК ХАРАКТЕРИСТИК --- */}
            {techSpecs.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-cream-dark">
                <h3 className="text-xl font-serif text-brand-charcoal mb-4 flex items-center">
                  <CubeTransparentIcon className="w-6 h-6 mr-3 text-brand-brown" />
                  Состав и габариты
                </h3>
                <div className="space-y-3 text-brand-charcoal">
                  {techSpecs.map((spec, index) => {
                    const parts = spec.split(/ (Ш\.|В\.|[ДГ]\.) /);
                    const itemName = parts[0].trim();
                    const dimensions = parts.slice(1).join(' ');
                    return (
                      <div key={index} className="flex justify-between items-baseline border-b border-dashed pb-2 last:border-b-0">
                        <span className="font-semibold capitalize">{itemName}</span>
                        <span className="text-sm text-gray-600 text-right">{dimensions}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <Reviews reviews={currentReviews} onAddReview={handleAddReview} />
      </div>

      {isZoomModalOpen && safeProduct.imageUrls[currentImageIndex] && (
        <ImageZoomModal 
          imageUrl={safeProduct.imageUrls[currentImageIndex]} 
          onClose={() => setIsZoomModalOpen(false)} 
        />
      )}
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
