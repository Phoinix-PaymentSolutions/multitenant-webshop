// src/components/store/InformationPage.tsx
'use client';

import React from 'react';
import { ClockIcon, PackageIcon, HeartHandshakeIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InformationPageProps {
  store: {
    openingHours?: string;
    deliveryInformation?: string;
    returnPolicy?: string;
  };
  onNavigateToStore: () => void;
}

export const InformationPage = ({ store, onNavigateToStore }: InformationPageProps) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Store Information</h1>
        <Button onClick={onNavigateToStore} variant="outline">
          Back to Store
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
            <ClockIcon className="mr-2 h-5 w-5" /> Opening Hours
          </h3>
          <p className="text-gray-600">{store?.openingHours}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
            <PackageIcon className="mr-2 h-5 w-5" /> Delivery Information
          </h3>
          <p className="text-gray-600">{store?.deliveryInformation}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
            <HeartHandshakeIcon className="mr-2 h-5 w-5" /> Return Policy
          </h3>
          <p className="text-gray-600">{store?.returnPolicy}</p>
        </div>
      </div>
    </div>
  );
};