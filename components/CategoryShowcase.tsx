import React, { useRef, memo } from 'react';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Image from 'next/image';

interface CategoryShowcaseProps {
  onNavigate: (view: View) => void;
}

const categories = [
  { name: 'Спальни', imageUrl: 'https://label-com.ru/images/virtuemart/product/agata.png', count: 12 },
  { name: 'Кухни', imageUrl: 'https://label-com.ru/images/virtuemart/product/brend.png', count: 8 },
  { name: 'Мягкая мебель', imageUrl: 'https://label-com.ru/images/virtuemart/product/BELLA.jpg', count: 15 },
  { name: 'Гостиная', imageUrl: 'https://label-com.ru/images/virtuemart/product/monako-1.png', count: 20 },
];

const CategoryCard: React.FC<{ name: string; imageUrl: string; count: number; onClick: () => void; index: number; }> = ({ name, imageUrl, count, onClick, index }) => {
  const ref = useRef<HTMLDivElement>(null!);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.2 });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group relative overflow-hidden cursor-pointer aspect-[3/4] md:aspect-square rounded-2xl ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      style={{ animationDelay: isVisible ? `${index * 150}ms` : '0s' }}
    >
      <Image
        src={imageUrl}
        alt={name}
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-brand-brown/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-all duration-500 group-hover:translate-y-full" />
      
      {/* Content Initial State */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white group-hover:opacity-0 transition-opacity duration-300">
        <h3 className="text-xl md:text-2xl font-serif mb-1">{name}</h3>
        <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{count} моделей</p>
      </div>

      {/* Content Hover State */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4 border-b border-white/40 pb-1">Откройте коллекцию</span>
          <h3 className="text-2xl md:text-3xl font-serif text-center">{name}</h3>
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
    <div className="bg-white py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl text-left">
                <span className={`block text-brand-brown font-bold uppercase tracking-[0.2em] text-[10px] mb-4 ${isTitleVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                    Ассортимент шоурума
                </span>
                <h2 ref={titleRef} className={`text-4xl md:text-5xl font-serif text-brand-charcoal leading-tight ${isTitleVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                    Пространство для каждой <br/><span className="italic">истории</span>
                </h2>
            </div>
            <div className={`hidden md:block ${isTitleVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                 <button 
                    onClick={() => onNavigate({ page: 'catalog' })}
                    className="flex items-center gap-3 text-brand-brown font-bold uppercase tracking-widest text-[10px] group transition-all"
                 >
                    Смотреть все категории
                    <div className="w-10 h-10 rounded-full border border-brand-brown flex items-center justify-center group-hover:bg-brand-brown group-hover:text-white transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                 </button>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {categories.map((cat, index) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              imageUrl={cat.imageUrl}
              count={cat.count}
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
