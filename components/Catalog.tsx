
import React, { useState, useMemo, memo } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { FilterSidebar } from './FilterSidebar';
import { Button } from './Button';
import { CategoryPills } from './CategoryPills';

// В режиме SSR пагинации сортировка и фильтрация должны быть на сервере,
// поэтому здесь оставляем только отображение.
// Для упрощения, пока что убрали всю логику фильтрации.

interface CatalogProps {
  allProducts: Product[];
  isLoading: boolean;
  onProductSelect: (productId: string) => void;
  onQuickView: (product: Product) => void;
  onVirtualStage: (product: Product) => void;
  isHomePage?: boolean;
}

const CatalogComponent: React.FC<CatalogProps> = ({
  allProducts,
  isLoading,
  onProductSelect,
  onQuickView,
  onVirtualStage,
  isHomePage = false
}) => {
  
  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />);

  if (isHomePage) {
    return (
        <div className="container mx-auto px-6 py-12">
          <h2 className="text-4xl font-serif text-brand-charcoal mb-8 text-center">Популярные товары</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {isLoading 
              ? renderSkeletons(4) 
              : allProducts.map(product => (
                  <ProductCard key={product.id} product={product} onProductSelect={onProductSelect} onQuickView={onQuickView} onVirtualStage={onVirtualStage} />
                ))}
          </div>
        </div>
    );
  }

  // Каталог теперь просто отображает товары, которые ему передали
  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderSkeletons(12)}
        </div>
      ) : allProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {allProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onProductSelect={onProductSelect} 
              onQuickView={onQuickView}
              onVirtualStage={onVirtualStage}
            />
          ))}
        </div>
      ) : (
         <div className="text-center py-16 text-brand-charcoal col-span-full">
            <p className="text-xl">Товары не найдены</p>
            <p className="text-gray-500 mt-2">Попробуйте вернуться на главную страницу.</p>
        </div>
      )}
    </div>
  );
};

export const Catalog = memo(CatalogComponent);
