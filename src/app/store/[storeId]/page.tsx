import { StoreClient } from 'src/app/store/StoreClient';

interface StorePageProps {
  params: {
    storeId: string;
  };
}

export default function StorePage({ params }: StorePageProps) {
  console.log('Page received params:', params);
  return <StoreClient storeId={params.storeId} />;
}