
import React from 'react';
import { cn } from '../utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = "", showText = true, variant = 'dark' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-brand-brown';
  const iconBg = variant === 'light' ? 'bg-white' : 'bg-brand-brown';
  const iconText = variant === 'light' ? 'text-brand-brown' : 'text-white';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icon: Classic 'L' in a rounded square */}
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg shadow-sm transition-transform hover:scale-105", iconBg)}>
        <span className={cn("font-serif text-2xl font-bold translate-y-[1px] translate-x-[0px]", iconText)}>
          A
        </span>
      </div>

      {/* Text: AURA */}
      {showText && (
        <span className={cn("font-serif text-3xl font-medium tracking-wide", textColor)}>
          AURA
        </span>
      )}
    </div>
  );
};
