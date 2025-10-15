// src/components/checkout/CheckoutPage.tsx
'use client';

import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OrderTypeSelector } from './OrderTypeSelector';
import { PickupTimeSelector } from './PickupTimeSelector';
import { ContactForm } from './ContactForm';
import { DeliveryForm } from './DeliveryForm';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { checkDeliveryAvailability, cleanPostalCode, isValidDutchPostalCode } from '@/lib/deliveryZones';
import { canPlaceOrder } from '@/lib/storeHoursValidator';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { Store, OperatingHoursTakeaway, OperatingHoursDelivery, Extra } from '@/types';

interface CheckoutPageProps {
  onBackToCart: () => void;
  cartTotal: number;
  finalDeliveryFee: number;
  store: Store & {
    isServiceCost?: boolean;
    operatingHoursTakeaway?: OperatingHoursTakeaway;
    operatingHoursDelivery?: OperatingHoursDelivery;
  };
  cart: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    extras: Extra[];
  }>;
  clearCart: () => void;
}

interface MolliePaymentResponse {
  payment: {
    id: string;
    status: string;
    amount: { currency: string; value: string };
    description: string;
    metadata: Record<string, any>;
    _links: { checkout: { href: string } };
  };
}

export const CheckoutPage = ({ 
  onBackToCart, 
  cartTotal, 
  finalDeliveryFee, 
  store, 
  cart, 
  clearCart 
}: CheckoutPageProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    phoneNumber: '',
    email: '',
    notes: '',
    houseNumber: '',
    pickupTime: 'ASAP',
  });

  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'takeaway'>('delivery');
  const [paymentOption, setPaymentOption] = useState<'card' | 'cash'>('card');
  const [pickupTimeOption, setPickupTimeOption] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    deliveryFee: number;
    minimumOrder: number;
    estimatedTime: string;
    freeDeliveryThreshold?: number;
  } | null>(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'postalCode') {
      checkDeliveryForPostalCode(value);
    }
  };

  const checkDeliveryForPostalCode = async (postalCode: string) => {
    const cleanedCode = cleanPostalCode(postalCode);
    
    if (!cleanedCode || cleanedCode.length < 6) {
      setDeliveryAvailable(null);
      setDeliveryInfo(null);
      setDeliveryError(null);
      return;
    }

    if (!isValidDutchPostalCode(cleanedCode)) {
      setDeliveryAvailable(false);
      setDeliveryError('Please enter a valid Dutch postal code (e.g., 1234AB)');
      return;
    }

    setIsCheckingDelivery(true);
    setDeliveryError(null);

    try {
      const result = await checkDeliveryAvailability(store.id, cleanedCode);
      
      if (result.available) {
        setDeliveryAvailable(true);
        setDeliveryInfo({
          deliveryFee: result.deliveryFee || 0,
          minimumOrder: result.minimumOrder || 0,
          estimatedTime: result.estimatedTime || '30-45 min',
          freeDeliveryThreshold: result.freeDeliveryThreshold
        });
      } else {
        setDeliveryAvailable(false);
        setDeliveryError('Delivery not available to this postal code. Takeaway is still available!'); 
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryError('Error checking delivery availability. Please try again.');
      setDeliveryAvailable(false);
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  const calculateDeliveryFee = () => {
    if (deliveryOption === 'takeaway') return 0;
    if (!deliveryInfo) return 0;
    if (deliveryInfo.freeDeliveryThreshold && cartTotal >= deliveryInfo.freeDeliveryThreshold) return 0;
    return deliveryInfo.deliveryFee;
  };

  const currentDeliveryFee = calculateDeliveryFee();
  const serviceCostDisplay = paymentOption === 'card' && store.isServiceCost ? 0.32 : 0;
  const finalTotalDisplay = cartTotal + currentDeliveryFee + serviceCostDisplay;

  const handlePickupTimeOptionChange = (value: 'ASAP' | 'SCHEDULED') => {
    setPickupTimeOption(value);
    if (value === 'ASAP') {
      setFormData(prev => ({ ...prev, pickupTime: 'ASAP' }));
    } else {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderTypeStatus = canPlaceOrder(
      deliveryOption,
      store.operatingHoursTakeaway,
      store.operatingHoursDelivery
    );

    if (!orderTypeStatus.canOrder) {
      setDeliveryError(
        `Cannot place ${deliveryOption} order: ${orderTypeStatus.reason || 'Store is closed'}`
      );
      return;
    }

    if (deliveryOption === 'delivery' && deliveryAvailable !== true) {
      setDeliveryError('Please select takeaway or enter a valid delivery postal code');
      return;
    }

    if (deliveryOption === 'delivery' && deliveryInfo && cartTotal < deliveryInfo.minimumOrder) {
      setDeliveryError(`Minimum order for delivery is €${deliveryInfo.minimumOrder.toFixed(2)}`);
      return;
    }

    const baseTotal = cartTotal + currentDeliveryFee;
    const serviceCost = paymentOption === 'card' && store.isServiceCost ? 0.32 : 0; 
    const totalAmount = baseTotal + serviceCost;

    try {
      const orderPayload = {
        storeId: store.id,
        storeAddress: store.contact?.address,
        storePostalCode: store.contact?.postalCode,
        storeCity: store.contact?.address, // You may want to separate city if needed
        
        customer: {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phoneNumber,
          billingAddress: deliveryOption === 'delivery'
            ? `${formData.address} ${formData.houseNumber}, ${cleanPostalCode(formData.postalCode)}`
            : null,
          shippingAddress: deliveryOption === 'delivery'
            ? `${formData.address} ${formData.houseNumber}, ${cleanPostalCode(formData.postalCode)}`
            : null,
        },

        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price.toFixed(2),
          quantity: item.quantity,
          imageUrl: item.imageUrl || null,
          subtotal: (item.price * item.quantity).toFixed(2),
          extras: item.extras || []
        })),

        subtotal: cartTotal.toFixed(2),
        tax: "0.00",
        discount: "0.00",
        shippingCost: currentDeliveryFee.toFixed(2),
        serviceCost: serviceCost.toFixed(2),
        total: totalAmount.toFixed(2),
        currency: 'EUR',

        pickupTime: deliveryOption === 'takeaway' ? formData.pickupTime : null, 
        PaymentMethod: paymentOption,
        orderStatus: 'pending',
        paymentStatus: paymentOption === 'cash' 
          ? (deliveryOption === 'delivery' ? 'cash_on_delivery' : 'cash_on_pickup') 
          : 'pending',

        billingAddress: deliveryOption === 'delivery' ? 
          `${formData.address} ${formData.houseNumber}, ${cleanPostalCode(formData.postalCode)}` : null,
        shippingAddress: deliveryOption === 'delivery' ? 
          `${formData.address} ${formData.houseNumber}, ${cleanPostalCode(formData.postalCode)}` : null,
        
        metadata: {
          source: 'online_store',
          orderType: deliveryOption,
          customerNotes: formData.notes || null,
          ...(deliveryOption === 'delivery' && deliveryInfo && {
            estimatedDeliveryTime: deliveryInfo.estimatedTime,
            paymentOption: paymentOption,
          })
        },
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const createOrderUrl = 'https://createorder-5zsbq77b5q-uc.a.run.app';

      const orderResponse = await fetch(createOrderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error("Order creation error:", errorData);
        setDeliveryError(errorData.message || 'Failed to create order');
        return;
      }

      const { orderId, total } = await orderResponse.json();
      console.log(`Order created with ID: ${orderId}, Total: €${total}`);

      if (paymentOption === 'cash') { 
        clearCart();
        window.location.href = `${window.location.origin}/payment-return?orderId=${orderId}`;
        return;
      }

      const functions = getFunctions(app);
      const createMollieOnlinePayment = httpsCallable<any, MolliePaymentResponse>(
        functions,
        "createMollieOnlinePayment"
      );

      const paymentData = {
        amount: { value: total, currency: 'EUR' },
        method: 'ideal',
        applicationFee: { 
          amount: { value: '0.10', currency: 'EUR' },
          description: "standard App Fee"
        },
        description: `${deliveryOption === 'delivery' ? 'Delivery' : 'Takeaway'} order from ${store.name}`,
        redirectUrl: `${window.location.origin}/payment-return?orderId=${orderId}`,
        webhookUrl: `https://molliewebhook-5zsbq77b5q-uc.a.run.app`,
        metadata: {
          storeId: store.id,
          orderId: orderId.toString()
        }
      };

      const result = await createMollieOnlinePayment(paymentData);
      
      const checkoutUrl = result.data?.payment._links.checkout.href;
      if (checkoutUrl) {
        clearCart();
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received from payment service');
      }

    } catch (error) {
      console.error("Error during checkout:", error);
      if (error instanceof Error) {
        setDeliveryError(error.message || 'Checkout failed. Please try again.');
      }
    }
  };

  const orderTypeStatus = canPlaceOrder(
    deliveryOption,
    store.operatingHoursTakeaway,
    store.operatingHoursDelivery
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
      {!orderTypeStatus.canOrder && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <XIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">
                {deliveryOption === 'delivery' ? 'Delivery' : 'Takeaway'} Currently Unavailable
              </h3>
              <p className="text-red-800 text-sm">{orderTypeStatus.reason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-10 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900">Finalize Order</h2>
          <Button onClick={onBackToCart} variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
            Back to Cart
          </Button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-8">
          <OrderTypeSelector
            deliveryOption={deliveryOption}
            onDeliveryOptionChange={setDeliveryOption}
            operatingHoursTakeaway={store.operatingHoursTakeaway}
            operatingHoursDelivery={store.operatingHoursDelivery}
            deliveryInfo={deliveryInfo}
            currentDeliveryFee={currentDeliveryFee}
            cartTotal={cartTotal}
          />

          {deliveryOption === 'takeaway' && (
            <PickupTimeSelector
              pickupTimeOption={pickupTimeOption}
              onPickupTimeOptionChange={handlePickupTimeOptionChange}
              pickupTime={formData.pickupTime}
              onPickupTimeChange={(time) => handleFormDataChange('pickupTime', time)}
              operatingHoursTakeaway={store.operatingHoursTakeaway}
            />
          )}

          <ContactForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            sectionNumber={deliveryOption === 'takeaway' ? 3 : 2}
          />

          {deliveryOption === 'delivery' && (
            <DeliveryForm
              formData={formData}
              onFormDataChange={handleFormDataChange}
              isCheckingDelivery={isCheckingDelivery}
              deliveryAvailable={deliveryAvailable}
              deliveryError={deliveryError}
              deliveryInfo={deliveryInfo}
              sectionNumber={3}
            />
          )}

          <PaymentMethodSelector
            paymentOption={paymentOption}
            onPaymentOptionChange={setPaymentOption}
            deliveryOption={deliveryOption}
            isServiceCost={store.isServiceCost || false}
            sectionNumber={4}
          />

          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">5. Notes</h3>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'} Notes (optional)
              </label>
              <textarea 
                id="notes" 
                name="notes" 
                rows={3} 
                value={formData.notes} 
                onChange={(e) => handleFormDataChange('notes', e.target.value)}
                className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border-t border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{deliveryOption === 'delivery' ? 'Delivery Fee:' : 'Pickup:'}</span>
                <span>
                  {deliveryOption === 'takeaway' 
                    ? 'Free' 
                    : currentDeliveryFee === 0 
                      ? 'Free'
                      : `€${currentDeliveryFee.toFixed(2)}`
                  }
                </span>
              </div>
              
              {store.isServiceCost && paymentOption === 'card' && (
                <div className="flex justify-between text-base text-blue-700">
                  <span className="font-semibold flex items-center">Service Fee:</span>
                  <span className="font-medium">€{serviceCostDisplay.toFixed(2)}</span>
                </div>
              )}

              {deliveryOption === 'delivery' && deliveryInfo?.freeDeliveryThreshold && cartTotal < deliveryInfo.freeDeliveryThreshold && currentDeliveryFee > 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  Add €{(deliveryInfo.freeDeliveryThreshold - cartTotal).toFixed(2)} more for free delivery!
                </div>
              )}

              <hr className="border-gray-300 my-4" />
              
              <div className="flex justify-between text-xl font-extrabold text-gray-900">
                <span>Total:</span>
                <span>€{finalTotalDisplay.toFixed(2)}</span>
              </div>
              
              {deliveryOption === 'takeaway' && store && (
                <div className="flex flex-col text-sm text-gray-700 pt-3 border-t border-dashed mt-3">
                  <span className="font-semibold">Pickup Location:</span>
                  <span className="text-sm">{store.contact?.address}</span>
                  <span className="text-sm">{store.contact?.postalCode}</span>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            brandColor={store.brandColor} 
            size="lg" 
            className="w-full text-lg shadow-lg hover:shadow-xl transition duration-200"
            disabled={
              !orderTypeStatus.canOrder ||
              !!(
                (deliveryOption === 'delivery' && deliveryAvailable !== true) ||
                (deliveryOption === 'delivery' && deliveryInfo && cartTotal < deliveryInfo.minimumOrder)
              )
            }
          >
            {!orderTypeStatus.canOrder
              ? `${deliveryOption === 'delivery' ? 'Delivery' : 'Takeaway'} Currently Closed`
              : deliveryOption === 'delivery' && deliveryInfo && cartTotal < deliveryInfo.minimumOrder
                ? `Minimum order €${deliveryInfo.minimumOrder.toFixed(2)} for delivery`
                : paymentOption === 'cash'
                  ? `Place Order & Pay Cash on ${deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}`
                  : `Proceed to Online Payment (€${finalTotalDisplay.toFixed(2)})`
            }
          </Button>
          
          {paymentOption === 'card' && (
            <p className="text-xs text-gray-500 text-center">
              You will be redirected to our secure payment provider to complete your order.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};