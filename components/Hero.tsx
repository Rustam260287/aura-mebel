import React, { useRef, memo } from 'react';
import { Button } from './Button';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Image from 'next/image';

interface HeroProps {
    onNavigate: (view: View) => void;
}

// LABEL GUIDE: Главный экран. 
// Заголовок: "Мебель, которую можно увидеть у себя дома"
// Подзаголовок: "Посмотрите в 3D и AR — без регистрации и давления"
// Кнопка: "Посмотреть в интерьере" (одна, спокойная)

const HeroComponent: React.FC<HeroProps> = ({ onNavigate }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div className="relative min-h-[85vh] flex items-center bg-warm-white overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Text Content - Тишина и Уверенность */}
        <div className="lg:col-span-7 text-left pl-2">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-medium text-soft-black mb-6 leading-[1.1] tracking-tight ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                Мебель, которую можно <br/>
                увидеть у себя дома
            </h1>
            
            <p className={`text-lg text-muted-gray mb-10 font-normal max-w-lg leading-relaxed ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                Посмотрите в 3D и AR — без регистрации и давления.
            </p>
            
            <div className={`${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                <Button 
                    size="lg" 
                    className="bg-soft-black text-white hover:opacity-90 rounded-xl px-8 h-14 text-[15px] font-medium shadow-sm transition-transform hover:scale-[1.02]" 
                    onClick={() => onNavigate({ page: 'catalog' })}
                >
                    Посмотреть в интерьере
                </Button>
            </div>
        </div>

        {/* Visual - Спокойствие и эстетика */}
        <div className="lg:col-span-5 relative h-[500px] hidden lg:block">
             <div className={`relative h-full w-full rounded-2xl overflow-hidden ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                <Image 
                    src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="Interior Calm" 
                    fill
                    className="object-cover"
                    priority
                />
             </div>
        </div>
      </div>
    </div>
  );
};

export const Hero = memo(HeroComponent);
