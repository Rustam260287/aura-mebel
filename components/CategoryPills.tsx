import React, { memo } from 'react';

interface CategoryPillsProps {
  categories: string[];
  selectedCategories: string[];
  onCategorySelect: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = memo(({ categories, selectedCategories, onCategorySelect }) => {
  const handleSelect = (category: string) => {
    onCategorySelect(category);
  };

  const allPillCategories = ['Все', ...categories];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
      {allPillCategories.map(category => {
        const isAllButton = category === 'Все';
        const isActive = (isAllButton && selectedCategories.length === 0) || 
                         (!isAllButton && selectedCategories.length === 1 && selectedCategories[0] === category);
        
        return (
          <button
            key={category}
            onClick={() => handleSelect(isAllButton ? '' : category)}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 text-sm md:text-base ${
              isActive
                ? 'bg-brand-brown text-white shadow-md'
                : 'bg-white text-brand-charcoal hover:bg-brand-cream-dark hover:shadow-sm border border-brand-cream-dark'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
});