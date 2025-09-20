// src/app/store/page.tsx
import { StoreClient } from "@/app/store/StoreClient";

export default function StorePage() {
  const storeId = "demo-store";

  return (
    <main className="min-h-screen bg-green-900">
      <StoreClient storeId={storeId} />
    </main>
  );
}

export async function generateMetadata() {
  return { 
    title: "Demo Store",
    description: "Food delivery store"
  };
}