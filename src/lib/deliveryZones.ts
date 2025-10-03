// lib/deliveryZones.ts
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface DeliveryZoneData {
  zones: string[];
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
  freeDeliveryThreshold?: number;
  isActive: boolean;
}

export interface DeliveryCheckResult {
  available: boolean;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedTime?: string;
  freeDeliveryThreshold?: number;
}

// Check if delivery is available for a postal code
export async function checkDeliveryAvailability(
  storeId: string, 
  postalCode: string
): Promise<DeliveryCheckResult> {
  try {
    const deliveryZoneRef = doc(db, 'deliveryZones', storeId);
    const deliveryZoneDoc = await getDoc(deliveryZoneRef);
    
    if (!deliveryZoneDoc.exists()) {
      return { available: false };
    }
    
    const data = deliveryZoneDoc.data() as DeliveryZoneData;
    const cleanedPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
    const fourDigitCode = cleanedPostalCode.substring(0, 4);

    if (!data.isActive || !data.zones.includes(fourDigitCode)) {
      return { available: false };
    }
    
    return {
      available: true,
      deliveryFee: data.deliveryFee,
      minimumOrder: data.minimumOrder,
      estimatedTime: data.estimatedTime,
      freeDeliveryThreshold: data.freeDeliveryThreshold
    };
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    return { available: false };
  }
}

// Validate Dutch postal code format
export function isValidDutchPostalCode(postalCode: string): boolean {
  const pattern = /^\d{4}[A-Z]{2}$/;
  return pattern.test(postalCode.toUpperCase().replace(/\s/g, ''));
}

// Clean postal code input
export function cleanPostalCode(postalCode: string): string {
  return postalCode.replace(/\s/g, '').toUpperCase();
}