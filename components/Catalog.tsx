
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
  onImageClick: (product: Product, index: number) => void;
  isHomePage?: boolean;
}

const CatalogComponent: React.FC<CatalogProps> = ({
  allProducts,
  isLoading,
  onProductSelect,
  onQuickView,
  onVirtualStage,
  onImageClick,
  isHomePage = false
}) => {
  
  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />);

  if (isHomePage) {
    return (
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
           <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="max-w-2xl text-center md:text-left">
                    <span className="block text-brand-terracotta text-sm font-bold uppercase tracking-widest mb-3 animate-fade-in-up">
                        Выбор покупателей
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif text-brand-charcoal leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Популярные модели
                    </h2>
                </div>
                 <div className="hidden md:block animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                     <Button 
                        variant="text"
                        onClick={() => { /* Navigate to catalog with sort=popular */ }}
                        className="group flex items-center gap-2 text-brand-charcoal font-medium hover:text-brand-terracotta transition-colors"
                     >
                        Смотреть все
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                     </Button>
                 </div>
            </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {isLoading 
              ? renderSkeletons(4) 
              : allProducts.map((product, index) => (
                  <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <ProductCard product={product} onProductSelect={onProductSelect} onQuickView={onQuickView} onVirtualStage={onVirtualStage} onImageClick={onImageClick} />
                  </div>
                ))}
          </div>

           <div className="mt-12 text-center md:hidden">
                <Button 
                    variant="outline"
                    className="w-full border-brand-charcoal/20 text-brand-charcoal"
                    onClick={() => { /* Navigate */ }}
                >
                    Смотреть все товары
                </Button>
           </div>
        </div>
    );
  }

  // Каталог теперь просто отображает товары, которые ему передали
  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-x-4 gap-y-8 md:gap-8">
          {renderSkeletons(9)}
        </div>
      ) : allProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-x-4 gap-y-8 md:gap-8">
          {allProducts.map((product, index) => (
             <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard 
                  product={product} 
                  onProductSelect={onProductSelect} 
                  onQuickView={onQuickView}
                  onVirtualStage={onVirtualStage}
                  onImageClick={onImageClick}
                />
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center py-24 text-brand-charcoal col-span-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
            <p className="text-xl font-medium text-gray-900">Товары не найдены</p>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">Попробуйте изменить параметры фильтрации или поиска.</p>
        </div>
      )}
    </div>
  );
};

export const Catalog = memo(CatalogComponent);
