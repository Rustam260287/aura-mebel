import React, { memo } from 'react';
import type { View } from '../types';
import { ChevronRightIcon, CubeTransparentIcon } from './icons';

interface ScenariosProps {
  onNavigate: (view: View) => void;
}

const ScenariosComponent: React.FC<ScenariosProps> = ({ onNavigate }) => {
  const allCards = [
    {
      id: 'ready',
      title: "Галерея объектов",
      desc: "Выберите объект и примерьте его в комнате через AR",
      icon: CubeTransparentIcon,
      action: () => onNavigate({ page: 'objects' }),
      enabled: true,
    },
  ];

  const visibleCards = allCards.filter(card => card.enabled);
  const single = visibleCards.length === 1;

  return (
    <div className="bg-warm-white py-10 md:py-16">
      <div className="container mx-auto px-6">
        <div
          className={
            single
              ? "flex justify-center"
              : "grid grid-cols-1 md:grid-cols-3 gap-6"
          }
        >
          {visibleCards.map(card => (
            <div
              key={card.id}
              onClick={card.action}
              className={[
                'group w-full max-w-md cursor-pointer',
                'rounded-2xl p-6 md:p-8',
                'bg-white/70 backdrop-blur-md',
                'border border-stone-beige/20',
                'shadow-soft hover:shadow-md transition-all duration-300',
                'active:scale-[0.99]',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-white/80 border border-stone-beige/20 flex items-center justify-center text-soft-black/80">
                    <card.icon className="w-5 h-5 stroke-[1.5]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-medium text-soft-black tracking-tight">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-gray leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <ChevronRightIcon className="w-5 h-5 text-muted-gray/60 group-hover:text-soft-black/70 transition-colors mt-1 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Scenarios = memo(ScenariosComponent);
