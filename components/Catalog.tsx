import React, { useState, useMemo, useEffect, memo } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { FilterSidebar } from './FilterSidebar';
import { Button } from './Button';
import { SlidersHorizontalIcon } from './Icons';
import { CategoryPills } from './CategoryPills';

type SortOption = 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'discount_desc';

interface CatalogProps {
  allProducts: Product[];
  isLoading: boolean;
  onProductSelect: (productId: string) => void;
  onQuickView: (product: Product) => void;
  onVirtualStage: (product: Product) => void;
  initialSearchTerm?: string;
  initialCategory?: string;
  isHomePage?: boolean;
}

const CatalogComponent: React.FC<CatalogProps> = ({
  allProducts,
  isLoading,
  onProductSelect,
  onQuickView,
  onVirtualStage,
  initialSearchTerm = '',
  initialCategory,
  isHomePage = false
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortOption, setSortOption] = useState<SortOption>('rating_desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setSelectedCategories(initialCategory ? [initialCategory] : []);
  }, [initialCategory]);
  
  const maxPrice = useMemo(() => Math.max(...allProducts.map(p => p.price), 100000), [allProducts]);
  
  useEffect(() => {
      setPriceRange([0, maxPrice]);
  }, [maxPrice]);


  const allCategories = useMemo(() => {
    const categories = new Set(allProducts.map(p => p.category));
    return Array.from(categories).sort();
  }, [allProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let products = allProducts;

    // Filter by search term
    if (searchTerm) {
      products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by category
    if (selectedCategories.length > 0) {
      products = products.filter(p => selectedCategories.includes(p.category));
    }
    
    // Filter by price
    products = products.filter(p => p.price <= priceRange[1]);

    // Sort
    products.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'discount_desc':
            const discountA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
            const discountB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
            return discountB - discountA;
        case 'rating_desc':
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    return products;
  }, [allProducts, searchTerm, selectedCategories, priceRange, sortOption]);
  
  const handleResetFilters = () => {
      setSearchTerm('');
      setSelectedCategories([]);
      setPriceRange([0, maxPrice]);
      setSortOption('rating_desc');
  };

  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />);

  if (isHomePage) {
    return (
        <div className="container mx-auto px-6">
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

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-brand-brown mb-3">Каталог</h1>
        <p className="text-lg text-brand-charcoal">Найдите идеальную мебель для вашего дома.</p>
      </div>

      <CategoryPills
        categories={allCategories}
        selectedCategories={selectedCategories}
        onCategorySelect={(category) => {
          setSelectedCategories(category ? [category] : []);
        }}
      />
      
      {/* ... (UI фильтров без изменений) */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <FilterSidebar 
            allCategories={allCategories}
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            priceRange={priceRange}
            maxPrice={maxPrice}
            onPriceChange={setPriceRange}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onReset={handleResetFilters}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />
        </div>
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {renderSkeletons(9)}
            </div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedProducts.map(product => (
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
                <p className="text-gray-500 mt-2">Попробуйте изменить фильтры или сбросить их.</p>
                <Button className="mt-6" onClick={handleResetFilters}>Сбросить фильтры</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Catalog = memo(CatalogComponent);
