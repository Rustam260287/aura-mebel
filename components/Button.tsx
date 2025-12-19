
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
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-98',
        {
          // Primary: Classic chocolate background
          'bg-brand-brown text-white hover:bg-brand-charcoal shadow-md hover:shadow-lg': variant === 'primary',
          
          // Secondary: Lighter brown for secondary actions
          'bg-brand-brown-light/20 text-brand-brown hover:bg-brand-brown-light/30': variant === 'secondary',
          
          // Outline: Classic border
          'border-2 border-brand-brown text-brand-brown bg-transparent hover:bg-brand-brown hover:text-white': variant === 'outline',
          
          // Ghost & Text & Link
          'text-brand-brown hover:bg-brand-brown/5': variant === 'ghost',
          'text-brand-charcoal hover:text-brand-brown px-0 py-0 hover:bg-transparent': variant === 'text',
          'text-brand-brown underline-offset-4 hover:underline': variant === 'link',
          
          // Sizes
          'h-9 px-4 text-xs font-semibold uppercase tracking-wider': size === 'sm',
          'h-11 px-6 text-sm font-semibold': size === 'md',
          'h-14 px-8 text-base font-bold': size === 'lg',
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
