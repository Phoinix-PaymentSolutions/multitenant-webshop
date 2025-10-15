// src/components/store/StorePage.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductCard } from './ProductCard';
import { OnSaleCard } from './OnSaleCard';
import { Product, Extra } from '@/types';

type SortOption = 'name' | 'priceLowToHigh' | 'priceHighToLow' | 'newest' | 'bestSeller';

interface StorePageProps {
  store: {
    id: string;
    brandColor?: string;
  };
  products: (Product & {
    onSale?: boolean;
    salePrice?: number;
    salesCount?: number;
  })[];
  onAddToCart: (product: any, extras: Extra[]) => void;
  searchTerm: string;
  sortBy: SortOption;
  storeStatus?: any;
}

export const StorePage = ({ 
  store, 
  products, 
  onAddToCart, 
  searchTerm, 
  sortBy, 
  storeStatus 
}: StorePageProps) => {
  const categories = useMemo(() => {
    const allCategories = products
      .map(p => p.category)
      .filter(category => category && typeof category === 'string');
    return ['All', ...Array.from(new Set(allCategories)).sort()];
  }, [products]);

  const onSaleProducts = useMemo(() => products.filter(p => p.onSale), [products]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScroll = () => {
      if (categoriesRef.current) {
        const { scrollWidth, clientWidth } = categoriesRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);
  
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p =>
      (activeCategory === 'All' || (p.category && p.category === activeCategory)) &&
      (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'priceLowToHigh':
        filtered.sort((a, b) => (a.onSale ? (a.salePrice || a.price) : a.price) - (b.onSale ? (b.salePrice || b.price) : b.price));
        break;
      case 'priceHighToLow':
        filtered.sort((a, b) => (b.onSale ? (b.salePrice || b.price) : b.price) - (a.onSale ? (a.salePrice || a.price) : a.price));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        break;
      case 'bestSeller':
        filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, activeCategory, searchTerm, sortBy]);

  return (
    <>
      {storeStatus?.allClosed ? (
        <div className="relative">
          <div className="absolute inset-0 bg-transparent-900 bg-opacity-30 z-10 flex items-center justify-center rounded-xl min-h-[400px]">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">We're Taking a Little Break 💛</h3>
              <p className="text-gray-600 mb-4">
                This store is closed for today, but we'll be back soon to serve you with something fresh! 
                Check the opening hours below to see when we're open again.
              </p>
              <Button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                variant="outline"
              >
                View Opening Hours
              </Button>
            </div>
          </div>
          
          <div className="opacity-30 pointer-events-none">
            <OnSaleCard onSaleProducts={onSaleProducts} onAddToCart={onAddToCart} brandColor={store?.brandColor} />
            
            <div className="relative mb-8">
              <div className="flex items-center">
                {showScrollButtons && (
                  <button
                    className="flex-shrink-0 p-2 rounded-full bg-white shadow-md mr-2"
                    onClick={() => categoriesRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                )}
                
                <div
                  ref={categoriesRef}
                  className="flex overflow-x-auto space-x-2 scrollbar-hide flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categories.map(category => (
                    <Button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      variant={activeCategory === category ? 'default' : 'outline'}
                      className="flex-shrink-0"
                      brandColor={activeCategory === category ? store?.brandColor : undefined}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                
                {showScrollButtons && (
                  <button
                    className="flex-shrink-0 p-2 rounded-full bg-white shadow-md ml-2"
                    onClick={() => categoriesRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    brandColor={store?.brandColor}
                    storeId={store.id}
                    isStoreClosed={true}
                  />
                ))
              ) : (
                <div className="lg:col-span-4 text-center py-16">
                  <p className="text-xl text-gray-500">No products found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <OnSaleCard onSaleProducts={onSaleProducts} onAddToCart={onAddToCart} brandColor={store?.brandColor} />

          <div className="relative mb-8">
            <div className="flex items-center">
              {showScrollButtons && (
                <button
                  className="flex-shrink-0 p-2 rounded-full bg-white shadow-md mr-2"
                  onClick={() => categoriesRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              )}
              
              <div
                ref={categoriesRef}
                className="flex overflow-x-auto space-x-2 scrollbar-hide flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map(category => (
                  <Button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    variant={activeCategory === category ? 'default' : 'outline'}
                    className="flex-shrink-0"
                    brandColor={activeCategory === category ? store?.brandColor : undefined}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              
              {showScrollButtons && (
                <button
                  className="flex-shrink-0 p-2 rounded-full bg-white shadow-md ml-2"
                  onClick={() => categoriesRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  brandColor={store?.brandColor}
                  storeId={store.id}
                  isStoreClosed={false}
                />
              ))
            ) : (
              <div className="lg:col-span-4 text-center py-16">
                <p className="text-xl text-gray-500">No products found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};