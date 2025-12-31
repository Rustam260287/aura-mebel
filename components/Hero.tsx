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
    <section
      ref={ref}
      className="relative isolate bg-warm-white overflow-hidden"
    >
      {/* Mobile hero visual (background) */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover scale-110 blur-[2px] opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-white/15 via-warm-white/35 to-warm-white" />
        <div className="absolute inset-0 bg-soft-black/[0.03]" />
      </div>

      <div className="relative min-h-[calc(var(--vh,1vh)*100)] lg:min-h-[85vh]">
        <div className="container mx-auto px-6 relative z-10 h-full">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-center">
            {/* Text Content */}
            <div className="lg:col-span-7 flex flex-col h-full pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+22px)] lg:py-0">
              <div className="pt-10 lg:pt-0">
                <h1
                  className={[
                    'text-4xl md:text-5xl lg:text-6xl font-medium text-soft-black',
                    'leading-[1.1] tracking-tight',
                    isVisible ? 'animate-fade-in' : 'opacity-0',
                  ].join(' ')}
                  style={{ animationDelay: '0.1s' }}
                >
                  Мебель, которую можно <br />
                  увидеть у себя дома
                </h1>

                <p
                  className={[
                    'mt-6 text-[17px] md:text-lg text-muted-gray font-normal',
                    'max-w-lg leading-relaxed',
                    isVisible ? 'animate-fade-in' : 'opacity-0',
                  ].join(' ')}
                  style={{ animationDelay: '0.2s' }}
                >
                  Посмотрите в 3D и AR — без регистрации и давления.
                </p>
              </div>

              {/* Primary CTA (thumb zone) */}
              <div
                className={[
                  'mt-auto pt-10',
                  isVisible ? 'animate-fade-in' : 'opacity-0',
                ].join(' ')}
                style={{ animationDelay: '0.3s' }}
              >
                <Button
                  size="lg"
                  className={[
                    'w-full max-w-[420px]',
                    'rounded-2xl h-14 text-[15px] font-medium',
                    'bg-soft-black/95 text-white shadow-lg shadow-soft-black/10',
                    'active:scale-[0.99]',
                  ].join(' ')}
                  onClick={() => onNavigate({ page: 'objects' } as View)}
                >
                  Посмотреть в интерьере
                </Button>
              </div>
            </div>

            {/* Desktop visual */}
            <div className="lg:col-span-5 relative h-[520px] hidden lg:block">
              <div
                className={`relative h-full w-full rounded-2xl overflow-hidden ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
                style={{ animationDelay: '0.2s' }}
              >
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
      </div>
    </section>
  );
};

export const Hero = memo(HeroComponent);
