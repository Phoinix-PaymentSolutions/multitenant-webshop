import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { storeId, productId } = await params;

    // First verify the product exists and belongs to this store
    const productDoc = await adminDb
      .collection('products')
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productDoc.data();
    
    if (productData?.storeId !== storeId) {
      return NextResponse.json(
        { error: 'Product does not belong to this store' },
        { status: 403 }
      );
    }

    // Query the Extras subcollection under the specific product
    const extrasSnapshot = await adminDb
      .collection('products')
      .doc(productId)
      .collection('Extras')
      .get();
    
    const extras = extrasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ extras });
  } catch (error) {
    console.error('Error fetching extras:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}