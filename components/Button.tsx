import React, { memo } from 'react';

// Добавил 'text' в варианты
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variantClasses = {
    primary: 'bg-brand-brown text-white hover:bg-brand-charcoal focus:ring-brand-brown',
    outline: 'border border-brand-brown/50 text-brand-brown hover:bg-brand-brown hover:text-white focus:ring-brand-brown',
    ghost: 'text-brand-charcoal hover:bg-brand-cream-dark focus:ring-brand-brown',
    // Добавил стили для варианта 'text'
    text: 'text-brand-charcoal hover:text-brand-brown focus:ring-brand-brown px-0 py-0 hover:bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  // Для 'text' не применяем padding из sizeClasses
  const finalSizeClasses = variant === 'text' ? '' : sizeClasses[size];

  const classes = [
    baseClasses,
    variantClasses[variant],
    finalSizeClasses, // Используем скорректированные классы размера
    className
  ].join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export const Button = memo(ButtonComponent);
