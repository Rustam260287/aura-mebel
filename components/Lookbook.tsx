
import React, { memo, useRef } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Button } from './Button';
import type { View } from '../types';

interface LookbookProps {
  onNavigate: (view: View) => void;
}

const LookbookItem: React.FC<{
  imageUrl: string;
  title: string;
  description: string;
  products: string[];
  index: number;
  onNavigate: (view: View) => void;
}> = ({ imageUrl, title, description, products, index, onNavigate }) => {
  const ref = useRef<HTMLDivElement>(null!);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.2 });

  return (
    <div 
        ref={ref}
        className={`relative group overflow-hidden rounded-sm aspect-[3/4] md:aspect-[4/5] ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
        style={{ animationDelay: `${index * 150}ms` }}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-90 transition-opacity duration-300" />
      
      <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
        <h3 className="text-2xl md:text-3xl font-serif mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            {title}
        </h3>
        <p className="text-sm text-gray-200 mb-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 font-light leading-relaxed max-w-xs">
            {description}
        </p>
        
        <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-200">
             <Button 
                variant="outline" 
                size="sm"
                className="border-white text-white hover:bg-white hover:text-brand-charcoal text-[10px] uppercase tracking-widest px-6"
                onClick={() => onNavigate({ page: 'catalog' })} // В будущем можно фильтровать по коллекции
             >
                Смотреть образ
             </Button>
        </div>
      </div>
    </div>
  );
};

const LookbookComponent: React.FC<LookbookProps> = ({ onNavigate }) => {
  const looks = [
    {
      title: "Скандинавский Утро",
      description: "Светлые тона, натуральное дерево и функциональность. Идеально для начала дня.",
      imageUrl: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      products: ["chair-1", "table-2"]
    },
    {
      title: "Лофт Эстетика",
      description: "Грубые текстуры бетона в сочетании с мягкостью велюра. Смелый выбор.",
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      products: ["sofa-3", "lamp-1"]
    },
     {
      title: "Современная Классика",
      description: "Элегантность форм и благородство материалов. Вне времени.",
      imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      products: ["sofa-3", "lamp-1"]
    }
  ];

  return (
    <section className="py-24 bg-brand-cream relative overflow-hidden">
       {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-white skew-x-12 translate-x-1/4" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
                 <span className="text-brand-terracotta text-sm font-bold uppercase tracking-widest mb-3 block">Вдохновение</span>
                 <h2 className="text-4xl md:text-5xl font-serif text-brand-charcoal leading-tight">
                    Идеи для вашего дома
                </h2>
            </div>
             <Button variant="link" onClick={() => onNavigate({ page: 'blog' })} className="hidden md:flex text-brand-terracotta hover:text-brand-terracotta-dark">
                Больше идей в журнале →
             </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {looks.map((look, idx) => (
            <LookbookItem 
                key={idx} 
                {...look} 
                index={idx}
                onNavigate={onNavigate}
            />
          ))}
        </div>
        
         <div className="mt-12 text-center md:hidden">
            <Button variant="text" onClick={() => onNavigate({ page: 'blog' })} className="text-brand-terracotta">
                Больше идей в журнале →
             </Button>
         </div>
      </div>
    </section>
  );
};

export const Lookbook = memo(LookbookComponent);
