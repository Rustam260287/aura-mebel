
import React from 'react';
import type { View } from '../types';
import { Button } from './Button';

interface ContentToolsPageProps {
  onNavigate: (view: View) => void;
}

export const ContentToolsPage: React.FC<ContentToolsPageProps> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-6 py-12 text-center">
      <h1 className="text-4xl font-serif text-brand-brown mb-4">Инструменты для контента</h1>
      <p className="text-lg text-brand-charcoal max-w-2xl mx-auto mb-8">
        Здесь вы можете найти инструменты на базе ИИ для создания и управления контентом для вашего магазина.
      </p>
      <div className="space-x-4">
        <Button onClick={() => onNavigate({ page: 'admin' })}>
          Перейти в админ-панель
        </Button>
      </div>
    </div>
  );
};