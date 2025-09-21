import { StoreClient } from 'src/app/store/StoreClient';

interface StorePageProps {
  params: {
    storeId: string;
  };
}

export default function StorePage({ params }: StorePageProps) {
  return <StoreClient storeId={params.storeId} />;
}