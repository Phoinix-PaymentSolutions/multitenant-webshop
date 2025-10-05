'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronRightIcon, SearchIcon, ShoppingCartIcon, ChevronLeftIcon } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import '@/lib/appcheck';

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

export default function Homepage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const router = useRouter();
  const categoryListRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stores
        const storesSnapshot = await getDocs(collection(db, 'stores'));
        const fetchedStores: Store[] = storesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            category: data.StoreCategory || 'Uncategorized',
            description: data.description || '',
          };
        });

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'adminCategories'));
        const fetchedCategories: Category[] = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
        }));

        console.log('Fetched stores:', fetchedStores);
        console.log('Fetched categories:', fetchedCategories);
        
        // Debug: Log unique store categories
        const uniqueStoreCategories = [...new Set(fetchedStores.map(s => s.category))];
        console.log('Unique store categories:', uniqueStoreCategories);

        // Sort categories alphabetically
        const sortedCategories = fetchedCategories.sort((a, b) => 
          a.name.localeCompare(b.name)
        );

        setStores(fetchedStores);
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter stores
  const filteredStores = useMemo(() => {
    const filtered = stores.filter(store => {
      const matchesCategory = activeCategory === 'All' || store.category === activeCategory;
      const matchesSearch = 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    console.log('Active category:', activeCategory);
    console.log('Filtered stores:', filtered);
    
    return filtered;
  }, [stores, searchTerm, activeCategory]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryListRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      categoryListRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNavigate = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  return (
    <>
      <style>
        {`
          .category-scroll-container::-webkit-scrollbar {
            display: none;
          }
          .category-scroll-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      
      <div className="min-h-screen bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-extrabold text-green-500 mb-4">
              <span className="text-orange-600">Maal</span>-Tijd
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Discover your next favorite meal!
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto w-full">
            <h2 className="text-3xl font-bold mb-8 text-teal-800 text-center">🍽️ Discover Your Favourite Restaurants</h2>
            
            {/* Search bar */}
            <div className="relative mb-6">
              <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by store name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Category filters */}
            <div className="mb-8 flex items-center gap-3">
              <button 
                onClick={() => scrollCategories('left')}
                className="flex-shrink-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 hidden lg:block"
                aria-label="Scroll categories left"
              >
                <ChevronLeftIcon size={20} className="text-teal-700" />
              </button>

              <div 
                ref={categoryListRef} 
                className="flex overflow-x-scroll whitespace-nowrap space-x-3 w-full category-scroll-container py-2 flex-grow"
              >
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-base font-semibold transition-all duration-200 ${
                    activeCategory === 'All'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Shops
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.name)}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-base font-semibold transition-all duration-200 ${
                      activeCategory === category.name
                        ? 'bg-teal-700 text-white shadow-lg shadow-teal-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => scrollCategories('right')}
                className="flex-shrink-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 hidden lg:block"
                aria-label="Scroll categories right"
              >
                <ChevronRightIcon size={20} className="text-teal-700" />
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredStores.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">
                    No shops found matching your criteria. Try another search!
                  </p>
                ) : (
                  filteredStores.map(store => (
                    <div
                      key={store.id}
                      onClick={() => handleNavigate(store.id)}
                      className="group block p-5 bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-500 text-white flex-shrink-0 shadow-lg">
                            <ShoppingCartIcon size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-extrabold text-teal-800 group-hover:text-orange-600 transition-colors">
                                {store.name}
                              </h3>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                                {store.category}
                              </span>
                            </div>
                            <p className="text-md text-gray-600 font-medium">{store.description}</p>
                          </div>
                        </div>
                        <ChevronRightIcon size={24} className="text-orange-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}