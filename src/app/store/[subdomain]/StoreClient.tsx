// src/app/store/[subdomain]/StoreClient.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import type { Store, Product, CartItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface StoreClientProps {
  store: Store;
  products: Product[];
}

export default function StoreClient({ store, products }: StoreClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white shadow-sm sticky top-0 z-40"
        style={{ backgroundColor: store.brandColor || '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Store branding */}
            <div className="flex items-center space-x-3">
              {store.logoUrl && (
                <div className="relative h-10 w-10">
                  <Image
                    src={store.logoUrl}
                    alt={`${store.name} logo`}
                    fill
                    className="object-contain rounded"
                  />
                </div>
              )}
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: store.textColor || '#000000' }}
                >
                  {store.name}
                </h1>
                {store.description && (
                  <p 
                    className="text-sm opacity-75"
                    style={{ color: store.textColor || '#000000' }}
                  >
                    {store.description}
                  </p>
                )}
              </div>
            </div>

            {/* Cart button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              variant="outline"
              className="relative"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to {store.name}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {store.description || 'Discover our amazing products'}
          </p>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600">Check back soon for new products!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} hover className="overflow-hidden">
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <Image
                    src={product.imageUrl || '/placeholder-product.jpg'}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      €{product.price.toFixed(2)}
                    </span>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.inventory <= 0}
                      size="sm"
                    >
                      {product.inventory > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                  {product.inventory <= 5 && product.inventory > 0 && (
                    <p className="text-orange-600 text-sm mt-2">
                      Only {product.inventory} left!
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Cart header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Cart ({cartItemCount})</h2>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="ghost"
                    size="sm"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCartIcon className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <Image
                          src={item.imageUrl || '/placeholder-product.jpg'}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-gray-600">€{item.price.toFixed(2)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MinusIcon className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <PlusIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart footer */}
              {cart.length > 0 && (
                <div className="border-t p-6">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Total:</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}