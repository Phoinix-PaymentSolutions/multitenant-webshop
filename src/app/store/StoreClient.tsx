'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingCartIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  SearchIcon,
  XIcon,
  MailCheckIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  PackageIcon,
  HeartHandshakeIcon,
} from 'lucide-react';
import type { Store, Product, CartItem as ImportedCartItem } from '@/types';
import Image from 'next/image';
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/lib/firebase';

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
  brandColor?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({ children, onClick, variant = 'default', size = 'default', className, brandColor, disabled, type = 'button' }: ButtonProps) => {
  // Added 'relative' to the base classes to fix the badge positioning
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative';
  const sizeClasses = {
    default: 'h-10 px-4 py-2 text-base',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8 text-lg',
    icon: 'h-10 w-10',
  }[size];

  const brandColorStyle = brandColor ? { backgroundColor: brandColor, color: '#FFFFFF', borderColor: brandColor } : {};
  const hoverStyle = brandColor ? { filter: 'brightness(90%)' } : {};

  const variantClasses = {
    default: 'text-white',
    outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-100',
    ghost: 'hover:bg-gray-100 text-gray-900',
  }[variant];

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={variant === 'default' ? brandColorStyle : {}}
      onMouseOver={e => e.currentTarget.style.filter = 'brightness(90%)'}
      onMouseOut={e => e.currentTarget.style.filter = 'none'}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ children, className }: BadgeProps) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 ${className}`}>
      {children}
    </span>
  );
};

// ------------------------------------------------
// Checkout Page
// ------------------------------------------------
interface CheckoutPageProps {
  onBackToCart: () => void;
  cartTotal: number;
  finalDeliveryFee: number;
  store: UpdatedStore;
  cart: UpdatedCartItem[];
  clearCart: () => void;
}

interface UpdatedCartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface UpdatedStore {
  id: string;
  name: string;
  ownerId: string;
  brandColor?: string;
}

interface UpdatedProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string | null; // This is the old line
  // Change it to this:
  category: string;
}

const CheckoutPage = ({ onBackToCart, cartTotal, finalDeliveryFee, store, cart, clearCart }: CheckoutPageProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    phoneNumber: '',
    email: '',
    notes: '',
    houseNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

    // Build the payload for your Firebase function
    const paymentData = {
      userId: store.ownerId,
      amount: (cartTotal + finalDeliveryFee).toFixed(2),
      currency: 'EUR',
      description: `Order from ${store.name} - ${cart.length} items`,
      method: 'ideal', // could be dynamic later
      customerInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        address: formData.address,
        postalCode: formData.postalCode,
        houseNumber: formData.houseNumber,
      },
      metadata: {
        orderId: `order_${Date.now()}`,
        storeId: store.id,
        storeName: store.name,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: `${formData.address}, ${formData.postalCode}`,
        customerNotes: formData.notes,
        orderTotal: cartTotal,
        deliveryFee: finalDeliveryFee,
        totalAmount: cartTotal + finalDeliveryFee,
      },
      domain: window.location.hostname,
      redirectUrl: `${window.location.origin}/order-success`,
      webhookUrl: `${window.location.origin}/api/webhook/mollie`,
    };
interface MolliePaymentPayload {
  payment: {
    id: string;
    status: string;
    amount: {
      currency: string;
      value: string;
    };
    description: string;
    metadata: {
      orderId: string;
      storeId: string;
      storeName: string;
    };
    _links: {
      checkout: {
        href: string;
      };
    };
  };
}

    try {
      const functions = getFunctions(app); // use your initialized Firebase app if needed
      const createMollieOnlinePayment = httpsCallable<typeof paymentData, MolliePaymentPayload>(functions, "createMollieOnlinePayment");

      const result = await createMollieOnlinePayment(paymentData);
      console.log("Payment created:", result);

      // Redirect user to Mollie checkout
      const checkoutUrl = result.data?.payment?._links?.checkout?.href;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      // Fallback: clear cart and go back
      clearCart();
      onBackToCart();
    } catch (error) {
      console.error("Error during checkout:", error);
      // You could show a UI error message here
    }
  };


  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 md:p-12">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-10 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <Button onClick={onBackToCart} variant="ghost" size="sm">
            Back to Cart
          </Button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </div>

{/* Delivery Information */}
<div>
  <h3 className="text-xl font-semibold mb-3">Delivery Information</h3>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* Street Address full width */}
    <div className="sm:col-span-2">
      <label htmlFor="address" className="block text-sm font-medium text-gray-700">Street Address</label>
      <input
        type="text"
        id="address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        required
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    {/* House Number */}
    <div>
      <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700">House Number</label>
      <input
        type="text"
        id="houseNumber"
        name="houseNumber"
        value={formData.houseNumber}
        onChange={handleChange}
        required
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    {/* Postal Code */}
    <div>
      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code</label>
      <input
        type="text"
        id="postalCode"
        name="postalCode"
        value={formData.postalCode}
        onChange={handleChange}
        required
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  </div>
</div>
          

          {/* Additional Notes */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Notes</h3>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Delivery Notes (optional)</label>
              <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>€{(cartTotal + finalDeliveryFee).toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" brandColor={store.brandColor} size="lg" className="w-full">
            Place Order
          </Button>
        </form>
      </div>
    </div>
  );
};

// ------------------------------------------------
// Store Pages
// ------------------------------------------------
interface StorePageProps {
  store: UpdatedStore;
  products: UpdatedProduct[];
  onAddToCart: (product: UpdatedProduct) => void;
  searchTerm: string;
  sortBy: SortOption;
}

interface ProductCardProps {
  product: UpdatedProduct;
  onAddToCart: (product: UpdatedProduct) => void;
  brandColor?: string;
}

const ProductCard = ({ product, onAddToCart, brandColor }: ProductCardProps) => (
  <div className="group relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transform transition-all hover:scale-[1.02]">
    <div className="relative w-full h-48 sm:h-64 bg-gray-100">
      <Image
        src={product.imageUrl || 'https://placehold.co/400x400/E5E7EB/9CA3AF?text=Product'}
        alt={product.name}
        width={400}
        height={400}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      {product.onSale && (
        <Badge className="absolute top-3 left-3 bg-red-500 text-white">Sale</Badge>
      )}
    </div>
    <div className="p-4 flex flex-col justify-between">
      <h3 className="text-xl font-bold text-gray-900 truncate">{product.name}</h3>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
      <div className="flex items-center justify-between mt-3">
        {product.onSale ? (
          <div className="flex items-center">
            <span className="text-xl font-bold text-red-600">€{(product.salePrice || product.price).toFixed(2)}</span>
            <span className="text-sm text-gray-500 line-through ml-2">€{product.price.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-xl font-bold text-gray-900">€{product.price.toFixed(2)}</span>
        )}
        <Button onClick={() => onAddToCart(product)} brandColor={brandColor} size="sm">
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
);

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
            <div className="w-20 h-20 flex-shrink-0 relative">
              <Image
                src={product.imageUrl || 'https://placehold.co/80x80/E5E7EB/9CA3AF?text=Sale'}
                alt={product.name}
                width={80}
                height={80}
                className="absolute inset-0 object-cover rounded-md"
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

const StorePage = ({ store, products, onAddToCart, searchTerm, sortBy }: StorePageProps) => {
  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [products]);

  const onSaleProducts = useMemo(() => products.filter(p => p.onSale), [products]);

  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = useMemo(() => {
   const filtered = products.filter(p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort the products based on the selected option
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
        // Use a safe guard for createdAt being undefined
        filtered.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        break;
      case 'bestSeller':
        // Assuming products have a `salesCount` property
        filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, activeCategory, searchTerm, sortBy]);

  return (
    <>
      <OnSaleCard onSaleProducts={onSaleProducts} onAddToCart={onAddToCart} brandColor={store?.brandColor} />

      {/* Categories */}
      <div className="mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {categories.map(category => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? 'default' : 'outline'}
            className="mr-2"
            brandColor={activeCategory === category ? store?.brandColor : undefined}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              brandColor={store?.brandColor}
            />
          ))
        ) : (
          <div className="lg:col-span-4 text-center py-16">
            <p className="text-xl text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    </>
  );
};

interface ReviewsPageProps {
  onNavigateToStore: () => void;
}

const ReviewsPage = ({ onNavigateToStore }: ReviewsPageProps) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Customer Reviews</h1>
        <Button onClick={onNavigateToStore} variant="outline">
          Back to Store
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center mb-2">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
            <p className="font-semibold text-lg">Amazing products and fast delivery!</p>
            <p className="text-gray-600 mt-1">
              
            </p>
            <p className="text-sm text-gray-400 mt-2">- Sarah J.</p>
          </div>
          <div className="border-b pb-4">
            <div className="flex items-center mb-2">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-gray-300 fill-current" />
              <StarIcon className="h-5 w-5 text-gray-300 fill-current" />
            </div>
            <p className="font-semibold text-lg">Good quality, but a bit slow</p>
            <p className="text-gray-600 mt-1">
             
            </p>
            <p className="text-sm text-gray-400 mt-2">- David L.</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
            <p className="font-semibold text-lg">My go-to store now!</p>
            <p className="text-gray-600 mt-1">
            
            </p>
            <p className="text-sm text-gray-400 mt-2">- Emily R.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContactPageProps {
  store: UpdatedStore;
  onNavigateToStore: () => void;
}

const ContactPage = ({ store, onNavigateToStore }: ContactPageProps) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
        <Button onClick={onNavigateToStore} variant="outline">
          Back to Store
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <MailCheckIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg">Email</p>
              <a href={`mailto:${store?.contactEmail}`} className="text-blue-600 hover:underline">{store?.contactEmail}</a>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <PhoneIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg">Phone</p>
              <a href={`tel:${store?.contactPhone}`} className="text-blue-600 hover:underline">{store?.contactPhone}</a>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <MapPinIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg">Address</p>
              <p className="text-gray-600">{store?.contactAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InformationPageProps {
  store: UpdatedStore;
  onNavigateToStore: () => void;
}

const InformationPage = ({ store, onNavigateToStore }: InformationPageProps) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Store Information</h1>
        <Button onClick={onNavigateToStore} variant="outline">
          Back to Store
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center"><ClockIcon className="mr-2 h-5 w-5" /> Opening Hours</h3>
          <p className="text-gray-600">{store?.openingHours}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center"><PackageIcon className="mr-2 h-5 w-5" /> Delivery Information</h3>
          <p className="text-gray-600">{store?.deliveryInformation}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center"><HeartHandshakeIcon className="mr-2 h-5 w-5" /> Return Policy</h3>
          <p className="text-gray-600">{store?.returnPolicy}</p>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------
// Main Component
// ------------------------------------------------
type SortOption = 'name' | 'priceLowToHigh' | 'priceHighToLow' | 'newest' | 'bestSeller';

// Define a new type that extends the original Product type with optional properties
interface UpdatedProduct extends Product {
  onSale?: boolean;
  salePrice?: number;
  salesCount?: number;
}

// Define a new type that extends the original CartItem with totalPrice and aligns with UpdatedProduct
interface UpdatedCartItem extends ImportedCartItem {
  totalPrice: number;
}

interface UpdatedStore extends Store {
  brandColor?: string;
  contactAddress?: string;
  openingHours?: string;
  deliveryInformation?: string;
  returnPolicy?: string;
  bgImageUrl?: string; // New property for background image
}

interface StoreClientProps {
  store: UpdatedStore;
  products: UpdatedProduct[];
  isLoading: boolean;
}

export const StoreClient = ({ store, products: initialProducts, isLoading }: StoreClientProps) => {
  const [cart, setCart] = useState<UpdatedCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'store' | 'contact' | 'info' | 'reviews'>('store');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const addToCart = useCallback((product: UpdatedProduct) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: item.price * (item.quantity + 1) }
            : item
        );
      } else {
        // Ensure new item created is compatible with UpdatedCartItem
        const newItem: UpdatedCartItem = {
          ...product,
          quantity: 1,
          totalPrice: product.price
        };
        return [...prevCart, newItem];
      }
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
          : item
      );
    });
  }, []);

  const { cartTotal, deliveryFee, minimumOrder, isMinimumMet, finalDeliveryFee, freeDeliveryThreshold } = useMemo(() => {
    const minimumOrder = store?.minimumOrder || 0;
    const deliveryFee = store?.deliveryFee || 0;
    const freeDeliveryThreshold = store?.freeDeliveryThreshold || 0;
    const cartTotal = cart.reduce((total, item) => total + item.totalPrice, 0);
    const isMinimumMet = cartTotal >= freeDeliveryThreshold;
    const finalDeliveryFee = isMinimumMet ? 0 : deliveryFee;
    

    return { cartTotal, deliveryFee, minimumOrder, isMinimumMet, finalDeliveryFee, freeDeliveryThreshold };
  }, [cart, store]);

  // Handle a new checkout function that opens the checkout form
  const handleCheckout = () => {
    setIsCheckoutOpen(true);
    setIsCartOpen(false); // Close the cart sidebar
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white p-8 rounded-lg shadow-lg">
        <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
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
      {/* Semi-transparent overlay for readability */}
      {store?.bgImageUrl && <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm z-0"></div>}

      {/* Header */}
      <header className="w-full bg-white shadow-md z-10 sticky top-0">
        <div className="container mx-auto px-4 py-4 md:flex md:items-center md:justify-between">
          {/* Logo and store info */}
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
              <h1 className="text-2xl font-bold" style={{ color: store?.brandColor }}>{store?.name}</h1>
              <p className="text-sm text-gray-500">{store?.description}</p>
            </div>
          </div>
          {/* Main Navigation */}
          <nav className="hidden md:flex space-x-6 text-lg font-medium">
            <a onClick={() => setCurrentPage('store')} className={`cursor-pointer transition-colors hover:text-gray-600 ${currentPage === 'store' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>Store</a>
            <a onClick={() => setCurrentPage('contact')} className={`cursor-pointer transition-colors hover:text-gray-600 ${currentPage === 'contact' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>Contact</a>
            <a onClick={() => setCurrentPage('info')} className={`cursor-pointer transition-colors hover:text-gray-600 ${currentPage === 'info' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>Info</a>
            <a onClick={() => setCurrentPage('reviews')} className={`cursor-pointer transition-colors hover:text-gray-600 ${currentPage === 'reviews' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>Reviews</a>
          </nav>
          {/* Search and Cart */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <Button size="icon" onClick={() => setIsCartOpen(true)} brandColor={store?.brandColor}>
              <ShoppingCartIcon className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`container mx-auto px-4 py-8 flex-grow transition-all duration-300 ${isCartOpen ? 'filter blur-sm' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900" style={{ color: store?.brandColor }}>
            {currentPage === 'store' ? 'Our Products' :
              currentPage === 'contact' ? 'Contact Us' :
                currentPage === 'info' ? 'Store Information' :
                  'Customer Reviews'}
          </h2>
          <div className="flex items-center space-x-4">
            {currentPage === 'store' && (
              <div className="filled-white flex items-center space-x-2">
                <span className="text-gray-600 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                  products={products}
                  onAddToCart={addToCart}
                  searchTerm={searchTerm}
                  sortBy={sortBy}
                />
              );
            case 'contact':
              return <ContactPage store={store} onNavigateToStore={() => setCurrentPage('store')} />;
            case 'info':
              return <InformationPage store={store} onNavigateToStore={() => setCurrentPage('store')} />;
            case 'reviews':
              return <ReviewsPage onNavigateToStore={() => setCurrentPage('store')} />;
            default:
              return null;
          }
        })()}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white shadow-inner mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <div className="flex justify-center space-x-6 mb-4">
            <a onClick={() => setCurrentPage('store')} className="cursor-pointer hover:text-gray-900">Store</a>
            <a onClick={() => setCurrentPage('contact')} className="cursor-pointer hover:text-gray-900">Contact</a>
            <a onClick={() => setCurrentPage('info')} className="cursor-pointer hover:text-gray-900">Info</a>
            <a onClick={() => setCurrentPage('reviews')} className="cursor-pointer hover:text-gray-900">Reviews</a>
          </div>
          <p>© {new Date().getFullYear()} {store?.name}. All rights reserved.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-transparent-opacity-70 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className={`fixed inset-y-0 right-0 max-w-full flex ${isMobile ? 'w-full' : 'md:w-1/3'}`}>
            <div className="w-full bg-white shadow-xl flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <Button size="icon" variant="ghost" onClick={() => setIsCartOpen(false)}>
                  <XIcon className="h-6 w-6" />
                </Button>
              </div>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 flex-grow">
                  <ShoppingCartIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500">Your cart is empty.</p>
                </div>
              ) : (
                <div className="flex-grow p-6 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={item.imageUrl || 'https://placehold.co/80x80/E5E7EB/9CA3AF?text=Item'}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">€{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {cart.length > 0 && (
                <div className="p-6 border-t space-y-4">
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
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>€{(cartTotal + finalDeliveryFee).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={cartTotal < minimumOrder}
                    brandColor={store?.brandColor}
                    onClick={handleCheckout}
                  >
                    {cartTotal < minimumOrder
                      ? `Minimum order €${minimumOrder.toFixed(2)}`
                      : 'Proceed to Checkout'
                    }
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Free delivery on orders over €{freeDeliveryThreshold.toFixed(2)}!
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

