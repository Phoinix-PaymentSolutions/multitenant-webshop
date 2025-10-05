// lib/database.ts - Client-side database functions
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Store, Product, Extra } from '@/types';

// Remove all admin SDK imports and functions - they belong server-side only

// This file contains the safe, read-only database functions for the public storefront.
// All functions here are designed to work without user authentication.

// Store functions
export async function getStore(identifier: string) {
  // Query by slug or subdomain
  const storeQuery = query(
    collection(db, 'stores'),
    where('slug', '==', identifier),
    limit(1)
  );
  
  let snapshot = await getDocs(storeQuery);
  
  // If not found by slug, try subdomain
  if (snapshot.empty) {
    const subdomainQuery = query(
      collection(db, 'stores'),
      where('subdomain', '==', identifier),
      limit(1)
    );
    snapshot = await getDocs(subdomainQuery);
  }
  
  if (snapshot.empty) {
    return null;
  }
  
  return {
    id: snapshot.docs[0].id, // The actual Firestore document ID
    ...snapshot.docs[0].data()
  } as Store;
}

export async function getStoreProducts(identifier: string) {
  // First get the store to find its real document ID
  const store = await getStore(identifier);
  
  if (!store) {
    return [];
  }
  
  // Now query products using the actual Firestore document ID
  const productsQuery = query(
    collection(db, 'products'),
    where('storeId', '==', store.id)
  );
  
  const snapshot = await getDocs(productsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[];
}

export async function getProductExtras(productId: string): Promise<Extra[]> {
  try {
    // Construct a reference to the 'Extras' subcollection on the specific product document.
    const extrasCollectionRef = collection(doc(db, "products", productId), "Extras");

    // Fetch all documents from the subcollection.
    const querySnapshot = await getDocs(extrasCollectionRef);

    // Map the documents to an array of Extra objects.
    const extras = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Extra;
    });

    // Return the array of extras.
    return extras;
  } catch (error) {
    console.error("Error fetching product extras:", error);
    return [];
  }
}

// Add this to lib/database.ts
export async function getStoreByDomain(domain: string) {
  // Remove port if present (localhost:3000 → localhost)
  const cleanDomain = domain.split(':')[0];
  
  const storeQuery = query(
    collection(db, 'stores'),
    where('customDomain', '==', cleanDomain),
    limit(1)
  );
  
  const snapshot = await getDocs(storeQuery);
  
  if (snapshot.empty) {
    return null;
  }
  
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  } as Store;
}

// lib/database.ts
export async function getStoreBySubdomain(subdomain: string) {
  const storeQuery = query(
    collection(db, 'stores'),
    where('subdomain', '==', subdomain),
    limit(1)
  );
  
  const snapshot = await getDocs(storeQuery);
  
  if (snapshot.empty) {
    return null;
  }
  
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  } as Store;
}