
import React, { memo, useState, useEffect, useRef, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Button } from './Button';
import { XMarkIcon, ChevronDownIcon, CheckCircleIcon, ArrowsUpDownIcon, StarIcon } from './icons';
import { cn } from '../utils';

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

// Removing FireIcon and TagIcon as they are not in the restored Icons.tsx
const sortOptionsDisplay = {
  'rating_desc': { label: 'По популярности', icon: StarIcon },
  'price_asc': { label: 'Сначала дешевле', icon: ArrowsUpDownIcon },
  'price_desc': { label: 'Сначала дороже', icon: ArrowsUpDownIcon },
  'name_asc': { label: 'По названию', icon: StarIcon },
  'discount_desc': { label: 'По скидке', icon: StarIcon }, // Using StarIcon as fallback
};

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
  const [localPrice, setLocalPrice] = useState(priceRange[1]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    if (timerRef.current) {
        clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
        onPriceChange([priceRange[0], newVal]);
    }, 400); 
  };

  const FilterControls = () => (
    <>
      {/* Category Filter */}
      <div className="mb-8">
        <h4 className="font-serif font-bold text-lg text-brand-charcoal mb-4 border-b border-brand-brown/10 pb-2">Категории</h4>
        <div className="space-y-3">
          {allCategories.map(category => {
            const isSelected = selectedCategories.includes(category);
            return (
              <label key={category} className="flex items-center cursor-pointer group select-none hover:bg-brand-cream/50 p-1 rounded transition-colors -ml-1">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-gray-300 text-brand-brown focus:ring-brand-brown"
                  checked={isSelected}
                  onChange={() => handleCategoryToggle(category)}
                />
                <span className={cn(
                    "ml-3 text-sm transition-colors",
                    isSelected ? 'text-brand-brown font-bold' : 'text-brand-charcoal group-hover:text-brand-brown'
                )}>
                    {category}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Filter */}
      <div className="mb-8">
        <h4 className="font-serif font-bold text-lg text-brand-charcoal mb-4 border-b border-brand-brown/10 pb-2">Цена</h4>
        <input 
            type="range"
            min="0"
            max={maxPrice}
            step="1000"
            value={localPrice}
            onChange={handlePriceDrag}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-brown"
        />
        <div className="flex justify-between items-center text-sm mt-2">
             <span className="text-gray-500">0 ₽</span>
             <span className="text-brand-brown font-bold">
                {localPrice.toLocaleString('ru-RU')} ₽
             </span>
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-8">
        <h4 className="font-serif font-bold text-lg text-brand-charcoal mb-4 border-b border-brand-brown/10 pb-2">Сортировка</h4>
        <Listbox value={sortOption} onChange={onSortChange}>
            <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white py-2.5 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-brown focus:border-brand-brown sm:text-sm shadow-sm">
                    <span className="block truncate">{sortOptionsDisplay[sortOption].label}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                        {Object.entries(sortOptionsDisplay).map(([key, { label }]) => (
                            <Listbox.Option key={key} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-brand-cream text-brand-brown' : 'text-gray-900'}`} value={key}>
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{label}</span>
                                        {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-brown"><CheckCircleIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <Button 
            variant="ghost" 
            onClick={onReset} 
            className="w-full text-xs text-gray-500 hover:text-red-600 uppercase tracking-wider font-bold"
        >
            Сбросить все
        </Button>
      </div>
    </>
  );
  
  return (
    <>
      <div className={`fixed inset-0 z-50 transition-opacity md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative h-full w-full max-w-xs bg-white shadow-xl flex flex-col transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <header className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-brand-charcoal">Фильтры</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6"/></button>
          </header>
          <div className="overflow-y-auto p-6 flex-grow">
            <FilterControls />
          </div>
          <footer className="p-4 border-t">
            <Button className="w-full" onClick={onClose}>Применить</Button>
          </footer>
        </div>
      </div>

      <div className="hidden md:block w-72 flex-shrink-0">
        <div className="sticky top-28 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <FilterControls />
        </div>
      </div>
    </>
  );
});

FilterSidebar.displayName = 'FilterSidebar';
