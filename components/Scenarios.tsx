import React, { memo } from 'react';
import type { View } from '../types';
import { CubeTransparentIcon } from './icons';
import { FEATURE_FLAGS } from '../lib/featureFlags';

interface ScenariosProps {
  onNavigate: (view: View) => void;
}

const ScenariosComponent: React.FC<ScenariosProps> = ({ onNavigate }) => {
  const allCards = [
    {
      id: 'ready',
      title: "Готовая мебель",
      desc: "Посмотрите, как мебель будет выглядеть в вашем интерьере",
      icon: CubeTransparentIcon,
      action: () => onNavigate({ page: 'catalog' }),
      enabled: FEATURE_FLAGS.READY_FURNITURE_SCENARIO,
    },
  ];

  const visibleCards = allCards.filter(card => card.enabled);
  const single = visibleCards.length === 1;

  return (
    <div className="bg-warm-white py-16 md:py-24">
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
              className="bg-white max-w-md w-full rounded-2xl p-10 cursor-pointer shadow-soft hover:shadow-lg transition-all duration-300 group border border-transparent hover:border-stone-beige/20 transform hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-warm-white rounded-full flex items-center justify-center text-soft-black mb-8 group-hover:bg-soft-black group-hover:text-white transition-colors duration-300">
                <card.icon className="w-7 h-7 stroke-[1.5]" />
              </div>

              <h3 className="text-xl font-medium text-soft-black mb-3">
                {card.title}
              </h3>

              <p className="text-muted-gray text-base leading-relaxed mb-6">
                {card.desc}
              </p>

              <div className="text-soft-black text-sm font-medium">
                Посмотреть в интерьере →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Scenarios = memo(ScenariosComponent);
