
import React from 'react';
import { cn } from '../utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = "", showText = true, variant = 'dark' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-brand-charcoal';
  const iconColor = variant === 'light' ? 'text-white' : 'text-brand-terracotta';

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon: Modern abstract L */}
      <div className={cn("relative w-8 h-8 flex items-center justify-center", iconColor)}>
         <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M6 6H26V10H10V26H6V6Z" fill="currentColor" className="opacity-40" />
            <path d="M10 10H22V14H14V22H10V10Z" fill="currentColor" className="opacity-80" />
            <path d="M14 14H18V18H14V14Z" fill="currentColor" />
         </svg>
      </div>
      
      {/* Text: Labelcom */}
      {showText && (
        <div className="flex flex-col justify-center">
            <span className={cn("font-serif text-2xl font-bold tracking-tight leading-none", textColor)}>
            Labelcom
            </span>
            <span className={cn("text-[8px] uppercase tracking-[0.3em] font-medium opacity-60 ml-0.5", textColor)}>
                Furniture
            </span>
        </div>
      )}
    </div>
  );
};
