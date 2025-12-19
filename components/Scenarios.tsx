
import React, { memo } from 'react';
import type { View } from '../types';
import { CubeTransparentIcon, PhotoIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'; // Используем Heroicons напрямую для стабильности

interface ScenariosProps {
  onNavigate: (view: View) => void;
}

const ScenariosComponent: React.FC<ScenariosProps> = ({ onNavigate }) => {
  const cards = [
    {
      title: "Готовая мебель",
      desc: "Диваны, шкафы и тумбы",
      icon: CubeTransparentIcon,
      action: () => onNavigate({ page: 'catalog' })
    },
    {
      title: "Создать свою",
      desc: "Размеры, материалы, стиль",
      icon: WrenchScrewdriverIcon,
      action: () => onNavigate({ page: 'furniture-from-photo' } as any) // Type hack until View is updated
    },
    {
      title: "AI редизайн",
      desc: "Загрузить фото комнаты",
      icon: PhotoIcon,
      action: () => onNavigate({ page: 'ai-room-makeover' } as any)
    }
  ];

  return (
    <div className="bg-warm-white py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div 
              key={idx}
              onClick={card.action}
              className="bg-white rounded-2xl p-8 cursor-pointer shadow-soft hover:shadow-lg transition-all duration-300 group border border-transparent hover:border-stone-beige/30"
            >
              <div className="w-12 h-12 bg-warm-white rounded-full flex items-center justify-center text-soft-black mb-6 group-hover:bg-soft-black group-hover:text-white transition-colors">
                <card.icon className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="text-xl font-medium text-soft-black mb-2">{card.title}</h3>
              <p className="text-muted-gray text-sm">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Scenarios = memo(ScenariosComponent);
