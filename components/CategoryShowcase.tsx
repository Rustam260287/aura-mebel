import React, { useRef, memo } from 'react';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface CategoryShowcaseProps {
  onNavigate: (view: View) => void;
}

const categories = [
  { name: 'Диваны', imageSeed: 'modern-sofa-living-room' },
  { name: 'Столы', imageSeed: 'wooden-dining-table' },
  { name: 'Кресла', imageSeed: 'cozy-armchair-reading' },
  { name: 'Хранение', imageSeed: 'stylish-storage-cabinet' },
  { name: 'Кровати', imageSeed: 'minimalist-bedroom-bed' },
  { name: 'Стулья', imageSeed: 'designer-chairs-set' },
];

const CategoryCard: React.FC<{ name: string; imageSeed: string; onClick: () => void; index: number; }> = ({ name, imageSeed, onClick, index }) => {
  const imageUrl = `https://picsum.photos/seed/${imageSeed}/600/600`;
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group relative rounded-lg overflow-hidden shadow-md cursor-pointer aspect-square ${isVisible ? 'animate-subtle-fade-in' : 'opacity-0'}`}
      style={{ animationDelay: isVisible ? `${index * 100}ms` : '0s' }}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <h3 className="text-white text-3xl font-serif text-center drop-shadow-md">{name}</h3>
      </div>
    </div>
  );
};

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = memo(({ onNavigate }) => {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const isTitleVisible = useIntersectionObserver(titleRef, { threshold: 0.5 });

  const handleCategoryClick = (categoryName: string) => {
    onNavigate({ page: 'catalog', category: categoryName });
  };

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-6">
        <h2 ref={titleRef} className={`text-4xl font-serif text-brand-charcoal mb-8 text-center ${isTitleVisible ? 'animate-subtle-fade-in' : 'opacity-0'}`}>
          По категориям
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat, index) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              imageSeed={cat.imageSeed}
              onClick={() => handleCategoryClick(cat.name)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
});