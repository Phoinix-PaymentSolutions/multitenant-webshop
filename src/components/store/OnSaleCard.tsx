// src/components/store/OnSaleCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product, Extra } from '@/types';

interface OnSaleCardProps {
  onSaleProducts: (Product & {
    onSale?: boolean;
    salePrice?: number;
  })[];
  onAddToCart: (product: any, extras: Extra[]) => void;
  brandColor?: string;
}

export const OnSaleCard = ({ onSaleProducts, onAddToCart, brandColor }: OnSaleCardProps) => {
  if (onSaleProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">On Sale!</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {onSaleProducts.slice(0, 4).map((product) => (
          <div key={product.id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
            <div className="w-20 h-20 flex-shrink-0 relative">
              <Image
                src={product.imageUrl || 'https://placehold.co/80x80/E5E7EB/9CA3AF?text=Sale'}
                alt={product.name}
                fill
                className="object-cover rounded-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-red-600 font-bold">
                  €{(product.salePrice || product.price || 0).toFixed(2)}
                </span>
                <span className="text-gray-500 text-sm line-through">
                  €{(product.price || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onAddToCart(product, [])}
              brandColor={brandColor}
              size="sm"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {onSaleProducts.length > 4 && (
        <p className="text-sm text-center text-gray-600 mt-4">
          And {onSaleProducts.length - 4} more products on sale!
        </p>
      )}
    </div>
  );
};