// src/components/store/ContactPage.tsx
'use client';

import React from 'react';
import { MailCheckIcon, PhoneIcon, MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ContactPageProps {
  store: {
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
  };
  onNavigateToStore: () => void;
}

export const ContactPage = ({ store, onNavigateToStore }: ContactPageProps) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
        <Button onClick={onNavigateToStore} variant="outline">
          Back to Store
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <MailCheckIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg">Email</p>
              <a href={`mailto:${store?.contactEmail}`} className="text-blue-600 hover:underline">
                {store?.contactEmail}
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <PhoneIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg">Phone</p>
              <a href={`tel:${store?.contactPhone}`} className="text-blue-600 hover:underline">
                {store?.contactPhone}
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <MapPinIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg">Address</p>
              <p className="text-gray-600">{store?.contactAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};