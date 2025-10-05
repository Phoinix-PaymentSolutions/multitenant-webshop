// src/app/page.tsx
import { headers } from 'next/headers';
import { StoreClient } from 'src/app/store/StoreClient';
import { getStoreByDomain, getStoreBySubdomain } from '@/lib/database';
import MarketplaceHome from '@/components/MarketplaceHome';

export default async function RootPage() {
  const headersList = await headers();
  const domain = headersList.get('host') || '';
  
  // Your main marketplace domain(s)
  const marketplaceDomains = ['maal-tijd.com', 'www.maal-tijd.com', 'localhost:3000'];
  
  // If it's your marketplace domain, show marketplace
  if (marketplaceDomains.some(d => domain === d || domain.startsWith(d + ':'))) {
    return <MarketplaceHome />;
  }
  
  // Check if it's a subdomain (e.g., pizzaplace.maaltijd.com)
  if (domain.includes('.maal-tijd.com')) {
    const subdomain = domain.split('.')[0]; // Extract "pizzaplace"
    const store = await getStoreBySubdomain(subdomain);
    
    if (store) {
      return <StoreClient storeId={store.id} />;
    }
  }
  
  // Check if it's a custom domain
  const store = await getStoreByDomain(domain);
  
  if (store) {
    return <StoreClient storeId={store.id} />;
  }
  
  // Domain not configured
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
        <p className="text-gray-600">No store found for this address.</p>
      </div>
    </div>
  );
}