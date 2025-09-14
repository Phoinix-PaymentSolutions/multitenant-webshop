'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import Image from 'next/image';
import { ShoppingCartIcon, PlusIcon, MinusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Store, Product, CartItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ui/ProductCard';

// ------------------------------------------------
// CategoryTabs component
// ------------------------------------------------
interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs = ({ categories, activeCategory, onSelectCategory }: CategoryTabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-16 z-30">
      <div className="flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button onClick={scrollLeft} variant="ghost" size="sm" className="hidden md:block">
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <div ref={scrollContainerRef} className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex space-x-4 py-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={scrollRight} variant="ghost" size="sm" className="hidden md:block">
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

const NoScrollbar = () => (
  <style jsx>{`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

// ------------------------------------------------
// StoreClient component
// ------------------------------------------------
interface StoreClientProps {
  store: Store;
  products: Product[];
}

export default function StoreClient({ store, products }: StoreClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = 64 + 44; // Main header (h-16) + Category tabs (h-11)
      const buffer = 100; // Small buffer to ensure category is in view
      let currentActiveCategory = '';

      for (const category of Object.keys(categoryRefs.current)) {
        const el = categoryRefs.current[category];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerHeight + buffer) {
            currentActiveCategory = category;
          }
        }
      }
      setActiveCategory(currentActiveCategory);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [products]);

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
      
      const newCartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || null,
        quantity: 1,
        storeId: product.storeId,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        description: product.description,
        category: product.category,
        inventory: product.inventory
      };

      return [...prev, newCartItem];
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

  const groupedProducts = products.reduce((acc, product) => {
    const { category } = product;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categories = Object.keys(groupedProducts);

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    const categoryRef = categoryRefs.current[category];
    if (categoryRef) {
      const headerHeight = 64 + 44; 
      const offsetPosition = categoryRef.offsetTop - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white shadow-sm sticky top-0 z-40"
        style={{ backgroundColor: store.brandColor || '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />
      <NoScrollbar />
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600">Check back soon for new products!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div 
                key={category} 
                ref={(el) => { categoryRefs.current[category] = el; }} 
                className="pt-12 -mt-12"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={() => addToCart(product)} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
       {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-transparent bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Cart ({cartItemCount})</h2>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-800"
                  >
                    ✕
                  </Button>
                </div>
              </div>
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
                            {/* Decrease button with visible icon */}
                            <Button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MinusIcon className="h-3 w-3 text-gray-700" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            {/* Increase button with visible icon */}
                            <Button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <PlusIcon className="h-3 w-3 text-transparent-700" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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