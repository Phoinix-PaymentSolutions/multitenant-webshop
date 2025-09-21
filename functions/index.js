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
const axios = require("axios");
const cors = require("cors")({ origin: ['https://your-production-domain.com', 'http://localhost:3000',], methods: ['GET', 'POST'], credentials:true });
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

admin.initializeApp();
const secretClient = new SecretManagerServiceClient();

// Constants
const MOLLIE_API_BASE_URL = "https://api.mollie.com/v2";
const COLLECTION_MOLLIE_TOKENS = "mollie_tokens";
const COLLECTION_ONLINE_PAYMENTS = "online_payments";
const TOKEN_REFRESH_THRESHOLD_MINUTES = 10;
const MOLLIE_TOKEN_URL = "https://api.mollie.com/oauth2/tokens";

// --- Helper functions ---
async function getSecret(name) {
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString().trim();
}

function calculateMinutesUntilExpiry(expiresAt) {
  return (expiresAt.getTime() - new Date().getTime()) / (1000 * 60);
}

async function getTokenDocument(userId) {
  const tokenDoc = await admin.firestore().collection(COLLECTION_MOLLIE_TOKENS).doc(userId).get();
  return { doc: tokenDoc, data: tokenDoc.exists ? tokenDoc.data() : null };
}

async function refreshMollieToken(refreshToken, clientId, clientSecret) {
  const requestData = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const config = {
    method: "POST",
    url: MOLLIE_TOKEN_URL,
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: requestData.toString(),
  };

  return await axios(config);
}

async function updateTokenInFirestore(tokenRef, newTokens) {
  const newExpiryDate = new Date(Date.now() + newTokens.expires_in * 1000);
  await tokenRef.update({
    access_token: newTokens.access_token,
    expires_in: newTokens.expires_in,
    expires_at: admin.firestore.Timestamp.fromDate(newExpiryDate),
    last_refresh: admin.firestore.FieldValue.serverTimestamp(),
    refresh_count: admin.firestore.FieldValue.increment(1),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    needs_reauthorization: false,
    refresh_failed_reason: admin.firestore.FieldValue.delete(),
    refresh_failed_at: admin.firestore.FieldValue.delete(),
  });
  return newExpiryDate;
}

function validateTokenData(tokenData) {
  if (!tokenData) return { isValid: false, reason: "NO_TOKEN" };
  if (tokenData.needs_reauthorization) return { isValid: false, reason: "NEEDS_REAUTH" };
  if (!tokenData.expires_at || !tokenData.refresh_token)
    return { isValid: false, reason: "NEEDS_REAUTH" };
  return { isValid: true };
}

async function performTokenRefresh(userId) {
  const { doc: tokenDoc, data: tokenData } = await getTokenDocument(userId);
  const validation = validateTokenData(tokenData);
  if (!validation.isValid) throw new functions.https.HttpsError("permission-denied", validation.reason);

  const expiresAt = tokenData.expires_at.toDate();
  const minutesUntilExpiry = calculateMinutesUntilExpiry(expiresAt);
  if (minutesUntilExpiry > TOKEN_REFRESH_THRESHOLD_MINUTES) return tokenData.access_token;

  const [clientId, clientSecret] = await Promise.all([getSecret("Mollie-AppID"), getSecret("Mollie-ClientSecret")]);
  const tokenResponse = await refreshMollieToken(tokenData.refresh_token, clientId, clientSecret);
  await updateTokenInFirestore(tokenDoc.ref, tokenResponse.data);
  return tokenResponse.data.access_token;
}

async function getMollieAccessTokenWithRefresh(userId) {
  const { doc: tokenDoc, data: tokenData } = await getTokenDocument(userId);
  if (!tokenDoc.exists || !tokenData) throw new functions.https.HttpsError("not-found", "No Mollie token found for this user");

  const expiresAt = tokenData.expires_at.toDate();
  const minutesUntilExpiry = calculateMinutesUntilExpiry(expiresAt);
  if (minutesUntilExpiry <= TOKEN_REFRESH_THRESHOLD_MINUTES) return await performTokenRefresh(userId);

  return tokenData.access_token;
}

async function makeMollieApiRequest(userId, requestConfig, maxRetries = 1) {
  let attempt = 0;
  let lastError = null;
  while (attempt <= maxRetries) {
    try {
      const accessToken = await getMollieAccessTokenWithRefresh(userId);
      const config = { ...requestConfig, headers: { ...requestConfig.headers, Authorization: `Bearer ${accessToken}` } };
      const response = await axios(config);
      return response;
    } catch (error) {
      lastError = error;
      attempt++;
      if (error.response?.status === 401 && attempt <= maxRetries) await performTokenRefresh(userId);
      else break;
    }
  }
  throw lastError;
}

// --- Online payment function (NO AUTH REQUIRED) ---
exports.createMollieOnlinePayment = functions.https.onCall(async (data, context) => {
  // Validate required data from the frontend payload
  if (!data.amount || !data.currency || !data.description || !data.metadata || !data.metadata.storeId) {
    throw new functions.https.HttpsError("invalid-argument", "amount, currency, description, and metadata.storeId are required");
  }

  // Securely get the webshop owner's ID from the backend
  const storeId = data.metadata.storeId;
  const storeRef = admin.firestore().collection('stores').doc(storeId);
  const storeDoc = await storeRef.get();

  if (!storeDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Store not found with the provided storeId");
  }

  const userId = storeDoc.data().ownerId; // Get the owner's ID from the Firestore document

  if (!userId) {
      throw new functions.https.HttpsError("internal", "Store data is missing ownerId");
  }
  
  const paymentData = {
    amount: { currency: data.currency, value: data.amount },
    description: data.description,
    redirectUrl: data.redirectUrl,
    webhookUrl: data.webhookUrl,
    metadata: {
        ...data.metadata,
        userId // Add the secured userId to metadata for webhook
    } || {},
    method: data.method || "ideal", // Allow frontend to specify payment method
  };

  try {
    const response = await makeMollieApiRequest(userId, {
      method: "POST",
      url: `${MOLLIE_API_BASE_URL}/payments`,
      headers: { "Content-Type": "application/json" },
      data: paymentData,
    });

    const payment = response.data;

    // Store payment in Firestore
    await admin.firestore().collection(COLLECTION_ONLINE_PAYMENTS).doc(payment.id).set({
      userId, // Use the secured userId
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata,
      createdAt: payment.createdAt ? new Date(payment.createdAt) : admin.firestore.FieldValue.serverTimestamp(),
      mode: payment.mode,
      mollieData: payment,
      customerInfo: data.customerInfo || null, // Optional customer data from frontend
      domain: data.domain || null, // Track which domain the payment came from
    });

    return { success: true, payment };
  } catch (error) {
    console.error("Mollie payment creation error:", error.message);
    throw new functions.https.HttpsError("internal", "Failed to create online payment", { error: error.message });
  }
});

exports.createOrder = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { storeId, customer, items } = req.body;

    // Validate required data from the request body
    if (!storeId || !customer || !items || items.length === 0) {
      return res.status(400).send('Missing required order data.');
    }

    try {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const orderData = {
        storeId,
        customer,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        total,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const orderRef = await db.collection('orders').add(orderData);
      return res.status(200).json({ success: true, orderId: orderRef.id });

    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ success: false, message: 'Failed to create order.' });
    }
  });
});

// ------------------------------------------------------------------------------------------------
// Authenticated API for STORE OWNERS
//
// This function handles secure order management and requires an AUTHENTICATED user.
// It is an onCall function, so Firebase handles the authentication and CORS automatically.
// The owner's UID is automatically available in the context object.
// ------------------------------------------------------------------------------------------------
exports.manageOrders = functions.https.onCall(async (data, context) => {
  // Check for authenticated user (store owner)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = context.auth.uid;
  const { action, storeId, orderId, status, paymentData } = data;

  // First, verify that the authenticated user is the owner of the store
  const storeRef = await db.collection('stores').doc(storeId).get();
  if (!storeRef.exists || storeRef.data().ownerId !== userId) {
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
        ...doc.data()
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
