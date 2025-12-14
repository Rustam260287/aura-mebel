
import React from 'react';

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
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon: L in a rounded square */}
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg} shadow-sm`}>
        <span className={`font-serif text-2xl font-bold ${iconText} translate-y-[1px] translate-x-[1px]`}>L</span>
      </div>
      
      {/* Text: Labelcom */}
      {showText && (
        <span className={`font-serif text-3xl font-medium tracking-tight ${textColor}`}>
          Labelcom
        </span>
      )}
    </div>
  );
};
