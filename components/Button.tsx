
import React, { memo } from 'react';
import { cn } from '../utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  isLoading = false,
  disabled,
  ...props
}) => {
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soft-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-98',
        {
          // Primary: Soft Black, белый текст. Тихая, но уверенная.
          'bg-soft-black text-white hover:bg-black shadow-sm': variant === 'primary',
          
          // Secondary: Светлый фон, темный текст
          'bg-white text-soft-black border border-stone-beige hover:bg-stone-beige/10': variant === 'secondary',
          
          // Outline: Тонкая рамка
          'border border-soft-black/20 text-soft-black bg-transparent hover:border-soft-black': variant === 'outline',
          
          // Ghost: Без фона, для вторичных действий
          'text-soft-black hover:bg-stone-beige/10': variant === 'ghost',
          
          // Text & Link
          'text-soft-black hover:opacity-70 px-0 py-0 hover:bg-transparent': variant === 'text',
          'text-soft-black underline-offset-4 hover:underline': variant === 'link',
          
          // Sizes (по гайду min 48px height for main actions)
          'h-10 px-4 text-xs font-medium': size === 'sm',
          'h-12 px-6 text-sm font-medium': size === 'md', // Standard 48px
          'h-14 px-8 text-base font-medium': size === 'lg',
          'h-12 w-12 p-0': size === 'icon',
        },
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export const Button = memo(ButtonComponent);
