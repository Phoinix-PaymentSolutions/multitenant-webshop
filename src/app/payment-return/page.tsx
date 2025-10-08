'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
type OrderData = {
  id?: string;
  orderNumber?: string;
  total?: number;
  currency?: string;
  customerEmail?: string;
  paymentStatus?: 'loading' | 'paid' | 'failed' | 'canceled' | 'expired' | 'pending' | 'error' | string;
  metadata?: {
    failureReason?: string;
    orderType?: 'delivery' | 'takeaway';
  };
  storeAddress: string
  storeCity: string
  storePostalCode: string
};

export default function PaymentReturnPage() {
  const [status, setStatus] = useState<'loading' | 'paid' | 'failed' | 'canceled' | 'expired' | 'pending' | 'error' | string>('loading');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const isMountedRef = useRef(true);

  const checkPaymentStatus = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');

      if (!orderId) {
        if (isMountedRef.current) {
          setStatus('error');
        }
        return;
      }

      const response = await fetch(`/api/store/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const order: OrderData = await response.json();

      if (isMountedRef.current) {
        setOrderData(order);
        setStatus(order.paymentStatus || 'error');
      }

    } catch (error) {
      console.error('Error checking payment status:', error);
      if (isMountedRef.current) {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    checkPaymentStatus();

    return () => {
      isMountedRef.current = false;
    };
  }, [checkPaymentStatus]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <Clock className="w-20 h-20 text-blue-500 animate-spin" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Verifying Your Payment...
            </h1>
            <p className="text-gray-600 text-lg">Just a moment while we confirm everything! ✨</p>
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        );

      case 'paid':
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-60 animate-pulse"></div>
              <CheckCircle className="w-24 h-24 text-green-500 relative animate-scaleIn" />
            </div>
            <h1 className="text-4xl font-bold mb-3 text-green-700">
              🎉 Payment Successful! 🎉
            </h1>
            <p className="text-gray-700 text-lg mb-6 font-medium">
              Woohoo! Your order is confirmed and on its way!
            </p>
            {orderData && (
              <>
                {/* Order Type Banner */}
                <div className="mb-6">
                  {orderData.metadata?.orderType === 'takeaway' ? (
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border-2 border-purple-300 max-w-md mx-auto">
                      <p className="text-lg font-bold text-purple-800 mb-2">🏪 Pickup Order</p>
                      <p className="text-sm text-purple-700 font-medium">Pick up your order from:</p>
                       {orderData.storeAddress && (
                        <p className="text-base font-bold text-purple-900 mt-1">
                          📍 {orderData.storeAddress} {orderData.storePostalCode} {orderData.storeCity}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 border-2 border-blue-300 max-w-md mx-auto">
                      <p className="text-lg font-bold text-blue-800 mb-1">🚚 Delivery Order</p>
                      <p className="text-sm text-blue-700 font-medium">
                        Your order will be delivered to your address
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-left max-w-md mx-auto mb-6 border-2 border-green-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800">Order Details</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Order Number</p>
                      <p className="font-bold text-lg text-gray-800">{orderData.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Paid</p>
                      <p className="font-bold text-2xl text-green-700">{orderData.currency} {orderData.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Confirmation sent to</p>
                      <p className="font-bold text-gray-800">{orderData.customerEmail}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 mx-auto"
            >
              Back to Home
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <XCircle className="w-20 h-20 text-red-500 animate-scaleIn" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-red-700">
              Oops! Payment Didn't Go Through
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              Don't worry, these things happen! Let's try again. 💪
            </p>
            {orderData && (
              <div className="bg-red-50 rounded-2xl p-6 text-left max-w-md mx-auto mb-6 border-2 border-red-200">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Order Number</p>
                    <p className="font-bold text-gray-800">{orderData.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">What happened?</p>
                    <p className="font-semibold text-red-700">{orderData.metadata?.failureReason || 'Payment could not be processed'}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = `/order/${orderData?.id}/retry`}
                className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 justify-center"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 shadow-md hover:shadow-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      case 'canceled':
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <AlertCircle className="w-20 h-20 text-orange-500 animate-scaleIn" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-orange-700">
              Payment Canceled
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              No worries! You can complete your payment whenever you're ready. 😊
            </p>
            {orderData && (
              <div className="bg-orange-50 rounded-2xl p-6 text-left max-w-md mx-auto mb-6 border-2 border-orange-200">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Order Number</p>
                  <p className="font-bold text-lg text-gray-800">{orderData.orderNumber}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = `/order/${orderData?.id}/retry`}
                className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 justify-center"
              >
                Complete Payment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 shadow-md hover:shadow-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <Clock className="w-20 h-20 text-gray-500 animate-scaleIn" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-700">
              Payment Link Expired
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              This payment link has timed out, but we can create a fresh one for you! ⏰
            </p>
            <button
              onClick={() => window.location.href = `/order/${orderData?.id}/retry`}
              className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Create New Payment Link
            </button>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <Clock className="w-20 h-20 text-blue-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Payment Processing...
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              Your payment is being processed. This usually takes just a moment! ⏳
            </p>
            <button
              onClick={checkPaymentStatus}
              className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Check Status
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center animate-fadeIn">
            <div className="relative inline-block mb-6">
              <AlertCircle className="w-20 h-20 text-gray-500 animate-scaleIn" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-700">
              Hmm, Something's Not Right
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              We're having trouble checking your payment status. Our support team is here to help! 💬
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Back to Home
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-2xl w-full border border-gray-100">
          {renderContent()}
        </div>
      </div>
    </>
  );
}