import React from 'react';
// Fix: Corrected import path for Button component
import { Button } from './Button';
import type { View } from '../types';

interface HeroProps {
    onNavigate: (view: View) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <div className="bg-brand-cream">
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-brown mb-4 animate-subtle-fade-in">Создайте дом своей мечты</h1>
        <p className="text-lg md:text-xl text-brand-charcoal max-w-3xl mx-auto mb-10 animate-subtle-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
          Откройте для себя коллекцию стильной и качественной мебели, созданной для комфорта и вдохновения.
        </p>
        <div className="animate-subtle-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button size="lg" onClick={() => onNavigate({ page: 'catalog' })}>
            Перейти в каталог
          </Button>
        </div>
      </div>
    </div>
  );
};