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
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-terracotta disabled:pointer-events-none disabled:opacity-50 active:scale-98',
        {
          'bg-brand-terracotta text-white hover:bg-brand-terracotta-dark shadow-sm': variant === 'primary',
          'bg-brand-cream-dark text-brand-charcoal hover:bg-gray-200/80': variant === 'secondary',
          'border border-brand-brown/30 text-brand-brown bg-transparent hover:bg-brand-brown/5': variant === 'outline',
          'text-brand-charcoal hover:bg-brand-cream-dark hover:text-brand-brown': variant === 'ghost',
          'text-brand-charcoal hover:text-brand-brown px-0 py-0 hover:bg-transparent': variant === 'text',
          'text-brand-terracotta underline-offset-4 hover:underline': variant === 'link',
          
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-5 text-sm': size === 'md',
          'h-12 px-8 text-base': size === 'lg',
          'h-10 w-10 p-0': size === 'icon',
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
