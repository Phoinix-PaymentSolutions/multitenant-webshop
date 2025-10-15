// src/components/cart/CartItem.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Extra } from '@/types';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    imageUrl?: string;
    basePrice: number;
    price: number;
    quantity: number;
    totalPrice: number;
    extras: Extra[];
  };
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  return (
    <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-3">
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={item.imageUrl || 'https://placehold.co/80x80/E5E7EB/9CA3AF?text=Item'}
          alt={item.name}
          fill
          className="rounded-md object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
        <p className="text-sm text-gray-500">Base: €{item.basePrice.toFixed(2)}</p>
        
        {item.extras.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            <p className="font-medium">Add-ons:</p>
            {item.extras.map((extra, index) => (
              <p key={extra.name || index} className="truncate">
                + {extra.name} (+€{extra.price.toFixed(2)})
              </p>
            ))}
          </div>
        )}
        
        <p className="text-sm font-medium text-gray-700 mt-1">
          Item total: €{item.price.toFixed(2)}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onRemove(item.id)}
      >
        <TrashIcon className="h-5 w-5 text-red-500" />
      </Button>
    </div>
  );
};