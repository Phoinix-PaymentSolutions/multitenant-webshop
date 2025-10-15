// src/components/store/StoreStatusBanner.tsx
import React from 'react';
import { ClockIcon, XIcon } from 'lucide-react';
import { OperatingHoursTakeaway, OperatingHoursDelivery } from '@/types';
import { getStoreStatus } from '@/lib/storeHoursValidator';

interface StoreStatusBannerProps {
  operatingHoursTakeaway?: OperatingHoursTakeaway;
  operatingHoursDelivery?: OperatingHoursDelivery;
}

export const StoreStatusBanner = ({ 
  operatingHoursTakeaway,
  operatingHoursDelivery 
}: StoreStatusBannerProps) => {
  const status = getStoreStatus(operatingHoursTakeaway, operatingHoursDelivery);
  
  if (status.allClosed) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <XIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-1">
              We're Currently Closed
            </h3>
            <p className="text-red-800 text-sm mb-2">
              We're not accepting orders right now. 
            </p>
            <div className="space-y-1 text-sm text-red-700">
              {operatingHoursTakeaway && (
                <p>
                  <span className="font-semibold">Takeaway:</span> {status.takeaway.message}
                  {status.takeaway.nextOpenTime && ` - Opens ${status.takeaway.nextOpenTime}`}
                </p>
              )}
              {operatingHoursDelivery && (
                <p>
                  <span className="font-semibold">Delivery:</span> {status.delivery.message}
                  {status.delivery.nextOpenTime && ` - Opens ${status.delivery.nextOpenTime}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <ClockIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-900 mb-1">
            We're Open!
          </h3>
          <div className="space-y-1 text-sm text-green-800">
            {operatingHoursTakeaway && (
              <p>
                <span className="font-semibold">Takeaway:</span> {status.takeaway.message}
              </p>
            )}
            {operatingHoursDelivery && (
              <p>
                <span className="font-semibold">Delivery:</span> {status.delivery.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};