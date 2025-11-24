
import React, { useState, TouchEvent, memo, useCallback, useMemo } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PinterestIcon, PhotoIcon } from './Icons';
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
  // --- ЗАЩИТА ОТ ОШИБОК ---
  // Если product неполный, используем значения по умолчанию
  const safeProduct = {
    reviews: [],
    imageUrls: [],
    details: { dimensions: '', material: '', care: '' },
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
  
  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % safeProduct.imageUrls.length);
  }, [safeProduct.imageUrls.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + safeProduct.imageUrls.length) % safeProduct.imageUrls.length);
  }, [safeProduct.imageUrls.length]);
  
  const gallerySwipe = useSwipe({
    onSwipeLeft: handleNextImage,
    onSwipeRight: handlePrevImage,
  });

  const gallerySwipeHandlers = useMemo(() => ({
    onTouchStart: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchStart(e); },
    onTouchMove: (e: TouchEvent<HTMLElement>) => { e.stopPropagation(); gallerySwipe.onTouchMove(e); },
    onTouchEnd: () => { gallerySwipe.onTouchEnd(); },
  }), [gallerySwipe]);

  const handleWishlistClick = useCallback(() => {
    if (isWished) {
      removeFromWishlist(safeProduct.id);
      addToast(`${safeProduct.name} удален из избранного`, 'info');
    } else {
      addToWishlist(safeProduct.id);
      addToast(`${safeProduct.name} добавлен в избранное`, 'success');
    }
  }, [isWished, safeProduct.id, safeProduct.name, addToWishlist, removeFromWishlist, addToast]);
  
  const handleAddToCart = useCallback(() => {
      addToCart(safeProduct);
      addToast(`${safeProduct.name} добавлен в корзину`, 'success');
  }, [addToCart, safeProduct, addToast]);

  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => {
    const newReview: Review = { ...newReviewData, date: new Date().toISOString() };
    setCurrentReviews(prev => [newReview, ...prev]);
    addToast('Спасибо за ваш отзыв!', 'success');
  }, [addToast]);

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
            <div className="relative overflow-hidden rounded-lg shadow-md">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                onClick={() => safeProduct.imageUrls.length > 0 && setIsZoomModalOpen(true)}
              >
                {safeProduct.imageUrls.length > 0 ? (
                  safeProduct.imageUrls.map((url, index) => (
                    url && <Image 
                      key={index}
                      src={url} 
                      alt={`${safeProduct.name} - изображение ${index + 1}`} 
                      className="w-full h-auto object-cover aspect-square flex-shrink-0"
                      width={500}
                      height={500}
                    />
                  ))
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                    <PhotoIcon className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {safeProduct.imageUrls.length > 1 && (
              <>
                <button onClick={handlePrevImage} className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/60 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white" aria-label="Предыдущее изображение">
                  <ChevronLeftIcon className="w-6 h-6 text-brand-charcoal" />
                </button>
                <button onClick={handleNextImage} className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/60 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white" aria-label="Следующее изображение">
                  <ChevronRightIcon className="w-6 h-6 text-brand-charcoal" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {safeProduct.imageUrls.map((_, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-3 h-3 rounded-full transition-colors ${index === currentImageIndex ? 'bg-brand-brown' : 'bg-white/70 hover:bg-white'}`} aria-label={`Перейти к изображению ${index + 1}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center mb-4">
              <StarRating rating={safeProduct.rating} />
              <span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span>
            </div>
            <p className="text-3xl font-serif text-brand-charcoal mb-6">{safeProduct.price.toLocaleString('ru-RU')} ₽</p>
            <p className="text-brand-charcoal leading-relaxed mb-8 whitespace-pre-line">{safeProduct.seoDescription || safeProduct.description}</p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-4">
                  <Button size="lg" onClick={handleAddToCart} className="flex-grow">Добавить в корзину</Button>
                  <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4"><HeartIcon className={`w-6 h-6 ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : ''}`} /></Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-brand-charcoal mb-3">Характеристики</h3>
              <ul className="list-disc list-inside text-brand-charcoal space-y-2 leading-relaxed">
                {safeProduct.details.dimensions && <li><strong>Размеры:</strong> {safeProduct.details.dimensions}</li>}
                {safeProduct.details.material && <li><strong>Материал:</strong> {safeProduct.details.material}</li>}
                {safeProduct.details.care && <li><strong>Уход:</strong> {safeProduct.details.care}</li>}
              </ul>
            </div>
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
