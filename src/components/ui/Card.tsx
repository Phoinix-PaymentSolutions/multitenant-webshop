// src/components/ui/Card.tsx
import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-200',
        {
          'hover:shadow-md transition-shadow duration-200': hover,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}