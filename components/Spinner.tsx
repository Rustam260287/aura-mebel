
import React from 'react';

interface SpinnerProps {
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className }) => (
  // Если className передан, он должен содержать размеры (w-*, h-*) и цвета.
  // По умолчанию (если нет className) рисуем большой коричневый спиннер.
  <div 
    className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className || 'h-12 w-12 text-brand-brown'}`}
    role="status"
    aria-label="loading"
  >
    <span className="sr-only">Loading...</span>
  </div>
);
