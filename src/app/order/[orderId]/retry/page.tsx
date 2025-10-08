'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Loader2, CreditCard } from 'lucide-react';

type OrderData = {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  customerEmail: string;
  paymentStatus: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

export default function PaymentRetryPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      if (!orderId) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/store/orders/${orderId}`);
     
      if (!response.ok) {
        throw new Error('Failed to load order');
      }

      const order = await response.json();
      
      // Ensure total is a number
      const formattedOrder: OrderData = {
        ...order,
        total: typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0,
        items: order.items?.map((item: any) => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0,
        })) || []
      };
      
      setOrderData(formattedOrder);
      setLoading(false);

    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderData) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/store/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const { paymentUrl } = await response.json();
     
      // Redirect to payment provider
      window.location.href = paymentUrl;

    } catch (err) {
      console.error('Error creating payment:', err);
      setError('Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">
            Your order is waiting for payment
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
         
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number</span>
              <span className="font-semibold">{orderData.orderNumber}</span>
            </div>
           
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Email</span>
              <span className="font-semibold">{orderData.customerEmail}</span>
            </div>

            {orderData.items && orderData.items.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-semibold mb-2">Items:</p>
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      {orderData.currency} {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 mt-3 flex justify-between text-lg">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-blue-600">
                {orderData.currency} {orderData.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleRetryPayment}
            disabled={processing}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay Now
              </>
            )}
          </button>
         
          <button
            onClick={() => window.location.href = '/'}
            disabled={processing}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By clicking &quot;Pay Now&quot;, you&apos;ll be redirected to our secure payment provider
        </p>
      </div>
    </div>
  );
}