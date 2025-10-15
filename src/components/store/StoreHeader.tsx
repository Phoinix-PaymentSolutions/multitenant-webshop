// src/components/store/StoreHeader.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { SearchIcon, ShoppingCartIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StoreHeaderProps {
  store: {
    name: string;
    description?: string;
    logoUrl?: string;
    brandColor?: string;
    placeId?: string; // For showing/hiding reviews tab
  };
  currentPage: 'store' | 'contact' | 'info' | 'reviews';
  onPageChange: (page: 'store' | 'contact' | 'info' | 'reviews') => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCartOpen: () => void;
  cartItemCount: number;
}

export const StoreHeader = ({
  store,
  currentPage,
  onPageChange,
  searchTerm,
  onSearchChange,
  onCartOpen,
  cartItemCount
}: StoreHeaderProps) => {
  return (
    <header className="w-full bg-white shadow-md z-10 sticky top-0">
      <div className="container mx-auto px-4 py-4 md:flex md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12">
            <Image
              src={store?.logoUrl || "https://placehold.co/100x100/E5E7EB/9CA3AF?text=Logo"}
              alt={`${store?.name} Logo`}
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: store?.brandColor }}>
              {store?.name}
            </h1>
            <p className="text-sm text-gray-500">{store?.description}</p>
          </div>
        </div>
        
        <nav className="hidden md:flex space-x-6 text-lg font-medium">
          <a 
            onClick={() => onPageChange('store')} 
            className={`cursor-pointer transition-colors hover:text-gray-600 ${
              currentPage === 'store' ? 'text-gray-900 font-semibold' : 'text-gray-500'
            }`}
          >
            Store
          </a>
          <a 
            onClick={() => onPageChange('contact')} 
            className={`cursor-pointer transition-colors hover:text-gray-600 ${
              currentPage === 'contact' ? 'text-gray-900 font-semibold' : 'text-gray-500'
            }`}
          >
            Contact
          </a>
          <a 
            onClick={() => onPageChange('info')} 
            className={`cursor-pointer transition-colors hover:text-gray-600 ${
              currentPage === 'info' ? 'text-gray-900 font-semibold' : 'text-gray-500'
            }`}
          >
            Info
          </a>
          {/* Only show Reviews tab if store has placeId configured */}
          {store?.placeId && (
            <a 
              onClick={() => onPageChange('reviews')} 
              className={`cursor-pointer transition-colors hover:text-gray-600 ${
                currentPage === 'reviews' ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              Reviews
            </a>
          )}
        </nav>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button size="icon" onClick={onCartOpen} brandColor={store?.brandColor}>
            <ShoppingCartIcon className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <nav className="flex justify-around py-2">
          <a 
            onClick={() => onPageChange('store')} 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentPage === 'store' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
            }`}
          >
            Store
          </a>
          <a 
            onClick={() => onPageChange('contact')} 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentPage === 'contact' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
            }`}
          >
            Contact
          </a>
          <a 
            onClick={() => onPageChange('info')} 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentPage === 'info' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
            }`}
          >
            Info
          </a>
          {store?.placeId && (
            <a 
              onClick={() => onPageChange('reviews')} 
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentPage === 'reviews' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
              }`}
            >
              Reviews
            </a>
          )}
        </nav>
      </div>
    </header>
  );
};