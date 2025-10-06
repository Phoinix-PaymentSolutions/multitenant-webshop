import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

type Data = {
  id?: string;
  [key: string]: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { orderId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Invalid orderId' });
  }

  try {
    const orderDoc = await admin
      .firestore()
      .collection('online_orders')
      .doc(orderId)
      .get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Return the order data
    return res.status(200).json({
      id: orderDoc.id,
      ...orderDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
}
