
import React, { useState, memo, useCallback, useEffect } from 'react';
import type { Product } from '../types';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import Image from 'next/image';
import { useSwipe } from '../hooks/useSwipe';
import { cn } from '../utils';
import { CubeTransparentIcon, HeartIcon } from './icons';

interface ProductCardProps {
  product: Product;
  onProductSelect: (productId: string) => void;
  onQuickView?: (product: Product) => void; // Legacy
  onVirtualStage?: (product: Product) => void; // Legacy
  onImageClick?: (product: Product, index: number) => void; // Legacy
}

// LABEL GUIDE: Карточка = объект. 
// Wishlist: Тихий спутник. 
// Маркер состояния: "Просмотрено" (очень тихо).
export const ProductCard: React.FC<ProductCardProps> = memo(({ product, onProductSelect }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const triggerHaptic = useHaptic();
  
  const isWished = isInWishlist(product.id);
  const hasImages = Array.isArray(product.imageUrls) && product.imageUrls.length > 0;
  const displayImage = hasImages ? product.imageUrls[currentImageIndex] : '/placeholder.svg';

  // Check if viewed
  useEffect(() => {
    try {
        const viewed = JSON.parse(localStorage.getItem('label_viewed_products') || '[]');
        if (viewed.includes(product.id)) {
            setIsViewed(true);
        }
    } catch (e) {
        // ignore storage errors
    }
  }, [product.id]);

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
  
  const handleCardClick = () => {
    if (!isSwiping) {
        // Save to viewed history
        try {
            const viewed = JSON.parse(localStorage.getItem('label_viewed_products') || '[]');
            if (!viewed.includes(product.id)) {
                localStorage.setItem('label_viewed_products', JSON.stringify([...viewed, product.id]));
            }
        } catch (e) {}

        onProductSelect(product.id);
    }
  };

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      triggerHaptic(10);
      setIsHeartAnimating(true);
      
      if (isWished) {
          removeFromWishlist(product.id);
      } else {
          addToWishlist(product.id);
      }
      
      setTimeout(() => setIsHeartAnimating(false), 200);
  }, [isWished, product.id, removeFromWishlist, addToWishlist, triggerHaptic]);

  return (
    <div 
      className="group cursor-pointer flex flex-col gap-3 animate-fade-in relative"
      onClick={handleCardClick}
      {...swipeHandlers}
    >
      {/* Изображение */}
      <div className="relative w-full aspect-[4/5] bg-white rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <Image 
          src={displayImage} 
          alt={product.name || 'Objekt'} 
          className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Wishlist Icon */}
        <button
            onClick={handleWishlistToggle}
            className={cn(
                "absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10",
                "text-soft-black hover:text-brand-terracotta",
                isWished ? "opacity-100" : "opacity-60 lg:opacity-0 lg:group-hover:opacity-100", 
                isHeartAnimating ? "scale-110" : "scale-100"
            )}
        >
             <HeartIcon 
                className={cn(
                    "w-6 h-6 transition-colors duration-300",
                    isWished ? "fill-brand-terracotta text-brand-terracotta" : "text-white drop-shadow-sm"
                )} 
                strokeWidth={1.5}
             />
        </button>

        {/* Индикатор AR */}
        {product.model3dUrl && (
            <div className="absolute bottom-3 right-3 text-soft-black/70 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm pointer-events-none">
                <CubeTransparentIcon className="w-4 h-4" />
            </div>
        )}

        {/* Индикаторы слайдера */}
        {hasImages && product.imageUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {product.imageUrls.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "w-1 h-1 rounded-full transition-colors",
                             index === currentImageIndex ? 'bg-soft-black' : 'bg-soft-black/20'
                        )}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Информация */}
      <div className="px-1 flex flex-col gap-0.5">
        <h3 className="text-[15px] font-medium text-soft-black leading-tight group-hover:opacity-70 transition-opacity">
            {product.name}
        </h3>
        <div className="flex items-center gap-2">
            <p className="text-[13px] text-muted-gray leading-tight">
                {product.category}
            </p>
            {/* Микро-маркер состояния */}
            {isViewed && (
                <span className="text-[10px] text-stone-beige font-medium tracking-wide opacity-80">
                    • Просмотрено
                </span>
            )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
