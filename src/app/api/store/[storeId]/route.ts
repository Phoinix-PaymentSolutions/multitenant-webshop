import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    // Query store by slug or subdomain using Admin SDK
    let snapshot = await adminDb
      .collection('stores')
      .where('slug', '==', storeId)
      .limit(1)
      .get();
    
    // If not found by slug, try subdomain
    if (snapshot.empty) {
      snapshot = await adminDb
        .collection('stores')
        .where('subdomain', '==', storeId)
        .limit(1)
        .get();
    }
    
    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    const storeDoc = snapshot.docs[0];
    const store = {
      id: storeDoc.id,
      ...storeDoc.data()
    };

    // Get products for this store
    const productsSnapshot = await adminDb
      .collection('products')
      .where('storeId', '==', store.id)
      .get();
    
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ store, products });
  } catch (error) {
    console.error('Error fetching store data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}