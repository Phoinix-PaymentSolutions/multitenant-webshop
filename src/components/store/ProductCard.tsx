// src/components/store/ProductCard.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Product, Extra } from '@/types';

interface ProductCardProps {
  product: Product & {
    onSale?: boolean;
    salePrice?: number;
    salesCount?: number;
  };
  onAddToCart: (product: any, extras: Extra[]) => void;
  brandColor?: string;
  storeId: string;
  isStoreClosed?: boolean;
}

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  brandColor, 
  storeId, 
  isStoreClosed 
}: ProductCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});

  const extras = product.extras || [];

  const handleExpandToggle = () => {
    if (!isStoreClosed) {
      setExpanded(!expanded);
    }
  };

  const handleExtraSelect = (extraName: string) => {
    setSelectedExtras(prev => ({
      ...prev,
      [extraName]: !prev[extraName],
    }));
  };

  const handleAddToCart = () => {
    const finalExtras = extras.filter(extra => selectedExtras[extra.name]);
    onAddToCart(product, finalExtras);
    setExpanded(false);
    setSelectedExtras({});
  };

  const calculateTotal = () => {
    let total = product.onSale && product.salePrice ? product.salePrice : product.price;
    extras.forEach(extra => {
      if (selectedExtras[extra.name]) {
        total += extra.price;
      }
    });
    return total;
  };

  const finalPrice = calculateTotal();

  return (
    <div className={`group relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transform transition-all hover:scale-[1.02] ${isStoreClosed ? 'opacity-60' : ''}`}>
      {/* Product Image */}
      <div className="relative w-full h-48 sm:h-64 bg-gray-100">
        <Image
          priority
          src={product.imageUrl || 'https://placehold.co/400x400/E5E7EB/9CA3AF?text=Product'}
          alt={product.name}
          fill
          className="object-cover transition-opacity duration-300"
        />
        {product.onSale && (
          <Badge variant="sale" className="absolute top-3 left-3">
            Sale
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col justify-between">
        <h3 className="text-xl font-bold text-gray-900 truncate">{product.name}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mt-3">
          {product.onSale ? (
            <div className="flex items-center">
              <span className="text-xl font-bold text-red-600">
                €{(product.salePrice || product.price || 0).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through ml-2">
                €{(product.price || 0).toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-gray-900">
              €{(product.price || 0).toFixed(2)}
            </span>
          )}
          <Button 
            onClick={handleExpandToggle} 
            brandColor={brandColor} 
            size="sm"
            disabled={isStoreClosed}
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Extras Selection */}
      {expanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-200 animate-slide-down">
          <h4 className="font-bold text-lg mb-2">Add-ons</h4>
          {extras.length > 0 ? (
            <ul className="space-y-2">
              {extras.map((extra, index) => (
                <li key={index} className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer text-gray-700">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-gray-600 rounded-sm"
                      checked={!!selectedExtras[extra.name]}
                      onChange={() => handleExtraSelect(extra.name)}
                    />
                    <span className="ml-2">{extra.name}</span>
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    €{extra.price.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No add-ons available.</p>
          )}
          
          <div className="mt-4 pt-4 border-t border-dashed border-gray-300 flex justify-between items-center">
            <span className="font-bold text-lg text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-gray-900">
              €{finalPrice.toFixed(2)}
            </span>
          </div>
          
          <Button 
            onClick={handleAddToCart} 
            brandColor={brandColor} 
            className="mt-4 w-full"
            disabled={isStoreClosed}
          >
            {isStoreClosed ? 'Store Closed' : 'Add to Cart'}
          </Button>
        </div>
      )}
    </div>
  );
};