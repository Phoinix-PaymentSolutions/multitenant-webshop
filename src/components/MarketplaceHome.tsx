'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronRightIcon, SearchIcon, ShoppingCartIcon, ChevronLeftIcon, MapPin, X, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import '@/lib/appcheck';
import Image from 'next/image';
import { searchPostalCode, calculateDistance, type PostalCodeResult } from '@/lib/postalCodeService';

interface Store {
  id: string;
  name: string;
  category: string;
  description: string;
  active?: boolean;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  formattedAddress?: string;
  deliveryRadius?: number;
}

interface Category {
  id: string;
  name: string;
}

export default function MarketplaceHome() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Location-based filtering states
  const [postalSearchTerm, setPostalSearchTerm] = useState('');
  const [postalResults, setPostalResults] = useState<PostalCodeResult[]>([]);
  const [selectedPostal, setSelectedPostal] = useState<PostalCodeResult | null>(null);
  const [showPostalDropdown, setShowPostalDropdown] = useState(false);
  const [isSearchingPostal, setIsSearchingPostal] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(false);
  
  const router = useRouter();
  const categoryListRef = useRef<HTMLDivElement>(null);
  const postalInputRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (postalInputRef.current && !postalInputRef.current.contains(event.target as Node)) {
        setShowPostalDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch stores and categories on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const storesSnapshot = await getDocs(collection(db, 'stores'));
        const fetchedStores: Store[] = storesSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              category: data.StoreCategory || 'Uncategorized',
              description: data.description || '',
              active: data.active ?? true,
              postalCode: data.postalCode || '',
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              address: data.address || '',
              formattedAddress: data.formattedAddress || '',
              deliveryRadius: data.deliveryRadius || null,
            };
          })
          .filter(store => store.active === true);

        const categoriesSnapshot = await getDocs(collection(db, 'adminCategories'));
        const fetchedCategories: Category[] = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
        }));

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

  // Debounced postal code search using PDOK API
  const handlePostalSearch = useCallback(async (query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim().length < 3) {
      setPostalResults([]);
      return;
    }

    // Debounce the API call
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingPostal(true);
      try {
        console.log('🔍 Searching for:', query);
        const results = await searchPostalCode(query);
        console.log('📍 Results found:', results);
        setPostalResults(results);
      } catch (error) {
        console.error('❌ Error searching postal codes:', error);
        setPostalResults([]);
      } finally {
        setIsSearchingPostal(false);
      }
    }, 300); // Wait 300ms after user stops typing
  }, []);

  // Handle postal code input change
  const handlePostalInputChange = (value: string) => {
    setPostalSearchTerm(value);
    setShowPostalDropdown(true);
    handlePostalSearch(value);
  };

  // Filter stores with location and other filters
  const filteredStores = useMemo(() => {
    let filtered = stores;

    // Apply location filter if enabled
    if (locationFilterEnabled && selectedPostal) {
      filtered = filtered
        .map(store => {
          if (store.latitude && store.longitude) {
            const distance = calculateDistance(
              selectedPostal.lat, 
              selectedPostal.lng, 
              store.latitude, 
              store.longitude
            );
            
            const storeDeliveryRadius = store.deliveryRadius || maxDistance;
            
            return {
              ...store,
              distance: distance,
              withinDeliveryArea: distance <= storeDeliveryRadius
            };
          }
          return {
            ...store,
            distance: Infinity,
            withinDeliveryArea: false
          };
        })
        .filter(store => store.distance !== Infinity && store.distance <= maxDistance)
        .sort((a, b) => a.distance! - b.distance!);
    }

    // Apply category filter
    filtered = filtered.filter(store => {
      const matchesCategory = activeCategory === 'All' || store.category === activeCategory;
      return matchesCategory;
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [stores, searchTerm, activeCategory, locationFilterEnabled, selectedPostal, maxDistance]);

  const handlePostalSelect = (postal: PostalCodeResult) => {
    setSelectedPostal(postal);
    setPostalSearchTerm(`${postal.code} - ${postal.city}`);
    setShowPostalDropdown(false);
    setLocationFilterEnabled(true);
  };

  const clearLocationFilter = () => {
    setSelectedPostal(null);
    setPostalSearchTerm('');
    setLocationFilterEnabled(false);
    setPostalResults([]);
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-0">
              <div className="w-48 sm:w-64 md:w-80">
                <Image
                  src="/logo.png"
                  alt="Maal-Tijd Logo"
                  width={200}
                  height={50}
                  layout='responsive'
                  priority
                />
              </div> 
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto w-full">
            <h2 className="text-3xl font-bold mb-8 text-teal-800 text-center">🍽️ Discover Your Favourite Restaurants</h2>
            
            {/* Location Filter with Live PDOK API */}
            <div className="mb-6 bg-gradient-to-r from-orange-50 to-teal-50 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-orange-600" />
                <h3 className="text-lg font-bold text-teal-800">Find restaurants near you</h3>
              </div>
              
              <div ref={postalInputRef} className="relative">
                <input
                  type="text"
                  value={postalSearchTerm}
                  onChange={(e) => handlePostalInputChange(e.target.value)}
                  onFocus={() => setShowPostalDropdown(true)}
                  placeholder="Enter postal code or city (e.g. 9733 or Groningen)"
                  className="w-full pl-4 pr-10 py-3 rounded-lg border-2 border-orange-300 focus:border-orange-500 focus:outline-none transition-all"
                />
                
                {/* Loading spinner or clear button */}
                {isSearchingPostal ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="animate-spin text-orange-500" />
                  </div>
                ) : selectedPostal && locationFilterEnabled ? (
                  <button
                    onClick={clearLocationFilter}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                ) : null}

                {/* Postal Code Dropdown with Live Results */}
                {showPostalDropdown && postalResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-orange-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {postalResults.map((postal, index) => (
                      <button
                        key={`${postal.code}-${index}`}
                        onClick={() => handlePostalSelect(postal)}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-3 border-b last:border-b-0"
                      >
                        <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                        <div className="flex-grow">
                          <div className="font-semibold text-gray-800">{postal.code}</div>
                          <div className="text-sm text-gray-500">
                            {postal.city}
                            {postal.municipality && postal.municipality !== postal.city && (
                              <span className="text-gray-400"> • {postal.municipality}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Show message when searching but no results */}
                {showPostalDropdown && !isSearchingPostal && postalSearchTerm.length >= 3 && postalResults.length === 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-orange-200 rounded-lg shadow-xl p-4">
                    <p className="text-sm text-gray-500 text-center">
                      No postal codes found. Try a different search.
                    </p>
                  </div>
                )}
              </div>

              {/* Distance Slider */}
              {locationFilterEnabled && selectedPostal && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Search radius: {maxDistance} km
                    </label>
                    <span className="text-xs text-gray-500">
                      Showing {filteredStores.length} restaurant{filteredStores.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>25 km</span>
                  </div>
                </div>
              )}
            </div>

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
                    {locationFilterEnabled 
                      ? `No shops found within ${maxDistance} km of ${selectedPostal?.city}. Try increasing the search radius!`
                      : 'No shops found matching your criteria. Try another search!'
                    }
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-xl font-extrabold text-teal-800 group-hover:text-orange-600 transition-colors">
                                {store.name}
                              </h3>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                                {store.category}
                              </span>
                              {locationFilterEnabled && selectedPostal && store.latitude && store.longitude && (
                                <>
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-700 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {calculateDistance(selectedPostal.lat, selectedPostal.lng, store.latitude, store.longitude).toFixed(1)} km
                                  </span>
                                  {/* Show delivery availability badge */}
                                  {(store as any).deliveryAvailable ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                      🚚 Delivery available
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                                      🥡 Takeaway only
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <p className="text-md text-gray-600 font-medium">{store.description}</p>
                            {(store.formattedAddress || store.address) && (
                              <p className="text-sm text-gray-500 mt-1">
                                {store.formattedAddress || store.address}
                              </p>
                            )}
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