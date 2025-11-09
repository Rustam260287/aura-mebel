import React, { memo } from 'react';
import { Button } from './Button';
import { XMarkIcon } from './Icons';

type SortOption = 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'discount_desc';

interface FilterSidebarProps {
  allCategories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  priceRange: [number, number];
  maxPrice: number;
  onPriceChange: (range: [number, number]) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = memo(({
  allCategories,
  selectedCategories,
  onCategoryChange,
  priceRange,
  maxPrice,
  onPriceChange,
  sortOption,
  onSortChange,
  onReset,
  isOpen,
  onClose,
}) => {

  const handleCategoryToggle = (category: string) => {
    const newSelection = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newSelection);
  };

  const FilterControls = () => (
    <>
      {/* Category Filter */}
      <div>
        <h4 className="font-semibold text-brand-charcoal mb-3">Категории</h4>
        <div className="space-y-2">
          {allCategories.map(category => (
            <label key={category} className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="h-4 w-4 rounded border-gray-300 text-brand-brown focus:ring-brand-brown"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
              <span className="ml-3 text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="my-6" />

      {/* Price Filter */}
      <div>
        <h4 className="font-semibold text-brand-charcoal mb-3">Цена до</h4>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{priceRange[0].toLocaleString()} ₽</span>
            <span className="font-medium">{priceRange[1].toLocaleString()} ₽</span>
        </div>
        <input 
            type="range"
            min="0"
            max={maxPrice}
            step="1000"
            value={priceRange[1]}
            onChange={e => onPriceChange([priceRange[0], Number(e.target.value)])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-brown"
        />
      </div>

      <hr className="my-6" />

      {/* Sort Options */}
      <div>
        <h4 className="font-semibold text-brand-charcoal mb-3">Сортировать по</h4>
        <select 
            value={sortOption} 
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown"
        >
          <option value="rating_desc">Популярности</option>
          <option value="discount_desc">По скидке</option>
          <option value="price_asc">Цене: по возрастанию</option>
          <option value="price_desc">Цене: по убыванию</option>
          <option value="name_asc">Названию: А-Я</option>
        </select>
      </div>

      <hr className="my-6" />

      <Button variant="outline" onClick={onReset} className="w-full">
        Сбросить фильтры
      </Button>
    </>
  );
  
  return (
    <>
      {/* Mobile: Off-canvas sidebar */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-heading"
      >
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className={`relative h-full w-full max-w-xs bg-brand-cream shadow-xl flex flex-col transition-transform transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <header className="flex items-center justify-between p-4 border-b border-brand-cream-dark">
            <h3 id="filter-heading" className="text-xl font-serif text-brand-brown">Фильтры</h3>
            <Button variant="ghost" onClick={onClose} className="p-2"><XMarkIcon className="w-6 h-6"/></Button>
          </header>
          <div className="overflow-y-auto p-6 flex-grow">
            <FilterControls />
          </div>
          <footer className="p-4 border-t border-brand-cream-dark bg-white">
            <Button className="w-full" onClick={onClose}>Применить</Button>
          </footer>
        </div>
      </div>

      {/* Desktop: Sticky sidebar */}
      <div className="hidden md:block sticky top-24">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-serif text-brand-brown mb-4">Фильтры</h3>
            <FilterControls />
        </div>
      </div>
    </>
  );
});
