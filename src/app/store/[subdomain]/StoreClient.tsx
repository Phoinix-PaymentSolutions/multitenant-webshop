'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { Store, Product, CartItem } from '@/types';

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

// ------------------------------------------------
// Shared UI Components (moved here to fix import errors)
// ------------------------------------------------
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  brandColor?: string;
}

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', disabled = false, brandColor = '#2563EB' }: ButtonProps) => {
  const baseStyle = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    default: `bg-[${brandColor}] text-white hover:bg-[${brandColor}]/80`,
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-900',
  };
  const sizeStyles = {
    default: 'h-10 py-2 px-4',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8',
    icon: 'h-10 w-10',
  };
  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: variant === 'default' ? brandColor : undefined,
        color: variant === 'default' ? 'white' : undefined
      }}
    >
      {children}
    </button>
  );
};

interface ProductCardProps {
  product: UpdatedProduct;
  onAddToCart: () => void;
  brandColor?: string;
}

const ProductCard = ({ product, onAddToCart, brandColor }: ProductCardProps) => (
  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
    <div className="relative w-full aspect-square">
      <img
        src={product.imageUrl || 'https://placehold.co/400x400/E5E7EB/9CA3AF?text=No+Image'}
        alt={product.name}
        className="object-cover w-full h-full"
      />
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-2">{product.category}</p>
      <div className="flex items-center justify-between">
        {/*
          Updated to display both sale price and original price, if applicable.
        */}
        {product.isSale && product.salePrice !== undefined && product.salePrice < product.price ? (
          <div className="flex flex-col">
            <span className="font-bold text-xl text-red-600">€{(product.salePrice).toFixed(2)}</span>
            <span className="text-sm text-gray-500 line-through">€{(product.price).toFixed(2)}</span>
          </div>
        ) : (
          <span className="font-bold text-xl text-gray-900">€{(product.price).toFixed(2)}</span>
        )}
        <Button onClick={onAddToCart} brandColor={brandColor}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  </div>
);

// ------------------------------------------------
// Updated Types
// ------------------------------------------------
interface UpdatedStore extends Store {
  backgroundImageUrl?: string;
}

interface UpdatedProduct extends Product {
  isSale?: boolean;
  salePrice?: number;
}

type SortOption = 'name' | 'price-asc' | 'price-desc';

// ------------------------------------------------
// Custom hook for cart management
// ------------------------------------------------
const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Determine the price to use: sale price if available, otherwise the regular price.
      const priceToUse = (product.isSale && product.salePrice !== undefined && product.salePrice < product.price)
        ? product.salePrice
        : product.price;

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
        price: priceToUse, // Use the determined price
        imageUrl: product.imageUrl || null,
        quantity: 1,
        storeId: product.storeId,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        description: product.description,
        category: product.category,
        inventory: product.inventory,
        isSale: product.isSale,
        salePrice: product.salePrice
      };

      return [...prev, newCartItem];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
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
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [cart]
  );
  
  const cartItemCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemCount
  };
};

// ------------------------------------------------
// Enhanced Search component
// ------------------------------------------------
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClear: () => void;
}

const SearchBar = ({ searchTerm, onSearchChange, onClear }: SearchBarProps) => (
  <div className="relative flex-1">
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input
      type="text"
      placeholder="Search products..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    />
    {searchTerm && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    )}
  </div>
);

// ------------------------------------------------
// Enhanced CategoryTabs component with NoScrollbar styling
// ------------------------------------------------
interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  productCounts: Record<string, number>;
  brandColor?: string;
  textColor?: string;
}

const CategoryTabs = ({ categories, activeCategory, onSelectCategory, productCounts, brandColor, textColor }: CategoryTabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // New useEffect to scroll the active tab into view when the activeCategory changes.
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest'
      });
    }
  }, [activeCategory]);

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
    <>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex-1 flex items-center overflow-x-hidden">
        <div className="hidden sm:flex items-center space-x-1 mr-2">
          <Button onClick={scrollLeft} variant="ghost" size="sm">
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex space-x-4 py-2">
            {categories.map((category) => (
              <button
                key={category}
                ref={activeCategory === category ? activeTabRef : null}
                onClick={() => onSelectCategory(category)}
                className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-1
                  ${activeCategory === category
                    ? ''
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                style={activeCategory === category ? { backgroundColor: brandColor, color: textColor || '#ffffff' } : {}}
              >
                <span>{category}</span>
                <span 
                  className={`text-xs px-1.5 py-0.5 rounded-full`}
                  style={activeCategory === category ? { backgroundColor: brandColor, color: textColor || '#ffffff' } : { backgroundColor: '#D1D5DB' }}
                >
                  {productCounts[category] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-1 ml-2">
          <Button onClick={scrollRight} variant="ghost" size="sm">
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------
// Loading skeleton component
// ------------------------------------------------
const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
  </div>
);

// ------------------------------------------------
// On Sale Card Component
// ------------------------------------------------
interface OnSaleCardProps {
  onSaleProducts: UpdatedProduct[];
  onAddToCart: (product: UpdatedProduct) => void;
  brandColor?: string;
}

const OnSaleCard = ({ onSaleProducts, onAddToCart, brandColor }: OnSaleCardProps) => {
  if (onSaleProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">On Sale!</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {onSaleProducts.slice(0, 4).map((product) => (
          <div key={product.id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={product.imageUrl || 'https://placehold.co/80x80/E5E7EB/9CA3AF?text=Sale'}
                alt={product.name}
                className="object-cover w-full h-full rounded-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-red-600 font-bold">€{(product.salePrice || product.price).toFixed(2)}</span>
                <span className="text-gray-500 text-sm line-through">€{(product.price).toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={() => onAddToCart(product)}
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

// ------------------------------------------------
// Enhanced StoreClient component
// ------------------------------------------------
interface StoreClientProps {
  store: UpdatedStore;
  products: UpdatedProduct[];
  isLoading?: boolean;
}

export default function StoreClient({ store, products, isLoading = false }: StoreClientProps) {
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemCount
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fixes the errors by defining the variables
  const { minimumOrder, deliveryFee, isMinimumMet, finalDeliveryFee } = useMemo(() => {
    const minimumOrder = store.minimumOrder || 0;
    const deliveryFee = store.deliveryFee || 0;
    const isMinimumMet = cartTotal >= minimumOrder;
    const finalDeliveryFee = isMinimumMet ? 0 : deliveryFee;

    return { minimumOrder, deliveryFee, isMinimumMet, finalDeliveryFee };
  }, [cartTotal, store.minimumOrder, store.deliveryFee]);

  // Find the on-sale products
  const onSaleProducts = useMemo(() => {
    // Return an array of all products with a sale price less than the original price
    return products.filter(p => p.isSale && p.salePrice !== undefined && p.salePrice < p.price);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, searchTerm, sortBy]);

  // Grouped products
  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const { category } = product;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, UpdatedProduct[]>);
  }, [filteredProducts]);

  const categories = Object.keys(groupedProducts);
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(groupedProducts).forEach(([category, categoryProducts]) => {
      counts[category] = categoryProducts.length;
    });
    return counts;
  }, [groupedProducts]);
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => setSearchTerm(term), 300),
    []
  );
  
  // This useEffect now uses a debounced scroll handler to prevent constant re-renders.
  useEffect(() => {
    const debouncedHandleScroll = debounce(() => {
      const stickyHeaderHeight = 64;
      const buffer = 100;
      let currentActiveCategory = '';
      
      // Find the category currently in view
      for (const category of categories) {
        const el = categoryRefs.current[category];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= stickyHeaderHeight + buffer) {
            currentActiveCategory = category;
          }
        }
      }
      
      // Only update state if the active category has actually changed to prevent re-renders
      if (currentActiveCategory && currentActiveCategory !== activeCategory) {
        setActiveCategory(currentActiveCategory);
      }
    }, 100); // 100ms debounce time

    window.addEventListener('scroll', debouncedHandleScroll);
    
    // Clean up the event listener
    return () => window.removeEventListener('scroll', debouncedHandleScroll);
  }, [categories, activeCategory]); // isScrollingByClick removed from dependency array

  const handleSelectCategory = (category: string) => {
    const categoryRef = categoryRefs.current[category];
    if (categoryRef) {
      const stickyHeaderHeight = 64; // Height of the sticky header
      const offsetPosition = categoryRef.offsetTop - stickyHeaderHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    // Could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header (now scrolls) */}
      <header 
        className="py-4"
        style={{ backgroundColor: store.brandColor || '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {store.logoUrl && (
                <div className="relative h-10 w-10">
                  <img
                    src={store.logoUrl}
                    alt={`${store.name} logo`}
                    className="object-contain rounded w-full h-full"
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
            {/* Cart Button is now in the sticky header */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {store.backgroundImageUrl && (
        <div
          className="relative h-96 w-full bg-cover bg-center flex items-center justify-center text-center p-8"
          style={{ backgroundImage: `url(${store.backgroundImageUrl})` }}
        >
          {/* Overlay to improve text readability */}
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 text-white">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow-lg">
              Welcome to {store.name}
            </h2>
          </div>
        </div>
      )}
      
      {/* Sticky Category Tabs, Search, and Sort Section */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 py-2">
            {/* Category tabs now on the far left */}
            {categories.length > 0 && (
              <div className="flex-1 overflow-x-hidden">
                <CategoryTabs
                  categories={categories}
                  activeCategory={activeCategory}
                  onSelectCategory={handleSelectCategory}
                  productCounts={productCounts}
                  brandColor={store.brandColor}
                  textColor={store.textColor}
                />
              </div>
            )}
            {/* Search bar is next */}
            <div className="w-full sm:w-1/3 order-1 sm:order-none mb-2 sm:mb-0">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={debouncedSearch}
                onClear={() => setSearchTerm('')}
              />
            </div>
            {/* Sort dropdown is next */}
            <div className="w-full sm:w-auto flex-shrink-0 flex items-center space-x-2 order-2 sm:order-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            {/* Cart Button is now here */}
            <div className="flex-shrink-0">
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
        </div>
      </div>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onSaleProducts.length > 0 && (
          <OnSaleCard
            onSaleProducts={onSaleProducts}
            onAddToCart={handleAddToCart}
            brandColor={store.brandColor}
          />
        )}
        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // No products state
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              {searchTerm ? '🔍' : '📦'}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No products match "${searchTerm}". Try a different search term.`
                : 'Check back soon for new products!'
              }
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="mt-4"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          // Products grid
          <div className="space-y-12">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div 
                key={category} 
                ref={(el) => { categoryRefs.current[category] = el; }} 
                className="pt-12 -mt-12"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                  <span>{category}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {categoryProducts.length} item{categoryProducts.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={() => handleAddToCart(product)} 
                      brandColor={store.brandColor}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Enhanced Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-transparent bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Your Cart ({cartItemCount})
                  </h2>
                  <div className="flex items-center space-x-2">
                    {cart.length > 0 && (
                      <Button
                        onClick={clearCart}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear All
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsCartOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCartIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">Your cart is empty</p>
                    <p className="text-sm text-gray-400 mb-4">Add some delicious items to get started!</p>
                    <Button
                      onClick={() => setIsCartOpen(false)}
                      variant="outline"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="relative">
                          <img
                            src={item.imageUrl || 'https://placehold.co/60x60/E5E7EB/9CA3AF?text=Item'}
                            alt={item.name}
                            className="rounded object-cover w-[60px] h-[60px]"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-gray-600">€{item.price.toFixed(2)} each</p>
                          <p className="text-sm font-medium text-blue-600">
                            Subtotal: €{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              disabled={item.quantity <= 1}
                            >
                              <MinusIcon className="h-3 w-3 text-gray-700" />
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
                              <PlusIcon className="h-3 w-3 text-gray-700" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeFromCart(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 h-24 w-24 p-18"
                        >
                          <TrashIcon className="h-6 w-6" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t p-6 bg-gray-50">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cartItemCount} items):</span>
                      <span>€{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery fee:</span>
                      <span className={isMinimumMet ? 'line-through' : ''}>
                        €{deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    {!isMinimumMet && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        Add €{(minimumOrder - cartTotal).toFixed(2)} more for free delivery!
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>€{(cartTotal + finalDeliveryFee).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={cartTotal < minimumOrder}
                    brandColor={store.brandColor}
                  >
                    {cartTotal < minimumOrder 
                      ? `Minimum order €${minimumOrder.toFixed(2)}`
                      : 'Proceed to Checkout'
                    }
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Free delivery on orders over €{minimumOrder.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
