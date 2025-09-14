// src/lib/database.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Store, Product, Order, Customer, CartItem } from '@/types';

// Store functions
export async function getStore(subdomain: string): Promise<Store | null> {
  try {
    const storeDoc = await getDoc(doc(db, 'stores', subdomain));
    if (storeDoc.exists()) {
      return { id: storeDoc.id, ...storeDoc.data() } as Store;
    }
    return null;
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
}

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('storeId', '==', storeId),
      where('active', '==', true)
    );
    const snapshot = await getDocs(productsQuery);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Order functions
export async function createOrder(
  storeId: string, 
  customer: Customer, 
  items: CartItem[]
): Promise<string> {
  try {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
      storeId,
      customer,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
      })),
      total,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  paymentData?: {
    paymentStatus: Order['paymentStatus'];
    paymentMethod?: string;
    molliePaymentId?: string;
  }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (paymentData) {
      Object.assign(updateData, paymentData);
    }
    
    await updateDoc(doc(db, 'orders', orderId), updateData);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function getStoreOrders(storeId: string): Promise<Order[]> {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Order[];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}