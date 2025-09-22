'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronRightIcon, PackageIcon, SearchIcon } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import '@/lib/appcheck'; // This line initializes App Check

// Define types for the data
interface Store {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

// Data fetching function for stores
async function fetchAllStores(): Promise<Store[]> {
  try {
    const storesCollection = collection(db, 'stores');
    const querySnapshot = await getDocs(storesCollection);
    const stores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name as string,
      category: doc.data().category as string,
      description: doc.data().description as string,
    }));
    return stores;
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return [];
  }
}

// Data fetching function for categories
async function fetchCategories(): Promise<Category[]> {
  try {
    const categoriesCollection = collection(db, 'adminCollections');
    const querySnapshot = await getDocs(categoriesCollection);
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name as string,
    }));
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default function Homepage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function getInitialData() {
      try {
        const [fetchedStores, fetchedCategories] = await Promise.all([
          fetchAllStores(),
          fetchCategories(),
        ]);
        setStores(fetchedStores);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    getInitialData();
  }, []);

  // Filter stores based on search term and category
  const filteredStores = useMemo(() => {
    return stores.filter(store =>
      (activeCategory === 'All' || store.category === activeCategory) &&
      (store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       store.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stores, searchTerm, activeCategory]);

  // Handle navigation (simulated for this example)
  const handleNavigate = (storeId: string) => {
    // In a real Next.js app, this would be a client-side navigation or window.location redirect
    // window.location.href = `https://${storeId}.yourdomain.com`;
    // For this demo, we'll show a message
    alert(`Attempting to navigate to store with ID: ${storeId}`);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Hero section */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Multi-Tenant
            <span className="text-blue-600"> Webshop</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            A powerful platform for creating beautiful, custom online stores. 
            Each client gets their own subdomain and fully customizable storefront.
          </p>
        </div>

        {/* Dynamic List View with Search and Categories */}
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-6xl mx-auto w-full">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 text-center">🚀 Discover Webshops</h2>
          
          {/* Search bar */}
          <div className="relative mb-6">
            <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === 'All'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === category.name
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredStores.length === 0 ? (
                <p className="text-center text-gray-500">No stores found matching your criteria.</p>
              ) : (
                filteredStores.map(store => (
                  <div
                    key={store.id}
                    onClick={() => handleNavigate(store.id)}
                    className="block p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-indigo-500 text-white flex-shrink-0">
                          <PackageIcon size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-0 text-gray-900">{store.name}</h3>
                          <p className="text-sm text-gray-500">{store.description}</p>
                        </div>
                      </div>
                      <ChevronRightIcon size={20} className="text-gray-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
