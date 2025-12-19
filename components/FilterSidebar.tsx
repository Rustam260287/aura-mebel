
import React, { memo, useState, useEffect, useRef, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Button } from './Button';
import { XMarkIcon, ChevronDownIcon, CheckCircleIcon, ArrowsUpDownIcon, StarIcon, FireIcon, TagIcon } from './Icons';
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

const sortOptionsDisplay = {
  'rating_desc': { label: 'По популярности', icon: FireIcon },
  'discount_desc': { label: 'По скидке', icon: TagIcon },
  'price_asc': { label: 'Сначала дешевле', icon: ArrowsUpDownIcon },
  'price_desc': { label: 'Сначала дороже', icon: ArrowsUpDownIcon },
  'name_asc': { label: 'По названию', icon: StarIcon },
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
      {/* Category Filter - Custom Checkboxes */}
      <div>
        <h4 className="font-bold text-brand-charcoal text-xs uppercase tracking-widest mb-4">Категории</h4>
        <div className="space-y-2">
          {allCategories.map(category => {
            const isSelected = selectedCategories.includes(category);
            return (
              <label key={category} className="flex items-center cursor-pointer group select-none">
                <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200",
                    isSelected ? 'bg-brand-terracotta border-brand-terracotta' : 'bg-white border-gray-300 group-hover:border-brand-terracotta'
                )}>
                    <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(category)}
                    />
                    {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <span className={cn(
                    "ml-3 text-sm transition-colors",
                    isSelected ? 'text-brand-terracotta font-medium' : 'text-gray-600 group-hover:text-brand-charcoal'
                )}>
                    {category}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="my-8 border-gray-100" />

      {/* Price Filter - Custom Range */}
      <div>
        <h4 className="font-bold text-brand-charcoal text-xs uppercase tracking-widest mb-5">Цена</h4>
        <div className="relative h-1.5 bg-gray-100 rounded-full mb-6">
            <div 
                className="absolute top-0 left-0 h-full bg-brand-terracotta rounded-full pointer-events-none" 
                style={{ width: `${(localPrice / maxPrice) * 100}%` }}
            />
            <input 
                type="range"
                min="0"
                max={maxPrice}
                step="1000"
                value={localPrice}
                onChange={handlePriceDrag}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-brand-terracotta rounded-full shadow-md pointer-events-none transition-transform duration-200 ease-out z-20"
                style={{ left: `calc(${(localPrice / maxPrice) * 100}% - 8px)` }}
            />
        </div>
        <div className="flex justify-between items-center text-sm font-medium">
             <div className="bg-gray-50 px-3 py-1.5 rounded text-gray-500">
                0 ₽
             </div>
             <div className="bg-gray-50 px-3 py-1.5 rounded text-brand-terracotta">
                {localPrice.toLocaleString('ru-RU')} ₽
             </div>
        </div>
      </div>

      <hr className="my-8 border-gray-100" />

      {/* Sort Options - Custom Listbox */}
      <div>
        <h4 className="font-bold text-brand-charcoal text-xs uppercase tracking-widest mb-4">Сортировка</h4>
        <Listbox value={sortOption} onChange={onSortChange}>
            <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-50 py-3 pl-4 pr-10 text-left border border-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-terracotta sm:text-sm transition-all hover:bg-gray-100">
                    <span className="block truncate text-brand-charcoal font-medium">
                        {sortOptionsDisplay[sortOption].label}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                </Listbox.Button>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none z-50">
                        {Object.entries(sortOptionsDisplay).map(([key, { label, icon: Icon }]) => (
                            <Listbox.Option
                                key={key}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${
                                        active ? 'bg-brand-cream/50 text-brand-terracotta' : 'text-gray-700'
                                    }`
                                }
                                value={key}
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-bold text-brand-terracotta' : 'font-normal'}`}>
                                            {label}
                                        </span>
                                        {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-terracotta">
                                                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <Button 
            variant="ghost" 
            onClick={onReset} 
            className="w-full text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-widest font-bold transition-colors"
        >
            Сбросить фильтры
        </Button>
      </div>
    </>
  );
  
  return (
    <>
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div 
            className={`fixed inset-0 bg-brand-charcoal/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose} 
        />
        <div className={`relative h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <header className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-serif text-brand-charcoal">Фильтры</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-brand-terracotta transition-colors rounded-full hover:bg-gray-50">
                <XMarkIcon className="w-6 h-6"/>
            </button>
          </header>
          <div className="overflow-y-auto p-6 flex-grow scrollbar-hide">
            <FilterControls />
          </div>
          <footer className="p-6 border-t border-gray-100 bg-gray-50">
            <Button className="w-full py-3.5 text-xs uppercase tracking-widest font-bold shadow-lg shadow-brand-terracotta/20 bg-brand-terracotta hover:bg-brand-terracotta-dark text-white" onClick={onClose}>
                Показать результаты
            </Button>
          </footer>
        </div>
      </div>

      <div className="hidden md:block sticky top-24 self-start max-w-[280px]">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100/50">
            <FilterControls />
        </div>
      </div>
    </>
  );
});

FilterSidebar.displayName = 'FilterSidebar';
