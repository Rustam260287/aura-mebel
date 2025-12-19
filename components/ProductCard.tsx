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
import { cn } from '../utils';

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

  // Helper to extract dimensions from specs or description if specs missing
  const getProductSpecs = () => {
     if (product.specs && Object.keys(product.specs).length > 0) {
        return (
            <div className="flex flex-wrap gap-2 mb-3 text-[10px] text-gray-500 tracking-wide uppercase">
                {product.specs.width && <span className="bg-gray-50 px-1.5 py-0.5 rounded">Ш: {product.specs.width}</span>}
                {product.specs.depth && <span className="bg-gray-50 px-1.5 py-0.5 rounded">Г: {product.specs.depth}</span>}
                {product.specs.height && <span className="bg-gray-50 px-1.5 py-0.5 rounded">В: {product.specs.height}</span>}
            </div>
        );
     }
     return null;
  };

  return (
    <div 
      className="group relative bg-white rounded-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 flex flex-col h-full border border-gray-100/50"
      onClick={handleCardClick}
      {...swipeHandlers}
    >
      {discount > 0 && (
        <div className="absolute top-0 left-0 z-20 bg-brand-terracotta text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
            -{discount}%
        </div>
      )}
      
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300 ease-out">
        <button
          onClick={handleShareClick}
          className="p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md text-brand-charcoal/60 hover:text-brand-terracotta transition-all"
          title="Поделиться"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
        </button>
        {onVirtualStage && (
          <button
            onClick={handleVirtualStageClick}
            className="p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md text-brand-charcoal/60 hover:text-brand-terracotta transition-all delay-75"
            title="Примерить (AR)"
          >
            <CubeTransparentIcon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all delay-100",
            isAnimatingHeart && "scale-110"
          )}
        >
          <HeartIcon className={cn(
              "w-4 h-4 transition-colors",
              isWished ? 'text-brand-terracotta fill-brand-terracotta' : 'text-brand-charcoal/60 hover:text-brand-terracotta'
          )} />
        </button>
      </div>

      <div 
        className="relative w-full aspect-[4/5] bg-[#F9F9F9] overflow-hidden isolate"
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
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {product.imageUrls.map((_, index) => (
                    <button
                        key={index}
                        data-swipe-indicator="true"
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors backdrop-blur-sm",
                             index === currentImageIndex ? 'bg-white shadow-sm' : 'bg-white/40'
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                        }}
                    />
                ))}
            </div>
        )}
        
        {onQuickView && (
           <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:flex justify-center bg-gradient-to-t from-black/20 to-transparent pt-12 z-10">
            <Button 
              variant="primary" 
              className="w-full bg-white/95 backdrop-blur-sm text-brand-charcoal hover:bg-white hover:text-brand-brown border-none shadow-lg text-xs font-semibold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 h-10" 
              onClick={handleQuickViewClick}
            >
              Быстрый просмотр
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow bg-white">
        <div className="mb-1 flex justify-between items-start gap-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium line-clamp-1">{product.category}</p>
             {product.rating > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                    <StarRating rating={product.rating} size="sm" showCount={false} />
                </div>
            )}
        </div>

        <h3 className="text-sm font-medium text-brand-charcoal line-clamp-2 leading-relaxed group-hover:text-brand-terracotta transition-colors mb-2 min-h-[2.5rem]" title={product.name}>
            {product.name}
        </h3>

        {/* Specs rendering */}
        <div className="mt-auto">
             {getProductSpecs()}
        </div>

        <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-2">
            <div className="flex flex-col">
                {typeof product.originalPrice === 'number' && (
                    <span className="text-[10px] text-gray-400 line-through mb-px decoration-gray-300">
                        {product.originalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                )}
                <span className="text-base font-medium text-brand-charcoal">
                    {typeof product.price === 'number' && !Number.isNaN(product.price)
                        ? `${product.price.toLocaleString('ru-RU')} ₽`
                        : 'По запросу'}
                </span>
            </div>
            
            {/* Можно добавить кнопку добавления в корзину здесь, но она может загромождать интерфейс */}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
