"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const functions = __importStar(require("firebase-functions"));
exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send("Hello from Firebase!");
});

const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const axios = require("axios");
const cors = require("cors")({ origin: ['https://your-production-domain.com', 'http://localhost:3000',], methods: ['GET', 'POST'], credentials:true });
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager"); 
const next = require ("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, conf: { distDir: ".next" } });
const handle = app.getRequestHandler();

exports.nextApp = functions.https.onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
});

const secretClient = new SecretManagerServiceClient();

// Constants
const { makeMollieApiRequest } = require("./mollieHelper");
const MOLLIE_API_BASE_URL = "https://api.mollie.com/v2";
const COLLECTION_ONLINE_PAYMENTS = "online_payments";
const {createMollieClient} = require("@mollie/api-client");

// --- Helper functions ---


/**
// Add this function to your index.js file

/**
// Add this function to your index.js file

/**
 * Creates a Mollie payment for online orders (no Firebase auth required)
 * @param {object} data - The payment data from the frontend
 * @param {object} data.amount - Payment amount object with value and currency
 * @param {string} data.method - Payment method (e.g., 'ideal')
 * @param {object} data.applicationFee - Application fee object
 * @param {string} data.description - Payment description
 * @param {string} data.redirectUrl - URL to redirect after payment
 * @param {string} data.webhookUrl - Webhook URL for payment updates
 * @param {object} data.metadata - Metadata including orderId and storeId
 * @returns {Promise<object>} The Mollie payment object with checkout URL
 *
 */
exports.createMollieOnlinePayment = functions.https.onCall(async (data, context) => {
    // Add logging to debug the incoming data (safe logging to avoid circular references)
    console.log('Received data keys:', Object.keys(data || {}));
    
    // IMPORTANT FIX: Firebase wraps the actual data in data.data
    const actualData = data.data || data;
    
    console.log('Actual data keys:', Object.keys(actualData || {}));
    console.log('Amount:', actualData?.amount);
    console.log('Method:', actualData?.method);
    console.log('Metadata:', actualData?.metadata);
    console.log('OrderId:', actualData?.metadata?.orderId);
    
    // Extract required data from the ACTUAL request data
    const { amount, method, applicationFee, description, redirectUrl, webhookUrl, metadata } = actualData;
    
    // Validate required fields
    if (!metadata?.orderId) {
        console.error('Missing orderId in metadata:', metadata);
        throw new functions.https.HttpsError('invalid-argument', 'The request must include metadata.orderId.');
    }
    
    if (!amount?.value || !amount?.currency) {
        throw new functions.https.HttpsError('invalid-argument', 'The request must include amount.value and amount.currency.');
    }

    try {
        const orderId = metadata.orderId;
        
        // --- 1. FETCH ORDER DETAILS AND DERIVE OWNER/USER ID ---
        const db = admin.firestore(); // Add this line to fix the db reference
        const orderDoc = await db.collection('online_orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', `Order not found with ID: ${orderId}`);
        }
        const orderData = orderDoc.data();
        
        // Get the userId from the order's ownerId
        const userId = orderData.ownerId;
        
        if (!userId) {
            throw new functions.https.HttpsError('failed-precondition', `Order ${orderId} does not specify an ownerId.`);
        }

        // --- 2. FETCH MOLLIE CREDENTIALS AND PROFILE ---
        
        // A. Fetch the client's access token (Document ID IS the userId)
        const tokenDoc = await db.collection('mollie_tokens').doc(userId).get();
        if (!tokenDoc.exists) {
            throw new functions.https.HttpsError('not-found', `Mollie access token not found for userId: ${userId}`);
        }
        const accessToken = tokenDoc.data().access_token; // Note: you had a typo "acces" vs "access"

        // B. Fetch the client's Mollie Profile ID (Query by 'userId' FIELD)
        const profileSnapshot = await db.collection('mollie_profiles')
            .where('userId', '==', userId)
            .limit(1)
            .get();
            
        if (profileSnapshot.empty) {
            throw new functions.https.HttpsError('not-found', `Mollie profile not found for userId: ${userId}`);
        }
        const profileId = profileSnapshot.docs[0].data().mollieProfileId;

        // --- 3. INITIALIZE MOLLIE CLIENT & CREATE PAYMENT ---
        
        console.log('Initializing Mollie client with token for userId:', userId);
        const mollieClient = createMollieClient({ accessToken: accessToken });

        // Prepare payment data similar to your terminal function
        const paymentRequestData = {
            amount: {
                value: amount.value,
                currency: amount.currency,
            },
            method: method || undefined, // Don't specify method if not provided (let customer choose)
            description: description,
            
            // Partner Organization specific fields
            profileId: profileId,
            
            // Application fee (your commission)
           applicationFee: applicationFee ? {
                amount: {
                    value: applicationFee.amount.value,
                    currency: applicationFee.amount.currency,
                },
             description: applicationFee.description} : undefined,
            
            // URLs
            redirectUrl: redirectUrl,
            webhookUrl: webhookUrl,
            
            // Metadata for webhook and tracing
            metadata: {
                ...metadata,
                userId: userId,
                createdBy: 'online-store-function'
            }
        };

        console.log('Payment request data:', JSON.stringify(paymentRequestData, null, 2));

        // Create payment with the data from frontend
        const payment = await mollieClient.payments.create(paymentRequestData);
        
        console.log('Payment created successfully:', payment.id);

        // --- 4. RETURN THE PAYMENT RESPONSE ---
        return {
            payment: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                description: payment.description,
                metadata: payment.metadata,
                _links: {
                    checkout: {
                        href: payment._links.checkout.href
                    }
                }
            }
        };

    } catch (error) {
        console.error("Mollie Online Payment Creation Error:", error);
        
        // Handle Mollie API errors
        if (error.code || error.status) {
            throw error;
        }
        
        // Handle Mollie client errors
        if (error.message && error.message.includes('Mollie')) {
            throw new functions.https.HttpsError('invalid-argument', error.message);
        }
        
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred during payment creation.');
    }
});

exports.createOrder = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { storeId, customer, items, currency = 'EUR', tax = 0, discount = 0, shippingCost = 0, metadata = {} } = req.body;

    // Enhanced validation
    if (!storeId || !customer || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required order payload: storeId, customer, and items are required.' 
      });
    }

    // Validate customer payload
    if (!customer.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer email is required.' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.id || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each item must have id, name, price, and quantity.' 
        });
      }
    }

    let ownerId;

    try {
      // Verify store exists
      const storeDoc = await admin.firestore().collection('stores').doc(storeId).get();
      if (!storeDoc.exists) {
        return res.status(404).json({ 
          success: false, 
          message: 'Store not found.' 
        });
      }

      const storeData = storeDoc.data();
      ownerId = storeData.ownerId
      console.log('Store ID:', storeId);
console.log('Store exists:', storeDoc.exists);
console.log('Store ownerId:', storeData?.ownerId);
console.log('Store name:', storeData?.name);
console.log('Store data keys:', Object.keys(storeData || {}));


      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
      const taxAmount = parseFloat(tax) || 0;
      const discountAmount = parseFloat(discount) || 0;
      const shippingAmount = parseFloat(shippingCost) || 0;
      const total = subtotal + taxAmount + shippingAmount - discountAmount;

      // Generate order number
      const orderNumber = await generateOrderNumber(storeId);

      const orderData = {
        // Basic order info
        storeId,
        orderNumber,
        ownerId,
        
        // Customer information
        customerEmail: customer.email,
        customerName: customer.name || customer.email,
        customerPhone: customer.phone || null,
        
        // Items as array (no subcollection needed!)
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price).toFixed(2),
          quantity: parseInt(item.quantity),
          imageUrl: item.imageUrl || null,
          category: item.category || null,
          sku: item.sku || null,
          subtotal: (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)
        })),
        
        // Financial details
        subtotal: subtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        discount: discountAmount.toFixed(2),
        shippingCost: shippingAmount.toFixed(2),
        total: total.toFixed(2),
        currency: currency.toUpperCase(),
        
        // Order status
        orderStatus: 'pending',
        paymentStatus: 'pending',
        
        // Addresses (if provided)
        billingAddress: customer.billingAddress || null,
        shippingAddress: customer.shippingAddress || null,
        
        // Additional metadata
        metadata: {
          ...metadata,
          source: 'online_store', // vs 'pos', 'api', etc.
          userAgent: req.get('User-Agent') || null,
          ipAddress: req.ip || null
        },
        
        // Timestamps
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create the order
      const orderRef = await admin.firestore().collection('online_orders').add(orderData);
      
      // Log order creation
      console.log(`✅ Order created successfully: ${orderRef.id} for store ${storeId}`);

      return res.status(200).json({ 
        success: true, 
        orderId: orderRef.id,
        orderNumber: orderNumber,
        total: total.toFixed(2),
        currency: currency.toUpperCase()
      });

    } catch (error) {
      console.error('❌ Error creating order:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create order.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});

// 🔢 Helper function to generate unique order numbers
async function generateOrderNumber(storeId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Format: ORD-YYYY-MM-DD-XXX (where XXX is a sequential number)
  const datePrefix = `ORD-${year}-${month}-${day}`;
  
  // Get today's orders count for this store
  const startOfDay = new Date(year, today.getMonth(), today.getDate());
  const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1);
  
  const todaysOrders = await admin.firestore()
    .collection('online_orders')
    .where('storeId', '==', storeId)
    .where('createdAt', '>=', startOfDay)
    .where('createdAt', '<', endOfDay)
    .get();
  
  const sequentialNumber = String(todaysOrders.size + 1).padStart(3, '0');
  
  return `${datePrefix}-${sequentialNumber}`;
}

// 🧮 Alternative: Simple order number generator
// async function generateOrderNumber(storeId) {
//   const timestamp = Date.now();
//   const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//   return `ORD-${storeId.slice(-4).toUpperCase()}-${timestamp}-${random}`;
// }
// ------------------------------------------------------------------------------------------------
// Authenticated API for STORE OWNERS
//
// This function handles secure order management and requires an AUTHENTICATED user.
// It is an onCall function, so Firebase handles the authentication and CORS automatically.
// The owner's UID is automatically available in the context object.
// ------------------------------------------------------------------------------------------------
exports.manageOrders = functions.https.onCall(async (payload, context) => {
  // Check for authenticated user (store owner)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = context.auth.uid;
  const { action, storeId, orderId, status, paymentData } = payload;

  // First, verify that the authenticated user is the owner of the store
  const storeRef = await db.collection('stores').doc(storeId).get();
  if (!storeRef.exists || storeRef.payload().ownerId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to manage this store.');
  }

  try {
    if (action === 'getOrders') {
      const ordersQuery = db.collection('orders')
        .where('storeId', '==', storeId)
        .orderBy('createdAt', 'desc');

      const snapshot = await ordersQuery.get();
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.payload()
      }));

      return { success: true, orders };

    } else if (action === 'updateStatus') {
      if (!orderId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing orderId or status for update action.');
      }
      
      const orderRef = db.collection('orders').doc(orderId);
      const updateData = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (paymentData) {
        Object.assign(updateData, paymentData);
      }
      
      await orderRef.update(updateData);
      
      return { success: true, message: 'Order status updated successfully.' };

    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid action specified.');
    }
  } catch (error) {
    console.error('Error managing orders:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while managing orders.', error.message);
  }
});


exports.mollieWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS if needed
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const paymentId = req.body.id;
  if (!paymentId) {
    console.error("No payment ID in webhook request");
    return res.status(400).send("No payment ID in request");
  }

  console.log("Webhook received for payment:", paymentId);

  try {
    // 🔍 First, get the payment from our database to find the userId
    const paymentDoc = await admin.firestore()
      .collection(COLLECTION_ONLINE_PAYMENTS)
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      console.error("Payment not found in database:", paymentId);
      return res.status(404).send("Payment not found");
    }

    const paymentData = paymentDoc.payload();
    const userId = paymentData.metadata?.userId;
    
    if (!userId) {
      console.error("No userId found in payment metadata:", paymentId);
      return res.status(400).send("No userId in payment metadata");
    }

    // 🌐 Fetch latest payment details from Mollie using the correct user's credentials
    const response = await makeMollieApiRequest(userId, {
      method: "GET",
      url: `${MOLLIE_API_BASE_URL}/payments/${paymentId}`,
      headers: { "Content-Type": "application/json" }
    });

    const updatedPayment = response.payload;
    console.log("Payment status update:", {
      paymentId: paymentId,
      oldStatus: paymentData.status,
      newStatus: updatedPayment.status,
      userId: userId
    });

    // 💾 Update the payment in Firestore
    await admin.firestore()
      .collection(COLLECTION_ONLINE_PAYMENTS)
      .doc(paymentId)
      .update({
        status: updatedPayment.status,
        mollieData: updatedPayment,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        webhookReceivedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    // 🎯 Handle specific status changes
    await handlePaymentStatusChange(updatedPayment, paymentData);

    // ✅ Always respond 200 to Mollie (this is crucial!)
    res.status(200).send("OK");

  } catch (error) {
    console.error("Error handling Mollie webhook:", error);
    
    // 🚨 Still respond 200 to prevent Mollie from retrying
    // Log the error for investigation but don't fail the webhook
    res.status(200).send("Error logged");
  }
});

// 🎯 Helper function to handle different payment statuses
async function handlePaymentStatusChange(updatedPayment, originalPaymentData) {
  const paymentId = updatedPayment.id;
  const newStatus = updatedPayment.status;
  const userId = originalPaymentData.metadata?.userId;
  const storeId = originalPaymentData.metadata?.storeId;

  console.log(`Handling status change to ${newStatus} for payment ${paymentId}`);

  switch (newStatus) {
    case 'paid':
      // 🎉 Payment successful - activate order/service
      await handleSuccessfulPayment(paymentId, userId, storeId, updatedPayment);
      break;
      
    case 'failed':
    case 'canceled':
    case 'expired':
      // ❌ Payment failed - handle accordingly
      await handleFailedPayment(paymentId, userId, storeId, updatedPayment);
      break;
      
    case 'pending':
      // ⏳ Payment is being processed
      console.log(`Payment ${paymentId} is pending`);
      break;
      
    default:
      console.log(`Unhandled payment status: ${newStatus} for payment ${paymentId}`);
  }
}

// 🎉 Handle successful payments
async function handleSuccessfulPayment(paymentId, userId, storeId, paymentData) {
  console.log(`Processing successful payment: ${paymentId}`);
  
  try {
    // Add your business logic here:

    // - Mark order as paid
    // - Send confirmation email
    // - Activate digital products
    // - Update inventory
    // - Trigger fulfillment process
    
    // Example: Update order status
    if (paymentData.metadata?.orderId) {
      await admin.firestore()
        .collection('online_orders')
        .doc(paymentData.metadata.orderId)
        .update({
          paymentStatus: 'paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          storeId: storeId
        });
    }
    
    console.log(`Successfully processed payment: ${paymentId}`);
  } catch (error) {
    console.error(`Error processing successful payment ${paymentId}:`, error);
  }
}

// ❌ Handle failed payments
async function handleFailedPayment(paymentId, userId, storeId, paymentData) {
  console.log(`Processing failed payment: ${paymentId}, status: ${paymentData.status}`);
  
  try {
    // Add your business logic here:
    // - Mark order as failed
    // - Send failure notification
    // - Release reserved inventory
    // - Log for analytics
    
    // Example: Update order status
    if (paymentData.metadata?.orderId) {
      await admin.firestore()
        .collection('online_orders')
        .doc(paymentData.metadata.orderId)
        .update({
          paymentStatus: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          failureReason: paymentData.status
        });
    }
    
    console.log(`Successfully processed failed payment: ${paymentId}`);
  } catch (error) {
    console.error(`Error processing failed payment ${paymentId}:`, error);
  }
}
