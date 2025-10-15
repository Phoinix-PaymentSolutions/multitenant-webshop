// src/lib/hooks/useStoreStatus.ts
import { useState, useEffect } from 'react';
import { getStoreStatus } from '@/lib/storeHoursValidator';
import { OperatingHoursTakeaway, OperatingHoursDelivery } from '@/types';

export const useStoreStatus = (
  operatingHoursTakeaway?: OperatingHoursTakeaway,
  operatingHoursDelivery?: OperatingHoursDelivery
) => {
  const [status, setStatus] = useState(() => 
    getStoreStatus(operatingHoursTakeaway, operatingHoursDelivery)
  );

  useEffect(() => {
    // Immediately update when store data changes
    setStatus(getStoreStatus(operatingHoursTakeaway, operatingHoursDelivery));
    
    // Then set up interval for continuous updates
    const interval = setInterval(() => {
      setStatus(getStoreStatus(operatingHoursTakeaway, operatingHoursDelivery));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [operatingHoursTakeaway, operatingHoursDelivery]);

  return status;
};