import React, { useRef, memo } from 'react';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Image from 'next/image';

interface CategoryShowcaseProps {
  onNavigate: (view: View) => void;
}

// Обновленные категории с реальными изображениями из базы
const categories = [
  { name: 'Спальни', imageUrl: 'https://label-com.ru/images/virtuemart/product/agata.png' },
  { name: 'Кухни', imageUrl: 'https://label-com.ru/images/virtuemart/product/brend.png' },
  { name: 'Мягкая мебель', imageUrl: 'https://label-com.ru/images/virtuemart/product/BELLA.jpg' },
  { name: 'Гостиная', imageUrl: 'https://label-com.ru/images/virtuemart/product/monako-1.png' },
];

const CategoryCard: React.FC<{ name: string; imageUrl: string; onClick: () => void; index: number; }> = ({ name, imageUrl, onClick, index }) => {
  const ref = useRef<HTMLDivElement>(null!);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden shadow-lg cursor-pointer aspect-square ${isVisible ? 'animate-subtle-fade-in' : 'opacity-0'} hover:-translate-y-2 transition-transform duration-500`}
      style={{ animationDelay: isVisible ? `${index * 100}ms` : '0s' }}
    >
      <Image
        src={imageUrl}
        alt={name}
        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="text-white text-2xl font-serif font-bold drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{name}</h3>
        <div className="h-1 w-12 bg-brand-gold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
      </div>
    </div>
  );
};

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = memo(({ onNavigate }) => {
  const titleRef = useRef<HTMLHeadingElement>(null!);
  const isTitleVisible = useIntersectionObserver(titleRef, { threshold: 0.5 });

  const handleCategoryClick = (categoryName: string) => {
    onNavigate({ page: 'catalog', category: categoryName });
  };

  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 ref={titleRef} className={`text-4xl md:text-5xl font-serif text-brand-charcoal mb-12 text-center ${isTitleVisible ? 'animate-subtle-fade-in' : 'opacity-0'}`}>
          Коллекции
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {categories.map((cat, index) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              imageUrl={cat.imageUrl}
              onClick={() => handleCategoryClick(cat.name)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

CategoryShowcase.displayName = 'CategoryShowcase';
