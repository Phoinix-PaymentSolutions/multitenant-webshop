import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  DocumentData, 
  QueryDocumentSnapshot,
  where
} from 'firebase/firestore';
import { app, db } from './firebase';
import type { Store, Product, UpdatedProduct} from '@/types';


// Add this temporary test
export async function testConnection() {
  try {
    console.log('Testing basic connection...');
    const testRef = collection(db, 'test');
    console.log('Collection reference created successfully');
    return true;
  } catch (error) {
    console.error('Basic connection test failed:', error);
    return false;
  }
}

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
      return { id: docSnap.id, ...data } as Store; // Cast to Store type
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

export async function getStoreProducts(storeId: string) {
  try {
    const productsCollection = collection(db, "products");

    // Filter products by storeId
    const q = query(productsCollection, where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);

    const products = querySnapshot.docs.map((doc) => {
      const { id, ...data } = doc.data() as UpdatedProduct;
      return {
        id: doc.id,
        ...data,
      };
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}