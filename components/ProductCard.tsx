import React, { useState, memo, useCallback, useEffect } from 'react';
import type { Product } from '../types';
import { useWishlist } from '../contexts/WishlistContext';
import { useHaptic } from '../hooks/useHaptic';
import Image from 'next/image';
import { cn } from '../utils';
import { CubeTransparentIcon, HeartIcon } from './icons';

interface ProductCardProps {
  product: Product;
  onProductSelect: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
  onImageClick?: (product: Product, index: number) => void;
}

// LABEL CANON:
// Card = object
// Action = AR
// Wishlist = quiet companion
export const ProductCard: React.FC<ProductCardProps> = memo(
  ({ product, onProductSelect }) => {
    const [isHeartAnimating, setIsHeartAnimating] = useState(false);
    const [isViewed, setIsViewed] = useState(false);

    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const triggerHaptic = useHaptic();

    const isWished = isInWishlist(product.id);
    const displayImage =
      // @ts-ignore
      product.imageUrl || product.imageUrls?.[0] || '/placeholder.svg';

    // Viewed marker
    useEffect(() => {
      try {
        const viewed = JSON.parse(
          localStorage.getItem('label_viewed_products') || '[]'
        );
        if (viewed.includes(product.id)) {
          setIsViewed(true);
        }
      } catch {}
    }, [product.id]);

    const handleCardClick = () => {
      try {
        const viewed = JSON.parse(
          localStorage.getItem('label_viewed_products') || '[]'
        );
        if (!viewed.includes(product.id)) {
          localStorage.setItem(
            'label_viewed_products',
            JSON.stringify([...viewed, product.id])
          );
        }
      } catch {}

      onProductSelect(product.id);
    };

    const handleWishlistToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic(10);
        setIsHeartAnimating(true);

        if (isWished) {
          removeFromWishlist(product.id);
        } else {
          addToWishlist(product.id);
        }

        setTimeout(() => setIsHeartAnimating(false), 200);
      },
      [isWished, product.id, removeFromWishlist, addToWishlist, triggerHaptic]
    );

    return (
      <div
        className="group cursor-pointer flex flex-col gap-3 animate-fade-in"
        onClick={handleCardClick}
      >
        {/* Preview */}
        <div className="relative w-full aspect-[4/5] bg-white rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.015]">
          <Image
            src={displayImage}
            alt={product.name || 'Object'}
            className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10',
              'text-soft-black hover:text-brand-terracotta',
              isWished
                ? 'opacity-100'
                : 'opacity-50 lg:opacity-0 lg:group-hover:opacity-100',
              isHeartAnimating ? 'scale-110' : 'scale-100'
            )}
          >
            <HeartIcon
              className={cn(
                'w-6 h-6 transition-colors duration-300',
                isWished
                  ? 'fill-brand-terracotta text-brand-terracotta'
                  : 'text-white drop-shadow-sm'
              )}
              strokeWidth={1.5}
            />
          </button>

          {/* AR indicator */}
          {product.model3dUrl && (
            <div className="absolute bottom-3 right-3 text-soft-black/50 bg-white/80 backdrop-blur rounded-full p-1.5 shadow-sm pointer-events-none">
              <CubeTransparentIcon className="w-4 h-4" />
            </div>
          )}

          {isViewed && (
            <div className="absolute top-3 left-3 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] bg-white/70 rounded-full text-muted-gray">
              Уже смотрели
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-gray">
            <span>{product.category || 'Объект интерьера'}</span>
          </div>

          <h3 className="text-lg font-semibold text-soft-black leading-tight">
            {product.name}
          </h3>
        </div>
      </div>
    );
  }
);
