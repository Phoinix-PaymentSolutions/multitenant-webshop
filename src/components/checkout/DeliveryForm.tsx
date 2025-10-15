// src/components/checkout/DeliveryForm.tsx
'use client';

import React from 'react';

interface DeliveryFormProps {
  formData: {
    address: string;
    houseNumber: string;
    postalCode: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  isCheckingDelivery: boolean;
  deliveryAvailable: boolean | null;
  deliveryError: string | null;
  deliveryInfo?: {
    deliveryFee: number;
    minimumOrder: number;
    estimatedTime: string;
    freeDeliveryThreshold?: number;
  } | null;
  sectionNumber: number;
}

export const DeliveryForm = ({
  formData,
  onFormDataChange,
  isCheckingDelivery,
  deliveryAvailable,
  deliveryError,
  deliveryInfo,
  sectionNumber
}: DeliveryFormProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">{sectionNumber}. Delivery Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Street Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={(e) => onFormDataChange('address', e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
        </div>

        <div>
          <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700">
            House Number
          </label>
          <input
            type="text"
            id="houseNumber"
            name="houseNumber"
            value={formData.houseNumber}
            onChange={(e) => onFormDataChange('houseNumber', e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Postal Code
            {isCheckingDelivery && <span className="ml-2 text-blue-500">Checking...</span>}
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={(e) => onFormDataChange('postalCode', e.target.value)}
            required
            placeholder="1234AB"
            className={`mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 transition duration-150 ${
              deliveryAvailable === false 
                ? 'ring-2 ring-red-300' 
                : deliveryAvailable === true 
                  ? 'ring-2 ring-green-300'
                  : 'focus:ring-blue-500'
            }`}
          />
          
          {deliveryError && (
            <p className="mt-1 text-sm text-red-600">{deliveryError}</p>
          )}
          
          {deliveryAvailable === true && deliveryInfo && (
            <div className="mt-1 text-sm text-green-600">
              <p>✓ Delivery available!</p>
              <p>Estimated time: {deliveryInfo.estimatedTime}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};