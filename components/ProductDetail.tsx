import React, { useState, TouchEvent, memo, useCallback, useMemo } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, CubeTransparentIcon, PaintBrushIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, SlidersHorizontalIcon, PinterestIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useSwipe } from '../hooks/useSwipe';
import { ImageZoomModal } from './ImageZoomModal';
import Image from 'next/image';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onConfigure?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
  onUpholsteryChange?: (product: Product) => void;
}

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack, onConfigure, onVirtualStage, onUpholsteryChange }) => {
  const [currentReviews, setCurrentReviews] = useState<Review[]>(product.reviews);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const pageSwipeHandlers = useSwipe({ onSwipeRight: onBack });
  
  const isWished = isInWishlist(product.id);
  
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
          {/* Image Gallery */}
          <div className="relative group" {...gallerySwipeHandlers}>
            <div className="relative overflow-hidden rounded-lg shadow-md cursor-zoom-in">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                onClick={() => setIsZoomModalOpen(true)}
              >
                {product.imageUrls.map((url, index) => (
                  <Image 
                    key={index}
                    src={url} 
                    alt={`${product.name} - изображение ${index + 1}`} 
                    className="w-full h-auto object-cover aspect-square flex-shrink-0"
                    width={500}
                    height={500}
                  />
                ))}
              </div>
            </div>

            {product.imageUrls.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/60 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                  aria-label="Предыдущее изображение"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-brand-charcoal" />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/60 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                  aria-label="Следующее изображение"
                >
                  <ChevronRightIcon className="w-6 h-6 text-brand-charcoal" />
                </button>
              </>
            )}

            {product.imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {product.imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${index === currentImageIndex ? 'bg-brand-brown' : 'bg-white/70 hover:bg-white'}`}
                    aria-label={`Перейти к изображению ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-serif text-brand-brown mb-4">{product.name}</h1>
            <div className="flex items-center mb-4">
              <StarRating rating={product.rating} />
              <span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span>
            </div>
            <p className="text-3xl font-serif text-brand-charcoal mb-6">{product.price.toLocaleString('ru-RU')} ₽</p>
            <p className="text-brand-charcoal leading-relaxed mb-8">{product.seoDescription || product.description}</p>
            
            <div className="space-y-6 mb-8">
              {product.isConfigurable ? (
                  <div className="bg-brand-cream-dark p-6 rounded-lg text-center border-2 border-dashed border-brand-brown/30">
                      <h3 className="text-xl font-semibold text-brand-charcoal mb-2">Это настраиваемый товар!</h3>
                      <Button 
                          size="lg" 
                          onClick={() => onConfigure?.(product)} 
                          className="w-full animate-pulse"
                      >
                          <SlidersHorizontalIcon className="w-6 h-6 mr-3" />
                          Перейти в конфигуратор
                      </Button>
                      <p className="text-sm text-brand-charcoal/70 mt-3">Настройте цвет, материал и другие детали, чтобы создать мебель своей мечты.</p>
                  </div>
              ) : (
                  <div className="flex items-center gap-4">
                      <Button size="lg" onClick={handleAddToCart} className="flex-grow">
                          Добавить в корзину
                      </Button>
                      <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4">
                          <HeartIcon className={`w-6 h-6 ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : ''}`} />
                      </Button>
                  </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4 border-t border-brand-cream-dark">
                  {onVirtualStage && (
                      <Button variant="ghost" onClick={() => onVirtualStage(product)}>
                          <CubeTransparentIcon className="w-5 h-5 mr-2" />
                          Примерить в интерьере
                      </Button>
                  )}
                  {product.isConfigurable && onUpholsteryChange && (
                      <Button variant="ghost" onClick={() => onUpholsteryChange(product)}>
                          <PaintBrushIcon className="w-5 h-5 mr-2" />
                          Изменить обивку с ИИ
                      </Button>
                  )}
                  <Button variant="ghost" onClick={handlePinterestShare}>
                        <PinterestIcon className="w-5 h-5 mr-2" />
                        Сохранить в Pinterest
                  </Button>
                  {product.isConfigurable && (
                      <Button variant="ghost" onClick={handleWishlistClick}>
                          <HeartIcon className={`w-5 h-5 mr-2 ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : ''}`} />
                          {isWished ? 'В избранном' : 'В избранное'}
                      </Button>
                  )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-brand-charcoal mb-3">Характеристики</h3>
              <ul className="list-disc list-inside text-brand-charcoal space-y-2 leading-relaxed">
                <li><strong>Размеры:</strong> {product.details.dimensions}</li>
                <li><strong>Материал:</strong> {product.details.material}</li>
                <li><strong>Уход:</strong> {product.details.care}</li>
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