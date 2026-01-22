import React, { useRef, memo } from 'react';
import { Button } from './Button';
import type { View } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Image from 'next/image';

interface HeroProps {
  onNavigate: (view: View) => void;
  heroImageUrl?: string; // First featured product image
}

/**
 * Hero v2 — AR-focused landing
 * 
 * Hierarchy:
 * 1. Text — primary (explains value)
 * 2. Button — secondary (single CTA)
 * 3. Visual — supporting (real product, not concept)
 */
const HeroComponent: React.FC<HeroProps> = ({ onNavigate, heroImageUrl }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleClick = () => {
    setIsNavigating(true);
    setTimeout(() => {
      onNavigate({ page: 'objects' } as View);
    }, 200);
  };

  return (
    <section
      ref={ref}
      className="relative isolate bg-transparent overflow-hidden"
    >
      {/* Background: Subtle gradient (always present) */}
      <div
        className="absolute inset-0 pointer-events-none z-[-2]"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 248, 240, 0.4) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className={`relative min-h-[calc(var(--vh,1vh)*100)] lg:min-h-[90vh] transition-opacity duration-300 ${isNavigating ? 'opacity-80' : 'opacity-100'}`}>
        <div className="container mx-auto px-6 relative z-10 h-full">
          <div className="h-full flex flex-col justify-center pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)] lg:py-16">

            {/* Text Content — Primary */}
            <div className="max-w-xl">
              <h1
                className={[
                  'text-[32px] md:text-5xl lg:text-6xl font-serif italic text-soft-black dark:text-aura-dark-text-main',
                  'leading-[1.15] tracking-tight',
                  isVisible ? 'animate-fade-in' : 'opacity-0',
                ].join(' ')}
                style={{ animationDelay: '0.1s' }}
              >
                Мебель, которую можно{' '}
                <br className="hidden sm:block" />
                увидеть у себя дома
              </h1>

              <p
                className={[
                  'mt-5 text-[16px] md:text-lg text-muted-gray dark:text-aura-dark-text-sec font-normal',
                  'max-w-md leading-relaxed',
                  isVisible ? 'animate-fade-in' : 'opacity-0',
                ].join(' ')}
                style={{ animationDelay: '0.2s' }}
              >
                Посмотрите в 3D и примерьте через камеру телефона
              </p>
            </div>

            {/* CTA Button — Secondary */}
            <div
              className={[
                'mt-8 lg:mt-10',
                isVisible ? 'animate-fade-in' : 'opacity-0',
              ].join(' ')}
              style={{ animationDelay: '0.3s' }}
            >
              <Button
                size="lg"
                className={[
                  'w-full max-w-[340px] md:max-w-xs',
                  'rounded-2xl h-14 text-[15px] font-medium',
                  'bg-soft-black/95 text-white shadow-lg shadow-soft-black/10',
                  'dark:bg-stone-beige dark:text-aura-dark-base dark:shadow-none dark:hover:bg-[#D6CFC7]',
                  'active:scale-[0.97] active:shadow-none transition-all duration-150 ease-out',
                ].join(' ')}
                onClick={handleClick}
              >
                Посмотреть в интерьере
              </Button>
            </div>

            {/* Micro-explanation */}
            <div
              className={[
                'mt-5 flex items-center gap-2 text-[13px] text-muted-gray/80 dark:text-aura-dark-text-muted',
                isVisible ? 'animate-fade-in' : 'opacity-0',
              ].join(' ')}
              style={{ animationDelay: '0.4s' }}
            >
              <span>3D-модели</span>
              <span className="w-1 h-1 rounded-full bg-muted-gray/40" />
              <span>Через камеру</span>
              <span className="w-1 h-1 rounded-full bg-muted-gray/40" />
              <span>Бесплатно</span>
            </div>

            {/* Visual Anchor — Supporting */}
            <div
              className={[
                'mt-10 lg:mt-12 relative',
                isVisible ? 'animate-fade-in' : 'opacity-0',
              ].join(' ')}
              style={{ animationDelay: '0.5s' }}
            >
              <div className="relative aspect-[4/3] max-w-md rounded-2xl overflow-hidden bg-stone-100 dark:bg-aura-dark-surface shadow-xl">
                {heroImageUrl ? (
                  <>
                    <Image
                      src={heroImageUrl}
                      alt="Мебель в интерьере"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 448px"
                      priority
                    />
                    {/* AR-style overlay: subtle ring indicator */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Bottom gradient fade */}
                      <div
                        className="absolute inset-x-0 bottom-0 h-1/3"
                        style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)' }}
                      />
                      {/* AR placement ring hint */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-dashed border-soft-black/20 animate-pulse" />
                    </div>
                  </>
                ) : (
                  /* Fallback: Gradient placeholder */
                  <div
                    className="w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e2db 100%)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Trust Block */}
            <div
              className={[
                'mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted-gray/70 dark:text-aura-dark-text-muted',
                isVisible ? 'animate-fade-in' : 'opacity-0',
              ].join(' ')}
              style={{ animationDelay: '0.6s' }}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Без регистрации
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Без скачивания
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Работает в браузере
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export const Hero = memo(HeroComponent);
