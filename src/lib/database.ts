// lib/database.ts - Client-side database functions
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Store, Product, Extra } from '@/types';

// Remove all admin SDK imports and functions - they belong server-side only

// This file contains the safe, read-only database functions for the public storefront.
// All functions here are designed to work without user authentication.

// Store functions
export async function getStore(storeId: string): Promise<Store | null> {
  try {
    const docRef = doc(db, 'stores', storeId);
    const docSnap = await getDoc(docRef);
    console.log('Document path:', docRef.path);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Store data retrieved:', data);
      return { id: docSnap.id, ...data } as Store;
    } else {
      console.log('No store found with ID:', storeId);
      return null;
    }
  } catch (error: unknown) {
    console.error('Full error details:', error);
    console.error('Error stack:', (error as Error).stack);
    throw error;
  }
}

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);

    const products = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Product;
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
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