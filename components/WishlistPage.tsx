
import React, { memo } from 'react';
import type { Product, View } from '../types';
import { Gallery } from './Gallery';
import { Button } from './Button';
import { HeartIcon } from './icons';

interface WishlistPageProps {
  products: Product[];
  isLoading: boolean;
  onNavigate: (view: View) => void;
  // Legacy props compatibility
  onQuickView?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
}

const WishlistPageComponent: React.FC<WishlistPageProps> = ({ products, isLoading, onNavigate }) => {
  const hasItems = products && products.length > 0;

  return (
    <div className="bg-warm-white min-h-[70vh] py-12 md:py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-12 tracking-tight">Ваша подборка</h1>

        {hasItems ? (
          <Gallery 
            products={products}
            isLoading={isLoading}
            onProductSelect={(id) => onNavigate({ page: 'product', productId: id })}
          />
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft">
                 <HeartIcon className="w-8 h-8 text-stone-beige stroke-1" />
              </div>
              <h2 className="text-xl font-medium text-soft-black mb-3">Здесь пока пусто</h2>
              <p className="text-muted-gray mb-8 max-w-sm font-light leading-relaxed">
                Сохраняйте понравившиеся объекты, чтобы вернуться к ним позже.
                Это ваше личное пространство для вдохновения.
              </p>
              <Button 
                onClick={() => onNavigate({ page: 'catalog' })}
                className="bg-soft-black text-white px-8 rounded-xl h-12 text-sm font-medium hover:opacity-90 shadow-soft"
              >
                Перейти в галерею
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export const WishlistPage = memo(WishlistPageComponent);
