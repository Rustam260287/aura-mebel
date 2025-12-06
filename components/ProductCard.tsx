
import React, { useState, memo, useCallback } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { HeartIcon, CubeTransparentIcon, ArrowUpTrayIcon } from './Icons';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import Image from 'next/image';
import { useSwipe } from '../hooks/useSwipe';

interface ProductCardProps {
  product: Product;
  onProductSelect: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
  onImageClick?: (product: Product, index: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({ product, onProductSelect, onQuickView, onVirtualStage, onImageClick }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  const triggerHaptic = useHaptic();
  const [isAnimatingHeart, setIsAnimatingHeart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isWished = isInWishlist(product.id);

  const hasPrice = typeof product.price === 'number' && !Number.isNaN(product.price);
  const hasOriginalPrice = typeof product.originalPrice === 'number' && !Number.isNaN(product.originalPrice);
  const hasImages = Array.isArray(product.imageUrls) && product.imageUrls.length > 0;
  const discount = hasPrice && hasOriginalPrice
    ? Math.round(((product.originalPrice as number) - (product.price as number)) / (product.originalPrice as number) * 100)
    : 0;
  
  const handleSwipeLeft = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === (product.imageUrls?.length ?? 1) - 1 ? 0 : prevIndex + 1
    );
  }, [product.imageUrls]);

  const handleSwipeRight = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? (product.imageUrls?.length ?? 1) - 1 : prevIndex - 1
    );
  }, [product.imageUrls]);

  const { isSwiping, ...swipeHandlers } = useSwipe({ onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight });
  
  const displayImage = hasImages ? product.imageUrls[currentImageIndex] : '/placeholder.svg';


  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    if (isWished) {
      removeFromWishlist(product.id);
      addToast(`${product.name} удален из избранного`, 'info');
    } else {
      addToWishlist(product.id);
      addToast(`${product.name} добавлен в избранное`, 'success');
      setIsAnimatingHeart(true);
      setTimeout(() => setIsAnimatingHeart(false), 400);
    }
  }, [isWished, product.id, product.name, removeFromWishlist, addToWishlist, addToast, triggerHaptic]);

  const handleQuickViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView?.(product);
  }, [onQuickView, product]);
  
  const handleVirtualStageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onVirtualStage?.(product);
  }, [onVirtualStage, product]);

  const handleShareClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(10);
    
    const productUrl = `${window.location.origin}/products/${product.id}`;

    const shareData = {
        title: product.name,
        text: `Посмотрите этот товар в Labelcom Мебель: ${product.name}`,
        url: productUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch {
            console.log('Share was cancelled or failed');
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareData.url);
            addToast('Ссылка на товар скопирована!', 'info');
        } catch {
            addToast('Не удалось скопировать ссылку.', 'error');
        }
    }
  }, [product.name, product.id, addToast, triggerHaptic]);
  
  const handleCardClick = () => {
    if (!isSwiping) {
        onProductSelect(product.id);
    }
  };


  return (
    <div 
      className="group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-premium-hover border border-transparent hover:border-brand-brown/5 hover:z-10 transform-gpu"
      onClick={handleCardClick}
      {...swipeHandlers}
    >
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-20 bg-brand-terracotta text-white text-xs font-medium tracking-wide px-3 py-1 rounded-full shadow-sm">
            -{discount}%
        </div>
      )}
      
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:translate-x-4 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300 ease-out">
        <button
          onClick={handleShareClick}
          className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:shadow-md hover:bg-white text-brand-charcoal/70 hover:text-brand-brown transition-all"
          title="Поделиться"
        >
          <ArrowUpTrayIcon className="w-5 h-5" />
        </button>
        {onVirtualStage && (
          <button
            onClick={handleVirtualStageClick}
            className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:shadow-md hover:bg-white text-brand-charcoal/70 hover:text-brand-brown transition-all delay-75"
            title="Примерить (AR)"
          >
            <CubeTransparentIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleWishlistToggle}
          className={`p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:shadow-md hover:bg-white transition-all delay-100 ${isAnimatingHeart ? 'scale-125' : ''}`}
        >
          <HeartIcon className={`w-5 h-5 transition-colors ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : 'text-brand-charcoal/70 hover:text-brand-terracotta'}`} />
        </button>
      </div>

      <div 
        className="relative w-full aspect-[4/5] bg-[#F5F5F5] overflow-hidden isolate"
        {...swipeHandlers}
        >
        <Image 
          src={displayImage} 
          alt={product.name || 'Товар'} 
          className="object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-105"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {hasImages && product.imageUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {product.imageUrls.map((_, index) => (
                    <button
                        key={index}
                        data-swipe-indicator="true"
                        className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                        }}
                    />
                ))}
            </div>
        )}
        
        {onQuickView && (
           <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex justify-center bg-gradient-to-t from-black/50 to-transparent pt-16 z-10">
            <Button 
              variant="primary" 
              className="bg-brand-brown text-white hover:bg-brand-brown/90 border-none shadow-lg px-6 py-2.5 text-sm font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-full" 
              onClick={handleQuickViewClick}
            >
              Быстрый просмотр
            </Button>
          </div>
        )}
      </div>

      <div className="p-5 relative z-20 bg-white">
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-base font-medium text-brand-charcoal line-clamp-2 leading-snug group-hover:text-brand-brown transition-colors" title={product.name}>
                {product.name}
            </h3>
        </div>
        
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{product.category}</p>
        <div className="flex justify-between items-end border-t border-gray-50 pt-3 mt-1">
          <div className="flex flex-col">
             {typeof product.originalPrice === 'number' && (
              <span className="text-xs text-gray-400 line-through mb-0.5">
                {product.originalPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
            <span className="text-lg font-serif text-brand-brown font-medium">
              {typeof product.price === 'number' && !Number.isNaN(product.price)
                ? `${product.price.toLocaleString('ru-RU')} ₽`
                : 'Цена по запросу'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 mb-1">
            <StarRating rating={product.rating} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
