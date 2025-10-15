// src/lib/hooks/useCart.ts
import { useState, useCallback, useMemo } from 'react';
import { Product, Extra } from '@/types';

export interface CartItem {
  id: string;
  originalId?: string;
  name: string;
  imageUrl?: string;
  basePrice: number;
  price: number;
  quantity: number;
  totalPrice: number;
  extras: Extra[];
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product & { onSale?: boolean; salePrice?: number }, extras: Extra[] = []) => {
    const basePrice = product.onSale && product.salePrice ? product.salePrice : product.price;
    const extrasPrice = extras.reduce((sum, extra) => sum + extra.price, 0);
    const totalItemPrice = basePrice + extrasPrice;
    
    if (!basePrice || basePrice <= 0) {
      console.log('Invalid product price, cannot add to cart.');
      return;
    }

    setCart(prevCart => {
      const itemId = `${product.id}-${extras.map(e => e.id).sort().join('-')}`;
      
      const existingItem = prevCart.find(item => 
        item.originalId === product.id && 
        JSON.stringify(item.extras.map(e => e.id).sort()) === JSON.stringify(extras.map(e => e.id).sort())
      );
      
      if (existingItem) {
        return prevCart.map(item =>
          item === existingItem
            ? { 
                ...item, 
                quantity: item.quantity + 1, 
                totalPrice: totalItemPrice * (item.quantity + 1) 
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          ...product,
          id: itemId,
          originalId: product.id,
          quantity: 1,
          totalPrice: totalItemPrice,
          extras: extras,
          basePrice: basePrice,
          price: totalItemPrice,
          imageUrl: product.imageUrl ?? undefined
        };
        return [...prevCart, newItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== itemId);
      }
      return prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
          : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal
  };
};