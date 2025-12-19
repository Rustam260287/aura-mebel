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
      className={`group relative overflow-hidden cursor-pointer aspect-[3/4] md:aspect-[4/5] ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} rounded-lg`}
      style={{ animationDelay: isVisible ? `${index * 150}ms` : '0s' }}
    >
      <Image
        src={imageUrl}
        alt={name}
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-500" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <h3 className="text-white text-2xl md:text-3xl font-serif font-medium tracking-wide transform translate-y-4 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            {name}
        </h3>
        <span className="text-white/80 text-sm mt-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 uppercase tracking-widest font-medium">
            Смотреть
        </span>
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
    <div className="bg-brand-cream-dark py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 gap-6">
            <div className="max-w-2xl">
                <span className={`block text-brand-terracotta text-sm font-bold uppercase tracking-widest mb-3 ${isTitleVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                    Коллекции
                </span>
                <h2 ref={titleRef} className={`text-4xl md:text-5xl font-serif text-brand-charcoal leading-tight ${isTitleVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                    Пространство для жизни
                </h2>
            </div>
             <div className={`${isTitleVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                 <button 
                    onClick={() => onNavigate({ page: 'catalog' })}
                    className="group flex items-center gap-2 text-brand-charcoal font-medium hover:text-brand-terracotta transition-colors pb-1 border-b border-brand-charcoal/20 hover:border-brand-terracotta"
                 >
                    Все категории
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                 </button>
             </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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
