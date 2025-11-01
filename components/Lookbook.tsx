import React from 'react';
import type { View } from '../types';

interface LookbookItemProps {
  imageUrl: string;
  title: string;
  description: string;
}

const lookbookData: LookbookItemProps[] = [
  {
    imageUrl: 'https://picsum.photos/seed/scandinavian-serenity-interior/800/1200',
    title: 'Скандинавская безмятежность',
    description: 'Чистые линии, натуральные материалы и светлая палитра для спокойного пространства.'
  },
  {
    imageUrl: 'https://picsum.photos/seed/industrial-loft-brick-wall/800/1000',
    title: 'Индустриальный лофт',
    description: 'Сочетание необработанного дерева, металла и открытых пространств.'
  },
  {
    imageUrl: 'https://picsum.photos/seed/mid-century-elegance-home/800/1100',
    title: 'Элегантность Мид-сенчури',
    description: 'Иконический дизайн середины века, который никогда не выходит из моды.'
  },
  {
    imageUrl: 'https://picsum.photos/seed/bohemian-dream-room/800/1200',
    title: 'Богемный шик',
    description: 'Эклектичное сочетание текстур, узоров и натуральных элементов.'
  },
  {
    imageUrl: 'https://picsum.photos/seed/modern-minimalist-living/800/1000',
    title: 'Современный минимализм',
    description: 'Меньше — значит больше. Функциональность и простота в каждой детали.'
  },
  {
    imageUrl: 'https://picsum.photos/seed/new-classic-interior-design/800/1100',
    title: 'Новая классика',
    description: 'Вечная элегантность, переосмысленная для современного дома.'
  }
];

const LookbookCard: React.FC<LookbookItemProps> = ({ imageUrl, title, description }) => (
  <div className="group relative overflow-hidden rounded-lg cursor-pointer shadow-md">
    <img 
      src={imageUrl} 
      alt={title} 
      className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
    <div className="absolute bottom-0 left-0 p-6 text-white">
      <h3 className="text-2xl font-serif mb-2 transform transition-transform duration-300 group-hover:-translate-y-1">{title}</h3>
      <p className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-full transition-all duration-300 ease-in-out leading-relaxed">{description}</p>
    </div>
  </div>
);

export const Lookbook: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-brand-brown mb-3">Lookbook</h1>
        <p className="text-lg text-brand-charcoal max-w-2xl mx-auto">Найдите вдохновение в наших тщательно подобранных интерьерных решениях.</p>
      </div>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {lookbookData.map(item => (
          <div key={item.title} className="break-inside-avoid">
             <LookbookCard {...item} />
          </div>
        ))}
      </div>
    </div>
  );
};