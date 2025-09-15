// src/app/store/[subdomain]/page.tsx
import { notFound } from 'next/navigation';
import { getStore, getStoreProducts} from '@/lib/database';
import StoreClient from '@/app/store/[subdomain]/StoreClient';
import Footer from '@/components/ui/Footer'; // Changed from 'import type' to 'import'

interface StorePageProps {
  params: {
    subdomain: string;
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const  { subdomain } = params;
  
  // Fetch store and products on the server
  const [store, products] = await Promise.all([
    getStore(subdomain),
    getStoreProducts(subdomain)
  ]);
  
  // If store doesn't exist, show 404
  if (!store) {
    notFound();
  }
  
  // If store is inactive, show maintenance message
  if (!store.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Temporarily Unavailable</h1>
          <p className="text-gray-600">This store is currently under maintenance. Please check back later.</p>
        </div>
      </div>
    );
  }
  
  return (
    <main>
      <StoreClient store={store} products={products} />
      <Footer store={store} />
    </main>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StorePageProps) {
  const store = await getStore(params.subdomain);
  
  if (!store) {
    return {
      title: 'Store Not Found',
    };
  }
  
  return {
    title: store.name,
    description: store.description || `Shop at ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description || `Shop at ${store.name}`,
      images: store.logoUrl ? [store.logoUrl] : [],
    },
  };
}
