
import React, { useState, memo, useCallback } from 'react';
import type { Product } from '../types';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import Image from 'next/image';
import { useSwipe } from '../hooks/useSwipe';
import { cn } from '../utils';
import { CubeTransparentIcon } from './Icons';

interface ProductCardProps {
  product: Product;
  onProductSelect: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
  onImageClick?: (product: Product, index: number) => void;
}

// LABEL GUIDE: Карточка = объект, а не товар. Нет цен, нет кнопок. "Хочу посмотреть поближе".
export const ProductCard: React.FC<ProductCardProps> = memo(({ product, onProductSelect }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const hasImages = Array.isArray(product.imageUrls) && product.imageUrls.length > 0;
  const displayImage = hasImages ? product.imageUrls[currentImageIndex] : '/placeholder.svg';

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
        onProductSelect(product.id);
    }
  };

  return (
    <div 
      className="group cursor-pointer flex flex-col gap-3 animate-fade-in"
      onClick={handleCardClick}
      {...swipeHandlers}
    >
      {/* Изображение - чистое, скругленное, "дышащее" */}
      <div className="relative w-full aspect-[4/5] bg-white rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <Image 
          src={displayImage} 
          alt={product.name || 'Objekt'} 
          className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Индикатор AR - только иконка, без текста, как подсказка */}
        {product.model3dUrl && (
            <div className="absolute top-3 right-3 text-soft-black/50 bg-white/80 backdrop-blur rounded-full p-2">
                <CubeTransparentIcon className="w-5 h-5" />
            </div>
        )}

        {/* Индикаторы слайдера - появляются только при ховере/взаимодействии */}
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

      {/* Информация - минимум шума */}
      <div className="px-1">
        <h3 className="text-[15px] font-medium text-soft-black leading-tight mb-1 group-hover:opacity-70 transition-opacity">
            {product.name}
        </h3>
        <p className="text-[13px] text-muted-gray leading-tight">
            {product.category}
        </p>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
