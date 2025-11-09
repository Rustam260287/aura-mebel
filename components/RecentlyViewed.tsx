import React, { memo } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

interface RecentlyViewedProps {
  products: Product[];
  onProductSelect: (productId: string) => void;
  onVirtualStage: (product: Product) => void;
}

const RecentlyViewedComponent: React.FC<RecentlyViewedProps> = ({ products, onProductSelect, onVirtualStage }) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-24">
      <h2 className="text-3xl font-serif text-brand-charcoal mb-8 text-center">Вы недавно смотрели</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onProductSelect={onProductSelect} 
            onVirtualStage={onVirtualStage}
          />
        ))}
      </div>
    </div>
  );
};

export const RecentlyViewed = memo(RecentlyViewedComponent);