// storeHoursValidator.ts

import type { OperatingHoursTakeaway, OperatingHoursDelivery, DayHours } from '@/types';

interface StoreStatusResult {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
}

interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export const isStoreOpen = (
  operatingHours: OperatingHours | undefined,
  currentTime?: Date
): StoreStatusResult => {
  console.log('isStoreOpen called with:', operatingHours);
  
  if (!operatingHours) {
    console.log('No operating hours provided');
    return { 
      isOpen: false, 
      message: 'Operating hours not configured' 
    };
  }

  const now = currentTime || new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()] as keyof OperatingHours;
  const currentHours = operatingHours[currentDay];

  console.log('Current day:', currentDay);
  console.log('Current hours for today:', currentHours);

  if (!currentHours || currentHours.closed) {
    const nextOpen = findNextOpenDay(operatingHours, now);
    return { 
      isOpen: false, 
      message: `Closed today`,
      nextOpenTime: nextOpen
    };
  }

  // Check for invalid time formats
  if (!currentHours.open || !currentHours.close || 
      currentHours.open.includes('null') || currentHours.close.includes('null')) {
    console.log('Invalid time format detected:', currentHours);
    return {
      isOpen: false,
      message: 'Invalid hours configuration'
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [openHour, openMin] = currentHours.open.split(':').map(Number);
  const [closeHour, closeMin] = currentHours.close.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  console.log('Current time (minutes):', currentMinutes);
  console.log('Open time (minutes):', openMinutes);
  console.log('Close time (minutes):', closeMinutes);

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { 
      isOpen: true, 
      message: `Open now • Closes at ${currentHours.close}` 
    };
  }

  if (currentMinutes < openMinutes) {
    return { 
      isOpen: false, 
      message: `Closed • Opens today at ${currentHours.open}`,
      nextOpenTime: `Today at ${currentHours.open}`
    };
  }

  const nextOpen = findNextOpenDay(operatingHours, now);
  return { 
    isOpen: false, 
    message: `Closed • Opens ${nextOpen}`,
    nextOpenTime: nextOpen
  };
};

const findNextOpenDay = (
  operatingHours: OperatingHours,
  fromDate: Date
): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let checkDate = new Date(fromDate);
  checkDate.setDate(checkDate.getDate() + 1);
  
  for (let i = 0; i < 7; i++) {
    const dayIndex = checkDate.getDay();
    const dayKey = days[dayIndex] as keyof OperatingHours;
    const dayHours = operatingHours[dayKey];
    
    if (dayHours && !dayHours.closed && 
        !dayHours.open.includes('null') && !dayHours.close.includes('null')) {
      const isTomorrow = i === 0;
      
      if (isTomorrow) {
        return `tomorrow at ${dayHours.open}`;
      } else {
        return `${dayNames[dayIndex]} at ${dayHours.open}`;
      }
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  return 'soon';
};

export const getStoreStatus = (
  operatingHoursTakeaway?: OperatingHoursTakeaway,
  operatingHoursDelivery?: OperatingHoursDelivery
) => {
  console.log('getStoreStatus called');
  console.log('Takeaway input:', operatingHoursTakeaway);
  console.log('Delivery input:', operatingHoursDelivery);
  
  const takeawayStatus = isStoreOpen(operatingHoursTakeaway?.takeaway);
  const deliveryStatus = isStoreOpen(operatingHoursDelivery?.delivery);
  
  return {
    takeaway: takeawayStatus,
    delivery: deliveryStatus,
    anyOpen: takeawayStatus.isOpen || deliveryStatus.isOpen,
    allClosed: !takeawayStatus.isOpen && !deliveryStatus.isOpen,
    takeawayOpen: takeawayStatus.isOpen,
    deliveryOpen: deliveryStatus.isOpen
  };
};

export const canPlaceOrder = (
  orderType: 'delivery' | 'takeaway',
  operatingHoursTakeaway?: OperatingHoursTakeaway,
  operatingHoursDelivery?: OperatingHoursDelivery
): { canOrder: boolean; reason?: string } => {
  if (orderType === 'takeaway') {
    const status = isStoreOpen(operatingHoursTakeaway?.takeaway);
    return {
      canOrder: status.isOpen,
      reason: status.isOpen ? undefined : status.message
    };
  } else {
    const status = isStoreOpen(operatingHoursDelivery?.delivery);
    return {
      canOrder: status.isOpen,
      reason: status.isOpen ? undefined : status.message
    };
  }
};