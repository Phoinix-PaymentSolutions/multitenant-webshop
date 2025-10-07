import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const orderDoc = await admin
      .firestore()
      .collection('online_orders')
      .doc(orderId)
      .get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    
    return NextResponse.json({
      id: orderId,
      ...orderData
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}