import React, { memo } from 'react';
import type { View } from '../types';
import { PhotoIcon, CubeTransparentIcon, SparklesIcon } from './Icons';

interface AiDesignerPageProps {
  onNavigate: (view: View) => void;
}

interface AiTool {
  name: string;
  description: string;
  view: View;
  icon: React.ReactElement;
}

export const AiDesignerPage: React.FC<AiDesignerPageProps> = memo(({ onNavigate }) => {
  const tools: AiTool[] = [
    {
      name: 'Редизайн комнаты с ИИ',
      description: 'Загрузите фото комнаты, выберите стиль, и ИИ полностью преобразит ваш интерьер.',
      view: { page: 'ai-room-makeover' },
      icon: <SparklesIcon className="w-12 h-12 text-brand-brown" />,
    },
    {
      name: 'Визуальный поиск',
      description: 'Загрузите фото интерьера, и ИИ найдет похожую мебель в нашем каталоге.',
      view: { page: 'visual-search' },
      icon: <PhotoIcon className="w-12 h-12 text-brand-brown" />,
    },
    {
      name: 'Конструктор по фото',
      description: 'Создайте мебель по своему фото и размерам, а ИИ рассчитает стоимость.',
      view: { page: 'furniture-from-photo' },
      icon: <CubeTransparentIcon className="w-12 h-12 text-brand-brown" />,
    },
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-brand-brown mb-3">AI Дизайнер</h1>
        <p className="text-lg text-brand-charcoal max-w-2xl mx-auto">
          Воспользуйтесь силой искусственного интеллекта для создания идеального интерьера.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tools.map((tool) => (
          <div
            key={tool.name}
            onClick={() => onNavigate(tool.view)}
            className="bg-white p-8 rounded-lg shadow-lg text-center flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="mb-4">{tool.icon}</div>
            <h2 className="text-2xl font-serif text-brand-charcoal mb-3">{tool.name}</h2>
            <p className="text-brand-charcoal/80 flex-grow mb-6">{tool.description}</p>
            <div className="text-brand-terracotta font-semibold hover:text-brand-terracotta-dark">
              Попробовать &rarr;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

AiDesignerPage.displayName = 'AiDesignerPage';
