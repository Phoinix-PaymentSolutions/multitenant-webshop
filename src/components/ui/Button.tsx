// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  brandColor?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  brandColor, 
  disabled, 
  type = 'button' 
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative';
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2 text-base',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8 text-lg',
    icon: 'h-10 w-10',
  }[size];

  const variantClasses = {
    default: 'text-white shadow-md hover:shadow-lg',
    outline: 'border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400',
    ghost: 'hover:bg-gray-100 text-gray-900',
  }[variant];

  const brandColorStyle = brandColor && variant === 'default' 
    ? { backgroundColor: brandColor, borderColor: brandColor } 
    : {};

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={variant === 'default' ? brandColorStyle : {}}
      onMouseEnter={e => {
        if (variant === 'default' && !disabled) {
          e.currentTarget.style.filter = 'brightness(90%)';
        }
      }}
      onMouseLeave={e => {
        if (variant === 'default') {
          e.currentTarget.style.filter = 'none';
        }
      }}
    >
      {children}
    </button>
  );
};