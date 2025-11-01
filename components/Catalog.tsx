import React, { useState, useMemo, useEffect } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { FilterSidebar } from './FilterSidebar';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { Button } from './Button';
import { SlidersHorizontalIcon } from './Icons';
import { generateSeoCategoryDescription } from '../services/geminiService';
import { Skeleton } from './Skeleton';

interface CatalogProps {
  products: Product[];
  onProductSelect: (productId: number) => void;
  onQuickView: (product: Product) => void;
  onVirtualStage: (product: Product) => void;
  onOpenAiConsultant: (initialPrompt?: string) => void;
  category?: string;
  searchTerm?: string;
}

type SortOption = 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'discount_desc';

export const Catalog: React.FC<CatalogProps> = ({ products, onProductSelect, onQuickView, onVirtualStage, onOpenAiConsultant, category, searchTerm }) => {
  const allCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(category ? [category] : []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortOption, setSortOption] = useState<SortOption>('rating_desc');
  const [isLoading, setIsLoading] = useState(true);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categoryDescription, setCategoryDescription] = useState<string | null>(null);
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (category) {
      setSelectedCategories([category]);
    } else if (!searchTerm) {
       // Reset categories if we navigate to the general catalog page
       setSelectedCategories([]);
    }
  }, [category, searchTerm]);

  useEffect(() => {
    // Этот эффект отвечает за генерацию AI-описания
    if (category && !searchTerm) {
      const fetchDescription = async () => {
        setIsDescriptionLoading(true);
        setCategoryDescription(null);
        try {
          const productsInCategory = products.filter(p => p.category === category);
          if (productsInCategory.length > 0) {
            const description = await generateSeoCategoryDescription(category, productsInCategory);
            setCategoryDescription(description);
          }
        } catch (error) {
          console.error("Failed to fetch category description:", error);
        } finally {
          setIsDescriptionLoading(false);
        }
      };
      fetchDescription();
    } else {
      setCategoryDescription(null);
    }
  }, [category, products, searchTerm]);


  useEffect(() => {
    setIsLoading(true);

    const filterTimer = setTimeout(() => {
        let filtered = products;

        if (searchTerm) {
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedCategories.length > 0) {
          filtered = filtered.filter(p => selectedCategories.includes(p.category));
        }
        
        filtered = filtered.filter(p => p.price <= priceRange[1] && p.price >= priceRange[0]);

        const sorted = [...filtered].sort((a, b) => {
          switch (sortOption) {
            case 'price_asc':
              return a.price - b.price;
            case 'price_desc':
              return b.price - a.price;
            case 'name_asc':
              return a.name.localeCompare(b.name);
            case 'discount_desc': {
              const discountA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
              const discountB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
              return discountB - discountA;
            }
            case 'rating_desc':
            default:
              return b.rating - a.rating;
          }
        });
      setDisplayedProducts(sorted);
      setIsLoading(false);
    }, 500); // Debounce/simulate loading

    return () => clearTimeout(filterTimer);

  }, [products, searchTerm, selectedCategories, priceRange, sortOption]);
  
  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 100000]);
    setSortOption('rating_desc');
  };

  const handleAiPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPrompt.trim()) {
      onOpenAiConsultant(aiPrompt);
      setAiPrompt('');
    }
  };

  const pageTitle = category ? category : (searchTerm ? `Результаты поиска: "${searchTerm}"` : 'Каталог');

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-brand-brown">{pageTitle}</h1>
        {isDescriptionLoading && (
          <div className="max-w-3xl mx-auto mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        )}
        {categoryDescription && (
            <p className="max-w-3xl mx-auto mt-4 text-brand-charcoal leading-relaxed animate-subtle-fade-in">
                {categoryDescription}
            </p>
        )}
      </div>

      {/* AI Assistant Prompt Section */}
      {!searchTerm && !category && (
        <div className="mb-10 max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg animate-subtle-fade-in">
          <h3 className="text-xl font-semibold text-brand-charcoal mb-2 text-center">Не можете выбрать?</h3>
          <p className="text-center text-gray-600 mb-4">Опишите интерьер своей мечты, и наш ИИ-помощник подберет для вас идеальную мебель.</p>
          <form onSubmit={handleAiPromptSubmit}>
            <div className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Например, светлая гостиная в стиле лофт..."
                className="w-full pl-5 pr-32 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-brown text-base"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <Button type="submit" size="md">
                    Найти
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Mobile Filter Trigger */}
      <div className="mb-6 md:hidden">
        <Button variant="outline" className="w-full flex justify-center" onClick={() => setIsFilterOpen(true)}>
          <SlidersHorizontalIcon className="w-5 h-5 mr-2" />
          Фильтры и сортировка
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4 lg:w-1/5">
          <FilterSidebar
            allCategories={allCategories}
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onReset={resetFilters}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />
        </aside>
        <main className="md:w-3/4 lg:w-4/5">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProducts.map((product, index) => (
                <div key={product.id} className="animate-subtle-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard
                        product={product}
                        onProductSelect={onProductSelect}
                        onQuickView={onQuickView}
                        onVirtualStage={onVirtualStage}
                    />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg shadow-md animate-subtle-fade-in">
              <h2 className="text-2xl font-semibold text-brand-charcoal">Товары не найдены</h2>
              <p className="text-gray-600 mt-2">Попробуйте изменить фильтры или поисковый запрос.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};