// src/app/store/StoreClient.tsx
'use client';

import '@/lib/appcheck';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { HeartHandshakeIcon } from 'lucide-react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { StoreStatusBanner } from '@/components/store/StoreStatusBanner';
import { StorePage } from '@/components/store/StorePage';
import { ContactPage } from '@/components/store/ContactPage';
import { InformationPage } from '@/components/store/InformationPage';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { CheckoutPage } from '@/components/checkout/CheckoutPage';
import { useCart } from '@/lib/hooks/useCart';
import { useStoreStatus } from '@/lib/hooks/useStoreStatus';
import { Store, Product, Extra, OperatingHoursTakeaway, OperatingHoursDelivery } from '@/types';
import {StoreReviewsPage} from "@/components/store/StoreReviewsPage";

type SortOption = 'name' | 'priceLowToHigh' | 'priceHighToLow' | 'newest' | 'bestSeller';

interface UpdatedProduct extends Product {
  onSale?: boolean;
  salePrice?: number;
  salesCount?: number;
}

interface UpdatedStore extends Store {
  isServiceCost?: boolean;
  operatingHoursTakeaway?: OperatingHoursTakeaway;
  operatingHoursDelivery?: OperatingHoursDelivery;
  contactAddress?: string;
  openingHours?: string;
  deliveryInformation?: string;
  returnPolicy?: string;
  bgImageUrl?: string;
}

interface StoreClientProps {
  storeId: string;
}

// Utility function for debouncing
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const StoreClient = ({ storeId }: StoreClientProps) => {
  if (!storeId) {
    console.error('No storeId provided!');
    return <div>Error: No store ID provided</div>;
  }
  
  const [store, setStore] = useState<UpdatedStore | null>(null);
  const [initialProducts, setInitialProducts] = useState<UpdatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'store' | 'contact' | 'info' | 'reviews'>('store');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [isMobile, setIsMobile] = useState(false);

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const storeStatus = useStoreStatus(store?.operatingHoursTakeaway, store?.operatingHoursDelivery);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/store/${storeId}`);
        
        if (!response.ok) {
          setIsLoading(false);
          return;
        }
        
        const { store: storeData, products: productsData } = await response.json();
        
        // Normalize products to ensure extras have IDs
        const normalizedProducts = (productsData || []).map((product: UpdatedProduct) => ({
          ...product,
          extras: (product.extras || []).map((extra: Extra, index: number) => ({
            ...extra,
            id: extra.id || 
                extra.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 
                `${product.id}-extra-${index}`
          }))
        }));
        
        setStore(storeData);
        setInitialProducts(normalizedProducts);
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const handleSearchChange = useCallback(debounce((value: string) => {
    setSearchTerm(value);
  }, 300), []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const { deliveryFee, minimumOrder, isMinimumMet, finalDeliveryFee, freeDeliveryThreshold } = useMemo(() => {
    const minimumOrder = store?.minimumOrder || 0;
    const deliveryFee = store?.deliveryFee || 0;
    const freeDeliveryThreshold = store?.freeDeliveryThreshold || 0;
    const isMinimumMet = cartTotal >= freeDeliveryThreshold;
    const finalDeliveryFee = isMinimumMet ? 0 : deliveryFee;

    return { deliveryFee, minimumOrder, isMinimumMet, finalDeliveryFee, freeDeliveryThreshold };
  }, [cartTotal, store]);

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-orange-50">
        <div className="flex flex-col items-center p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-48 sm:w-64 md:w-80">
              <Image
                src="/logo.png"
                alt="Maal-Tijd Logo"
                width={250}
                height={60}
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            </div>
          </div>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-gray-900">
            Welcome!
          </h1>
          <p className="mt-3 text-xl font-medium text-gray-600">
            Just a moment while we prepare your order experience.
          </p>
          <div className="mt-6 w-8 h-8 border-4 border-t-4 border-gray-200 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 sm:p-10">
        <div className="text-center max-w-lg">
          <HeartHandshakeIcon className="w-16 h-16 text-orange-600 mx-auto mb-6" aria-hidden="true" />
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
            Oops, Store Not Found!
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            It looks like there might be a typo in the link you followed, or the store is temporarily unavailable. No worries!
          </p>
          <a 
            href="https://www.maal-tijd.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-orange-600 hover:bg-orange-700 transition duration-150"
          >
            Go to Maal-Tijd Homepage
          </a>
          <p className="mt-4 text-sm text-gray-500">
            If you received this link from a store, please try contacting them directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans text-gray-900 flex flex-col items-center overflow-x-hidden transition-all duration-300"
      style={{
        backgroundImage: store?.backgroundImageUrl ? `url('${store.backgroundImageUrl}')` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {store?.bgImageUrl && <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm z-0"></div>}

      <StoreHeader
        store={store}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          handleSearchChange(value);
        }}
        onCartOpen={() => setIsCartOpen(true)}
        cartItemCount={cart.length}
      />

      <main className={`container mx-auto px-4 py-8 pb-16 flex-grow transition-all duration-300 ${isCartOpen ? 'filter blur-sm' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900" style={{ color: store?.brandColor }}>
            {currentPage === 'store' ? 'Our Products' :
              currentPage === 'contact' ? 'Contact Us' :
                currentPage === 'info' ? 'Store Information' :
                  'Customer Reviews'}
          </h2>
          <div className="flex items-center space-x-4">
            {currentPage === 'store' && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white px-3 py-2"
                >
                  <option value="name">Name</option>
                  <option value="priceLowToHigh">Price: Low to High</option>
                  <option value="priceHighToLow">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="bestSeller">Best Sellers</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {currentPage === 'store' && (
          <StoreStatusBanner 
            operatingHoursTakeaway={store?.operatingHoursTakeaway}
            operatingHoursDelivery={store?.operatingHoursDelivery}
          />
        )}

        {(() => {
          if (isCheckoutOpen) {
            return (
              <CheckoutPage
                onBackToCart={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }}
                cartTotal={cartTotal}
                finalDeliveryFee={finalDeliveryFee}
                store={store}
                cart={cart}
                clearCart={clearCart}
              />
            );
          }

          switch (currentPage) {
            case 'store':
              return (
                <StorePage
                  store={store}
                  products={initialProducts}
                  onAddToCart={addToCart}
                  searchTerm={searchTerm}
                  sortBy={sortBy}
                  storeStatus={storeStatus}
                />
              );
            case 'contact':
              return <ContactPage store={store} onNavigateToStore={() => setCurrentPage('store')} />;
            case 'info':
              return <InformationPage store={store} onNavigateToStore={() => setCurrentPage('store')} />;
            default:
              return null;
            case 'reviews':
              return <StoreReviewsPage placeId={store?.placeId} storeName={store?.name} />;
          }
        })()}
      </main>

      <StoreFooter
        store={store}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        deliveryFee={deliveryFee}
        finalDeliveryFee={finalDeliveryFee}
        minimumOrder={minimumOrder}
        freeDeliveryThreshold={freeDeliveryThreshold}
        isMinimumMet={isMinimumMet}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        brandColor={store?.brandColor}
        isMobile={isMobile}
        isStoreClosed={storeStatus.allClosed}
      />
    </div>
  );
};