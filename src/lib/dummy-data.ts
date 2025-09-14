// src/lib/dummy-data.ts
// Temporary dummy data for testing (replace with real Firebase data later)

import type { Store, Product } from '@/types';

export const dummyStore: Store = {
  id: 'pizza-palace',
  name: 'Pizza Palace',
  description: 'Authentic Italian pizzas made with love',
  logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center',
  subdomain: 'pizza-palace',
  brandColor: '#dc2626',
  textColor: '#ffffff',
  accentColor: '#fbbf24',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  socialMedia: {
    instagram: 'https://instagram.com/pizzapalace',
    facebook: 'https://facebook.com/pizzapalace'
  },
  contact: {
    email: 'hello@pizzapalace.com',
    phone: '+31 6 12345678',
    address: 'Foodstraat 123, 1234 AB Amsterdam'
  }
};

export const dummyProducts: Product[] = [
  {
    id: '1',
    storeId: 'pizza-palace',
    name: 'Margherita Pizza',
    description: 'Classic pizza with fresh tomatoes, mozzarella, and basil',
    price: 14.50,
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5b6dd8c3e?w=400&h=300&fit=crop',
    category: 'Pizza',
    inventory: 50,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    storeId: 'pizza-palace',
    name: 'Pepperoni Pizza',
    description: 'Spicy pepperoni with mozzarella cheese and tomato sauce',
    price: 16.75,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    category: 'Pizza',
    inventory: 30,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    storeId: 'pizza-palace',
    name: 'Quattro Stagioni',
    description: 'Four seasons pizza with mushrooms, ham, artichokes, and olives',
    price: 19.25,
    imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop',
    category: 'Pizza',
    inventory: 25,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    storeId: 'pizza-palace',
    name: 'Tiramisu',
    description: 'Traditional Italian dessert with coffee and mascarpone',
    price: 7.50,
    imageUrl: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop',
    category: 'Dessert',
    inventory: 15,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    storeId: 'pizza-palace',
    name: 'Coca Cola',
    description: 'Refreshing soft drink - 330ml can',
    price: 2.50,
    imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
    category: 'Drinks',
    inventory: 100,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    storeId: 'pizza-palace',
    name: 'Truffle Pizza',
    description: 'Luxury pizza with black truffle, mushrooms, and parmesan',
    price: 28.00,
    imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=400&h=300&fit=crop',
    category: 'Pizza',
    inventory: 5,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Temporary function to simulate database calls
export async function getDummyStore(subdomain: string): Promise<Store | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (subdomain === 'pizza-palace') {
    return dummyStore;
  }
  
  return null;
}

export async function getDummyProducts(storeId: string): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  if (storeId === 'pizza-palace') {
    return dummyProducts;
  }
  
  return [];
}