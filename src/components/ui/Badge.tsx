// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'sale' | 'popular' | 'new';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    sale: 'bg-red-500 text-white font-bold',
    popular: 'bg-orange-500 text-white font-semibold',
    new: 'bg-green-500 text-white font-semibold',
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};