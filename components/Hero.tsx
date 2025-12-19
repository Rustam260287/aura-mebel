import React, { useRef, memo } from 'react';
import { Button } from './Button';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Image from 'next/image';

interface HeroProps {
    onNavigate: (view: View) => void;
}

const HeroComponent: React.FC<HeroProps> = ({ onNavigate }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div className="relative bg-brand-cream overflow-hidden" ref={ref}>
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
             <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-brand-terracotta/5 blur-[100px]" />
             <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-brand-brown/5 blur-[100px]" />
        </div>

      <div className="container mx-auto px-6 py-20 md:py-32 relative z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
            <span className={`inline-block text-brand-terracotta font-bold tracking-widest uppercase text-xs mb-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                Новая коллекция 2024
            </span>
            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-serif text-brand-charcoal mb-6 leading-tight ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            Искусство <br/><span className="italic text-brand-terracotta">уюта</span>
            </h1>
            <p 
            className={`text-lg text-brand-charcoal/70 max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed font-light ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.2s' }}
            >
            Откройте для себя эксклюзивную мебель, которая превращает пространство в место силы и вдохновения. Дизайн вне времени.
            </p>
            <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center md:justify-start ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.3s' }}
            >
            <Button size="lg" className="rounded-full px-10 shadow-lg shadow-brand-terracotta/20" onClick={() => onNavigate({ page: 'catalog' })}>
                Смотреть каталог
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-10 border-brand-charcoal/20 text-brand-charcoal hover:bg-brand-charcoal hover:text-white hover:border-transparent" onClick={() => onNavigate({ page: 'about' })}>
                О бренде
            </Button>
            </div>
        </div>

        <div className={`flex-1 relative w-full aspect-square max-w-lg md:max-w-none ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
             {/* Abstract shape or Featured Image */}
             <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-[#E8E4DC] rounded-full transform rotate-3 scale-95" />
                 {/* Replace with actual hero image */}
                 <div className="absolute inset-4 rounded-3xl overflow-hidden shadow-2xl shadow-brand-brown/10 transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                    <Image 
                        src="/generated_images/01N67emOrzKb819BCOOE_sdxl.jpg" 
                        alt="Интерьер гостиной" 
                        fill
                        className="object-cover"
                        priority
                    />
                 </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl shadow-black/5 max-w-[200px] animate-pulse-slow hidden md:block">
                      <p className="text-3xl font-serif text-brand-terracotta mb-1">15+</p>
                      <p className="text-xs text-brand-charcoal/60 uppercase tracking-wider font-semibold">Лет создаем уют</p>
                  </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export const Hero = memo(HeroComponent);
