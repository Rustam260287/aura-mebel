
import React, { memo, useState, useEffect, useRef } from 'react';
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
  // Local state for immediate UI feedback on slider drag
  const [localPrice, setLocalPrice] = useState(priceRange[1]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when external props change (e.g. reset or initial load)
  useEffect(() => {
    setLocalPrice(priceRange[1]);
  }, [priceRange]);

  const handleCategoryToggle = (category: string) => {
    const newSelection = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newSelection);
  };

  const handlePriceDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    setLocalPrice(newVal);

    // Debounce the actual filter trigger
    if (timerRef.current) {
        clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
        onPriceChange([priceRange[0], newVal]);
    }, 400); // 400ms delay
  };

  const FilterControls = () => (
    <>
      {/* Category Filter */}
      <div>
        <h4 className="font-semibold text-brand-charcoal mb-3">Категории</h4>
        <div className="space-y-2">
          {allCategories.map(category => (
            <label key={category} className="flex items-center cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                    type="checkbox" 
                    className="peer h-4 w-4 rounded border-gray-300 text-brand-brown focus:ring-brand-brown cursor-pointer transition-colors"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                />
              </div>
              <span className="ml-3 text-gray-700 group-hover:text-brand-brown transition-colors text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="my-6 border-gray-100" />

      {/* Price Filter */}
      <div>
        <h4 className="font-semibold text-brand-charcoal mb-3">Цена до</h4>
        <div className="flex justify-between text-sm text-gray-600 mb-2 font-mono">
            <span>{priceRange[0].toLocaleString('ru-RU')} ₽</span>
            <span className="font-bold text-brand-brown">{localPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
        <input 
            type="range"
            min="0"
            max={maxPrice}
            step="1000"
            value={localPrice}
            onChange={handlePriceDrag}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-brown hover:bg-gray-300 transition-colors"
        />
      </div>

      <hr className="my-6 border-gray-100" />

      {/* Sort Options */}
      <div>
        <h4 className="font-semibold text-brand-charcoal mb-3">Сортировать по</h4>
        <select 
            value={sortOption} 
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:border-brand-brown focus:ring-1 focus:ring-brand-brown transition-shadow cursor-pointer"
        >
          <option value="rating_desc">🔥 Популярности</option>
          <option value="discount_desc">🏷️ По скидке</option>
          <option value="price_asc">💰 Цене: по возрастанию</option>
          <option value="price_desc">💎 Цене: по убыванию</option>
          <option value="name_asc">🔤 Названию: А-Я</option>
        </select>
      </div>

      <hr className="my-6 border-gray-100" />

      <Button variant="outline" onClick={onReset} className="w-full text-sm py-2.5 border-gray-300 hover:border-brand-brown hover:text-brand-brown">
        Сбросить все фильтры
      </Button>
    </>
  );
  
  return (
    <>
      {/* Mobile: Off-canvas sidebar */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-heading"
      >
        {/* Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose} 
            aria-hidden="true" 
        />
        
        {/* Sidebar Panel */}
        <div className={`relative h-full w-4/5 max-w-xs bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <header className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 id="filter-heading" className="text-xl font-serif text-brand-brown font-bold">Фильтры</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                <XMarkIcon className="w-6 h-6"/>
            </button>
          </header>
          <div className="overflow-y-auto p-6 flex-grow scrollbar-hide">
            <FilterControls />
          </div>
          <footer className="p-5 border-t border-gray-100 bg-gray-50">
            <Button className="w-full py-3 shadow-lg shadow-brand-brown/20" onClick={onClose}>Показать результаты</Button>
          </footer>
        </div>
      </div>

      {/* Desktop: Sticky sidebar */}
      <div className="hidden md:block sticky top-24 self-start">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-serif text-brand-brown mb-6 font-bold">Фильтры</h3>
            <FilterControls />
        </div>
      </div>
    </>
  );
});

FilterSidebar.displayName = 'FilterSidebar';
