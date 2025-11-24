import React, { useState, TouchEvent, memo, useCallback, useMemo } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PinterestIcon } from './Icons';
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
  const [currentReviews, setCurrentReviews] = useState<Review[]>(product.reviews || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const pageSwipeHandlers = useSwipe({ onSwipeRight: onBack });
  
  const isWished = isInWishlist(product.id);

  // Fallback for details object
  const details = product.details || { dimensions: '', material: '', care: '' };
  
  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % product.imageUrls.length);
  }, [product.imageUrls.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);
  }, [product.imageUrls.length]);
  
  const gallerySwipe = useSwipe({
    onSwipeLeft: handleNextImage,
    onSwipeRight: handlePrevImage,
  });

  const gallerySwipeHandlers = useMemo(() => ({
    onTouchStart: (e: TouchEvent<HTMLElement>) => {
      e.stopPropagation(); 
      gallerySwipe.onTouchStart(e);
    },
    onTouchMove: (e: TouchEvent<HTMLElement>) => {
      e.stopPropagation();
      gallerySwipe.onTouchMove(e);
    },
    onTouchEnd: () => {
      gallerySwipe.onTouchEnd();
    },
  }), [gallerySwipe]);

  const handleWishlistClick = useCallback(() => {
    if (isWished) {
      removeFromWishlist(product.id);
      addToast(`${product.name} удален из избранного`, 'info');
    } else {
      addToWishlist(product.id);
      addToast(`${product.name} добавлен в избранное`, 'success');
    }
  }, [isWished, product.id, product.name, addToWishlist, removeFromWishlist, addToast]);
  
  const handleAddToCart = useCallback(() => {
      addToCart(product);
      addToast(`${product.name} добавлен в корзину`, 'success');
  }, [addToCart, product, addToast]);

  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => {
    const newReview: Review = {
      ...newReviewData,
      date: new Date().toISOString(),
    };
    setCurrentReviews(prev => [newReview, ...prev]);
    addToast('Спасибо за ваш отзыв!', 'success');
  }, [addToast]);

  const handlePinterestShare = useCallback(() => {
    const pageUrl = window.location.href;
    const imageUrl = product.imageUrls[currentImageIndex];
    const description = `${product.name} - ${product.seoDescription || product.description} | Aura Мебель`;
    
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(description)}`;
    
    window.open(pinterestUrl, '_blank', 'noopener,noreferrer');
  }, [product, currentImageIndex]);

  return (
    <>
      <div className="container mx-auto px-6 py-12" {...pageSwipeHandlers}>
        <Button variant="ghost" onClick={onBack} className="mb-8">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад в каталог
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* ... Image Gallery ... */}
          
          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-serif text-brand-brown mb-4">{product.name}</h1>
            <div className="flex items-center mb-4">
              <StarRating rating={product.rating} />
              <span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span>
            </div>
            <p className="text-3xl font-serif text-brand-charcoal mb-6">{product.price.toLocaleString('ru-RU')} ₽</p>
            <p className="text-brand-charcoal leading-relaxed mb-8 whitespace-pre-line">{product.seoDescription || product.description}</p>
            
            <div className="space-y-6 mb-8">
              {/* ... Buttons ... */}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-brand-charcoal mb-3">Характеристики</h3>
              <ul className="list-disc list-inside text-brand-charcoal space-y-2 leading-relaxed">
                {details.dimensions && <li><strong>Размеры:</strong> {details.dimensions}</li>}
                {details.material && <li><strong>Материал:</strong> {details.material}</li>}
                {details.care && <li><strong>Уход:</strong> {details.care}</li>}
              </ul>
            </div>
          </div>
        </div>
        <Reviews reviews={currentReviews} onAddReview={handleAddReview} />
      </div>

      {isZoomModalOpen && (
        <ImageZoomModal 
          imageUrl={product.imageUrls[currentImageIndex]} 
          onClose={() => setIsZoomModalOpen(false)} 
        />
      )}
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
