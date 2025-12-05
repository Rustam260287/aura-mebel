
import React from 'react';

// Используем явное определение функции вместо React.FC для лучшей совместимости с TS
export function Spinner({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className || 'h-12 w-12 text-brand-brown'}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
