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
      {/* Mobile Aura Field (Static, CSS-only) */}
      <div
        className="absolute inset-0 pointer-events-none lg:hidden z-[-1]"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(255, 248, 240, 0.05) 0%, rgba(255, 248, 240, 0) 60%)',
        }}
        aria-hidden="true"
      />

      {/* Desktop Aura Glow - Subtle "Light in Space" Effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block"
        aria-hidden="true"
      >
        {/* Light Mode Glow */}
        <div
          className="absolute top-[10%] right-[-10%] w-[70vw] h-[70vw] rounded-full animate-breathing-glow blur-[100px] dark:opacity-0 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, rgba(255, 248, 240, 0.6) 0%, rgba(255, 248, 240, 0) 70%)',
            zIndex: -1
          }}
        />
        {/* Dark Mode Glow - Warmer, deeper */}
        <div
          className="absolute top-[5%] right-[-5%] w-[80vw] h-[80vw] rounded-full animate-breathing-glow blur-[120px] opacity-0 dark:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, rgba(200, 190, 180, 0.08) 0%, rgba(20, 19, 17, 0) 70%)',
            zIndex: -1
          }}
        />
      </div>

      <div className={`relative min-h-[calc(var(--vh,1vh)*100)] lg:min-h-[85vh] transition-opacity duration-300 ${isNavigating ? 'opacity-80' : 'opacity-100'}`}>
        <div className="container mx-auto px-6 relative z-10 h-full">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-center">
            {/* Text Content */}
            <div className="lg:col-span-12 flex flex-col justify-center h-full pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+22px)] lg:py-0">
              <div className="pt-10 lg:pt-0 max-w-2xl">
                <h1
                  className={[
                    'text-4xl md:text-5xl lg:text-7xl font-serif italic text-soft-black dark:text-aura-dark-text-main',
                    'leading-[1.1] tracking-tight',
                    isVisible ? 'animate-fade-in' : 'opacity-0',
                  ].join(' ')}
                  style={{ animationDelay: '0.1s' }}
                >
                  Будущий интерьер <br />
                  становится видимым
                </h1>

                <p
                  className={[
                    'mt-6 text-[17px] md:text-lg text-muted-gray dark:text-aura-dark-text-sec font-normal',
                    'max-w-lg leading-relaxed',
                    isVisible ? 'animate-fade-in' : 'opacity-0',
                  ].join(' ')}
                  style={{ animationDelay: '0.2s' }}
                >
                  Решение рождается спокойно и уверенно.<br />
                  Без давления и спешки.
                </p>
              </div>

              {/* Primary CTA (thumb zone) */}
              <div
                className={[
                  'mt-auto pt-10 lg:mt-12',
                  isVisible ? 'animate-fade-in' : 'opacity-0',
                ].join(' ')}
                style={{ animationDelay: '0.3s' }}
              >
                <Button
                  size="lg"
                  className={[
                    'w-full max-w-[420px] md:max-w-xs',
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Hero = memo(HeroComponent);
