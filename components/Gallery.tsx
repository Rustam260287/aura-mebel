
import React, { memo } from 'react';
import type { Product } from '../types';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import Image from 'next/image';
import { CubeTransparentIcon } from './icons';

interface GalleryProps {
  products: Product[];
  isLoading: boolean;
  onProductSelect: (productId: string) => void;
}

// LABEL GUIDE: Галерея избранных моделей.
// Карточка = объект. 
// Нет цен, нет скидок, нет кнопок "Купить". 
// Только фото, название, тип, иконки 3D/AR.

const GalleryComponent: React.FC<GalleryProps> = ({ products, isLoading, onProductSelect }) => {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
      {products.map((product, index) => (
        <div 
            key={product.id} 
            className="group cursor-pointer flex flex-col gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onProductSelect(product.id)}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                <Image 
                    src={product.imageUrls?.[0] || '/placeholder.svg'} 
                    alt={product.name}
                    className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                {/* 3D/AR Indicator - Quiet hint */}
                {product.model3dUrl && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 text-soft-black/60 shadow-sm">
                        <CubeTransparentIcon className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Info - Minimal */}
            <div className="px-1">
                <h3 className="text-[15px] font-medium text-soft-black leading-tight mb-1 group-hover:opacity-70 transition-opacity">
                    {product.name}
                </h3>
                <p className="text-[13px] text-muted-gray leading-tight">
                    {product.category || 'Объект интерьера'}
                </p>
            </div>
        </div>
      ))}
    </div>
  );
};

export const Gallery = memo(GalleryComponent);
