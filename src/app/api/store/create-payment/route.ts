import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order from Firebase
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

    if (!orderData) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Prepare payment data for Mollie
    const paymentData = {
      amount: { 
        value: orderData.total.toString(), 
        currency: orderData.currency || 'EUR' 
      },
      method: 'ideal',
      applicationFee: { 
        amount: { value: '0.10', currency: 'EUR' },
        description: "standard App Fee"
      },
      description: `${orderData.deliveryOption === 'delivery' ? 'Delivery' : 'Takeaway'} order from ${orderData.storeName || 'store'}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_URL}/payment-return?orderId=${orderId}`,
      webhookUrl: `https://molliewebhook-5zsbq77b5q-uc.a.run.app`,
      metadata: {
        storeId: orderData.storeId,
        orderId: orderId.toString()
      }
    };

    console.log('Creating retry payment:', JSON.stringify(paymentData, null, 2));

    // Call your Cloud Run function directly
    const functionUrl = 'https://createmollieonlinepayment-5zsbq77b5q-uc.a.run.app';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: paymentData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloud Function error:', errorText);
      throw new Error('Failed to create Mollie payment');
    }

    const result = await response.json();
    console.log('Cloud Function result:', result);
    
    const checkoutUrl = result.result?.payment?._links?.checkout?.href;

    if (!checkoutUrl) {
      console.error('No checkout URL in response:', result);
      throw new Error('No checkout URL received from payment service');
    }

    return NextResponse.json({ 
      paymentUrl: checkoutUrl 
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
}