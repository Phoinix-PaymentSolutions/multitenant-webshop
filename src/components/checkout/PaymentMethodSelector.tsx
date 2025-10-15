// src/components/checkout/PaymentMethodSelector.tsx
'use client';

import React from 'react';

interface PaymentMethodSelectorProps {
  paymentOption: 'card' | 'cash';
  onPaymentOptionChange: (option: 'card' | 'cash') => void;
  deliveryOption: 'delivery' | 'takeaway';
  isServiceCost: boolean;
  sectionNumber: number;
}

export const PaymentMethodSelector = ({
  paymentOption,
  onPaymentOptionChange,
  deliveryOption,
  isServiceCost,
  sectionNumber
}: PaymentMethodSelectorProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">{sectionNumber}. Payment Method</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          paymentOption === 'card'
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-blue-100'
        }`}>
          <input
            type="radio"
            name="paymentOption"
            value="card"
            checked={paymentOption === 'card'}
            onChange={() => onPaymentOptionChange('card')}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <div className="font-semibold text-gray-900">Online Payment (Card/iDeal)</div>
            <div className="text-sm text-gray-500">
              Pay securely now. {isServiceCost ? 'Includes €0.32 service cost.' : ''}
            </div>
          </div>
        </label>

        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          paymentOption === 'cash'
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-blue-100'
        }`}>
          <input
            type="radio"
            name="paymentOption"
            value="cash"
            checked={paymentOption === 'cash'}
            onChange={() => onPaymentOptionChange('cash')}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <div className="font-semibold text-gray-900">
              Cash on {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
            </div>
            <div className="text-sm text-gray-500">Pay when you receive your order.</div>
          </div>
        </label>
      </div>
    </div>
  );
};