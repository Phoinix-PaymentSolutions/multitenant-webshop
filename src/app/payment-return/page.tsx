'use client'

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

type OrderData = {
  id?: string;
  orderNumber?: string;
  total?: number;
  currency?: string;
  customerEmail?: string;
  paymentStatus?: 'loading' | 'paid' | 'failed' | 'canceled' | 'expired' | 'pending' | string;
  metadata?: {
    failureReason?: string;
  };
  [key: string]: any;
};

export default function PaymentReturnPage() {
  const [status, setStatus] = useState<'loading' | 'paid' | 'failed' | 'canceled' | 'expired' | 'pending' | string>('loading');
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      // Get orderId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');

      if (!orderId) {
        setStatus('error');
        return;
      }

      // Fetch via API route
      const response = await fetch(`/api/orders/${orderId}`);
      const order: OrderData = await response.json();

      setOrderData(order);
      setStatus(order.paymentStatus || 'error');

    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Checking payment status...</h1>
            <p className="text-gray-600">Please wait while we verify your payment</p>
          </div>
        );

      case 'paid':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">Thank you for your order</p>
            {orderData && (
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-bold mb-2">{orderData.orderNumber}</p>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="font-bold mb-2">{orderData.currency} {orderData.total}</p>
                <p className="text-sm text-gray-600">Email confirmation sent to</p>
                <p className="font-bold">{orderData.customerEmail}</p>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Return to Home
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2 text-red-700">Payment Failed</h1>
            <p className="text-gray-600 mb-4">
              Unfortunately, your payment could not be processed
            </p>
            {orderData && (
              <div className="bg-red-50 rounded-lg p-4 text-left max-w-md mx-auto mb-4">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-bold mb-2">{orderData.orderNumber}</p>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-bold">{orderData.metadata?.failureReason || 'Payment failed'}</p>
              </div>
            )}
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = `/order/${orderData?.id}/retry`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Return to Home
              </button>
            </div>
          </div>
        );

      case 'canceled':
        return (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h1 className="text-2xl font-bold mb-2 text-orange-700">Payment Canceled</h1>
            <p className="text-gray-600 mb-4">
              You canceled the payment
            </p>
            {orderData && (
              <div className="bg-orange-50 rounded-lg p-4 text-left max-w-md mx-auto mb-4">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-bold">{orderData.orderNumber}</p>
              </div>
            )}
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = `/order/${orderData?.id}/retry`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Complete Payment
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Return to Home
              </button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h1 className="text-2xl font-bold mb-2 text-gray-700">Payment Expired</h1>
            <p className="text-gray-600 mb-4">
              This payment link has expired
            </p>
            <button
              onClick={() => window.location.href = `/order/${orderData?.id}/retry`}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create New Payment
            </button>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h1 className="text-2xl font-bold mb-2 text-blue-700">Payment Pending</h1>
            <p className="text-gray-600 mb-4">
              Your payment is being processed
            </p>
            <button
              onClick={checkPaymentStatus}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh Status
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h1 className="text-2xl font-bold mb-2">Unable to check payment status</h1>
            <p className="text-gray-600 mb-4">Please contact support if you need assistance</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Return to Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        {renderContent()}
      </div>
    </div>
  );
}
