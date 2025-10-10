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
    console.log('🚀 Checking delivery for store:', storeId, 'postal code:', postalCode);
    
    // Fetch the main store document from the 'stores' collection
    const storeRef = doc(db, 'stores', storeId);
    console.log('📄 Fetching store document...');
    const storeDoc = await getDoc(storeRef);

    // If the store document doesn't exist, delivery is impossible
    if (!storeDoc.exists()) {
      console.error('❌ Store with ID', storeId, 'not found.');
      return { available: false };
    }

    console.log('✅ Store document found');
    const storeData = storeDoc.data();
    console.log('📦 Full store data:', JSON.stringify(storeData, null, 2));
    
    // Check different possible field names for delivery zones
    let data: DeliveryZoneData | undefined;
    
    if (storeData.deliveryZones) {
      console.log('Found deliveryZones field');
      data = storeData.deliveryZones as DeliveryZoneData;
    } else if (storeData.deliveryZone) {
      console.log('Found deliveryZone field');
      data = storeData.deliveryZone as DeliveryZoneData;
    } else {
      console.log('⚠️ No deliveryZones or deliveryZone field found in store data');
      console.log('Available fields:', Object.keys(storeData));
    }
    
    console.log('🗺️ Delivery zones data:', JSON.stringify(data, null, 2));

    // Handle two different Firestore structures:
    // 1. New structure: deliveryZones is an object with zones, fees, etc.
    // 2. Old structure: deliveryZones is just an array, fees are at root level
    
    let zones: string[];
    let deliveryFee: number;
    let minimumOrder: number;
    let estimatedTime: string;
    let freeDeliveryThreshold: number | undefined;
    let isActive: boolean;

    // Check if deliveryZones is an object (new structure) or array (old structure)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.log('📋 Using new structure (deliveryZones as object)');
      zones = data.zones || [];
      deliveryFee = data.deliveryFee || 0;
      minimumOrder = data.minimumOrder || 0;
      estimatedTime = data.estimatedTime || '30-45 min';
      freeDeliveryThreshold = data.freeDeliveryThreshold;
      isActive = data.isActive !== false; // Default to true if not specified
    } else if (Array.isArray(storeData.deliveryZones)) {
      console.log('📋 Using old structure (deliveryZones as array at root)');
      zones = storeData.deliveryZones;
      deliveryFee = storeData.deliveryFee || 0;
      minimumOrder = storeData.minimumOrder || 0;
      estimatedTime = storeData.estimatedTime || '30-45 min';
      freeDeliveryThreshold = storeData.freeDeliveryThreshold;
      // Check if store is active overall, default to true
      isActive = storeData.active !== false;
    } else {
      console.log('❌ No valid delivery zones found');
      return { available: false };
    }

    console.log('✅ Parsed delivery data:', {
      zones,
      deliveryFee,
      minimumOrder,
      estimatedTime,
      freeDeliveryThreshold,
      isActive
    });

    if (!isActive) {
      console.log('❌ Store/delivery is not active');
      return { available: false };
    }

    // Clean the postal code
    const cleanedPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
    const fourDigitCode = cleanedPostalCode.substring(0, 4);
    
    console.log('🔍 Cleaned postal code:', cleanedPostalCode);
    console.log('🔍 Four digit code:', fourDigitCode);
    console.log('🔍 Available zones:', zones);

    // Check if zones exist and include the postal code
    if (!zones || !Array.isArray(zones)) {
      console.log('❌ No zones array found');
      return { available: false };
    }
    
    if (!zones.includes(fourDigitCode)) {
      console.log('❌ Postal code', fourDigitCode, 'not in zones:', zones);
      return { available: false };
    }

    // Success! Delivery is available to this postal code
    console.log('✅ Delivery is available!', {
      deliveryFee,
      minimumOrder,
      estimatedTime,
      freeDeliveryThreshold,
    });
    
    return {
      available: true,
      deliveryFee,
      minimumOrder,
      estimatedTime,
      freeDeliveryThreshold,
    };
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    return { available: false };
  }
}

// Validate Dutch postal code format
export function isValidDutchPostalCode(postalCode: string): boolean {
  const pattern = /^\d{4}[A-Z]{2}$/;
  const cleaned = postalCode.toUpperCase().replace(/\s/g, '');
  const isValid = pattern.test(cleaned);
  console.log('Validating postal code:', postalCode, 'cleaned:', cleaned, 'valid:', isValid);
  return isValid;
}

// Clean postal code input
export function cleanPostalCode(postalCode: string): string {
  return postalCode.replace(/\s/g, '').toUpperCase();
}