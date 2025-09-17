// src/app/store/page.tsx
import { notFound } from "next/navigation";
import { getStore, getStoreProducts } from "@/lib/database";
import  {StoreClient} from "@/app/store/StoreClient";
import Footer from "@/components/ui/Footer";
import { headers } from "next/headers";

export default async function StorePage() {
const storeId = "demo-store"; // Replace with actual store ID logic

  // Fetch store and products
  const [store, products] = await Promise.all([
    getStore(storeId),
    getStoreProducts(storeId),
  ]);

  if (!store) {
    notFound();
  }

  if (!store.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Store Temporarily Unavailable
          </h1>
          <p className="text-gray-600">
            This store is currently under maintenance. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-green-900">
      <StoreClient store={store} products={products} isLoading={false} />
      <Footer store={store} />
    </main>
  );
}

// Metadata for SEO
export async function generateMetadata() {
  const host = (await headers()).get("host");
  const domain = host?.split(":")[0];

  const store = domain ? await getStore(domain) : null;

  if (!store) {
    return { title: "Store Not Found" };
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
