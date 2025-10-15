// src/components/checkout/OrderTypeSelector.tsx
'use client';

import React from 'react';
import { canPlaceOrder } from '@/lib/storeHoursValidator';
import { OperatingHoursTakeaway, OperatingHoursDelivery } from '@/types';

interface OrderTypeSelectorProps {
  deliveryOption: 'delivery' | 'takeaway';
  onDeliveryOptionChange: (option: 'delivery' | 'takeaway') => void;
  operatingHoursTakeaway?: OperatingHoursTakeaway;
  operatingHoursDelivery?: OperatingHoursDelivery;
  deliveryInfo?: {
    deliveryFee: number;
    minimumOrder: number;
    estimatedTime: string;
    freeDeliveryThreshold?: number;
  } | null;
  currentDeliveryFee: number;
  cartTotal: number;
}

export const OrderTypeSelector = ({
  deliveryOption,
  onDeliveryOptionChange,
  operatingHoursTakeaway,
  operatingHoursDelivery,
  deliveryInfo,
  currentDeliveryFee,
  cartTotal
}: OrderTypeSelectorProps) => {
  const deliveryStatus = canPlaceOrder('delivery', operatingHoursTakeaway, operatingHoursDelivery);
  const takeawayStatus = canPlaceOrder('takeaway', operatingHoursTakeaway, operatingHoursDelivery);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">1. Order Type</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Delivery Option */}
        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          deliveryOption === 'delivery' 
            ? 'border-blue-600 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-100'
        } ${!deliveryStatus.canOrder ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="deliveryOption"
            value="delivery"
            checked={deliveryOption === 'delivery'}
            onChange={(e) => {
              if (deliveryStatus.canOrder) {
                onDeliveryOptionChange(e.target.value as 'delivery' | 'takeaway');
              }
            }}
            disabled={!deliveryStatus.canOrder}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
          />
          <div>
            <div className="font-semibold text-gray-900">Delivery</div>
            <div className="text-sm text-gray-500">
              {!deliveryStatus.canOrder ? (
                <span className="text-red-600">Currently Closed</span>
              ) : deliveryInfo ? (
                <>
                  {currentDeliveryFee === 0 ? 'Free' : `€${currentDeliveryFee.toFixed(2)}`} - {deliveryInfo.estimatedTime}
                  {deliveryInfo.freeDeliveryThreshold && cartTotal < deliveryInfo.freeDeliveryThreshold && (
                    <div className="text-xs text-green-600 mt-1">
                      Free delivery over €{deliveryInfo.freeDeliveryThreshold.toFixed(2)}
                    </div>
                  )}
                </>
              ) : (
                'Enter postal code to check'
              )}
            </div>
          </div>
        </label>
        
        {/* Takeaway Option */}
        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          deliveryOption === 'takeaway' 
            ? 'border-blue-600 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-100'
        } ${!takeawayStatus.canOrder ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="deliveryOption"
            value="takeaway"
            checked={deliveryOption === 'takeaway'}
            onChange={(e) => {
              if (takeawayStatus.canOrder) {
                onDeliveryOptionChange(e.target.value as 'delivery' | 'takeaway');
              }
            }}
            disabled={!takeawayStatus.canOrder}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
          />
          <div>
            <div className="font-semibold text-gray-900">Takeaway</div>
            <div className="text-sm text-gray-500">
              {!takeawayStatus.canOrder ? (
                <span className="text-red-600">Currently Closed</span>
              ) : (
                'Pick up at store - Free'
              )}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};