import React, { useRef, memo } from 'react';
import { Button } from './Button';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface HeroProps {
    onNavigate: (view: View) => void;
}

const HeroComponent: React.FC<HeroProps> = ({ onNavigate }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div className="bg-brand-cream" ref={ref}>
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className={`text-5xl md:text-7xl font-serif text-brand-brown mb-4 ${isVisible ? 'animate-subtle-fade-in' : 'opacity-0'}`}>
          Создайте дом своей мечты
        </h1>
        <p 
          className={`text-lg md:text-xl text-brand-charcoal max-w-3xl mx-auto mb-10 leading-relaxed ${isVisible ? 'animate-subtle-fade-in' : 'opacity-0'}`}
          style={{ animationDelay: isVisible ? '0.2s' : '0s' }}
        >
          Откройте для себя коллекцию стильной и качественной мебели, созданной для комфорта и вдохновения.
        </p>
        <div 
          className={`${isVisible ? 'animate-subtle-fade-in' : 'opacity-0'}`}
          style={{ animationDelay: isVisible ? '0.4s' : '0s' }}
        >
          <Button size="lg" onClick={() => onNavigate({ page: 'catalog' })}>
            Перейти в каталог
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Hero = memo(HeroComponent);
