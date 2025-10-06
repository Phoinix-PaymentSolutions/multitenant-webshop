// src/app/page.tsx
import { adminDb } from '@/lib/firebase-admin';
import { StoreClient } from '@/app/store/StoreClient';
import MarketplaceHome from '@/components/MarketplaceHome';

// Server-side helper functions
async function getStoreBySubdomain(subdomain: string) {
  const snapshot = await adminDb
    .collection('stores')
    .where('subdomain', '==', subdomain)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function getStoreByDomain(domain: string) {
  const cleanDomain = domain.split(':')[0];

  const snapshot = await adminDb
    .collection('stores')
    .where('customDomain', '==', cleanDomain)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

// Root page component
export default async function RootPage() {
  const { headers } = await import('next/headers');
  const headersList = headers();
  const domain = (await headersList).get('host') || '';

  // Main marketplace domains
  const marketplaceDomains = ['maal-tijd.com', 'www.maal-tijd.com', 'localhost:3000'];

  // 1️⃣ Marketplace home for main domains
  if (marketplaceDomains.some(d => domain === d || domain.startsWith(d + ':'))) {
    return <MarketplaceHome />;
  }

  // 2️⃣ Subdomain (e.g., pizzaplace.maaltijd.com)
  if (domain.endsWith('.maal-tijd.com')) {
    const subdomain = domain.split('.')[0]; // Extract first part
    const store = await getStoreBySubdomain(subdomain);

    if (store) return <StoreClient storeId={store.id} />;
  }

  // 3️⃣ Custom domain
  const store = await getStoreByDomain(domain);
  if (store) return <StoreClient storeId={store.id} />;

  // 4️⃣ Domain not found
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
        <p className="text-gray-600">No store found for this address.</p>
      </div>
    </div>
  );
}
