// src/components/cart/CartSidebar.tsx
'use client';

import React from 'react';
import { XIcon, ShoppingCartIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CartItem } from './CartItem';
import { Extra } from '@/types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    basePrice: number;
    price: number;
    quantity: number;
    totalPrice: number;
    extras: Extra[];
  }>;
  cartTotal: number;
  deliveryFee: number;
  finalDeliveryFee: number;
  minimumOrder: number;
  freeDeliveryThreshold: number;
  isMinimumMet: boolean;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => void;
  brandColor?: string;
  isMobile: boolean;
  isStoreClosed: boolean;
}

export const CartSidebar = ({
  isOpen,
  onClose,
  cart,
  cartTotal,
  deliveryFee,
  finalDeliveryFee,
  minimumOrder,
  freeDeliveryThreshold,
  isMinimumMet,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  brandColor,
  isMobile,
  isStoreClosed
}: CartSidebarProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-transparent-900 bg-opacity-30 transition-opacity" onClick={onClose}></div>
      
      <div className={`fixed inset-y-0 right-0 max-w-full flex ${isMobile ? 'w-full' : 'md:w-1/3'}`}>
        <div className="w-full bg-white shadow-xl flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">Your Cart</h2>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <XIcon className="h-6 w-6" />
            </Button>
          </div>

          {/* Empty Cart */}
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 flex-grow">
              <ShoppingCartIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">Your cart is empty.</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-grow p-6 space-y-4">
                {cart.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                  />
                ))}
              </div>

              {/* Cart Summary */}
              <div className="p-6 border-t space-y-4">
                {/* Store Closed Warning */}
                {isStoreClosed && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    <p className="font-semibold">Store Currently Closed</p>
                    <p className="text-xs mt-1">You cannot checkout until we're open.</p>
                  </div>
                )}
                
                {/* Price Breakdown */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery:</span>
                    <span className={isMinimumMet ? 'line-through' : ''}>
                      €{deliveryFee.toFixed(2)}
                    </span>
                  </div>
                  
                  {!isMinimumMet && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      Add €{(freeDeliveryThreshold - cartTotal).toFixed(2)} more for free delivery!
                    </div>
                  )}
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between text-xl font-semibold">
                    <span>Total:</span>
                    <span>€{(cartTotal + finalDeliveryFee).toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={cartTotal < minimumOrder || isStoreClosed}
                  brandColor={brandColor}
                  onClick={onCheckout}
                >
                  {isStoreClosed
                    ? 'Store Closed - Cannot Checkout'
                    : cartTotal < minimumOrder
                      ? `Minimum order €${minimumOrder.toFixed(2)}`
                      : 'Proceed to Checkout'
                  }
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  Free delivery on orders over €{freeDeliveryThreshold.toFixed(2)}!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};