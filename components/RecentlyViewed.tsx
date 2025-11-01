

import React from 'react';
// Fix: Corrected import path for ProductCard component
import { ProductCard } from './ProductCard';
// Fix: Corrected import path for Product type
import type { Product } from '../types';

interface RecentlyViewedProps {
  products: Product[];
  onProductSelect: (productId: number) => void;
  onVirtualStage: (product: Product) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ products, onProductSelect, onVirtualStage }) => {
  // Не отображаем компонент, если нет просмотренных товаров или есть только один (текущий, который уже отфильтрован)
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