import { StoreClient } from 'src/app/store/StoreClient';

interface StorePageProps {
  params: Promise<{ storeId: string }>; // Changed: params is now a Promise
}

export default async function StorePage({ params }: StorePageProps) {
  // Changed: Await the params before using them
  const { storeId } = await params;
  
  console.log('Page received params:', { storeId });
  return <StoreClient storeId={storeId} />;
}