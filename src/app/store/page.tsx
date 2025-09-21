import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { getFirestore } from 'firebase-admin/firestore';
import { notFound } from 'next/navigation';

// 💡 IMPORTANT: Initialize the Firebase Admin SDK. This should only be done once.
if (!getApps().length) {
  initializeApp({
    // Load your private service account key securely from an environment variable
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS!)),
  });
}

// 💡 This is the handler for your secure API endpoint.
// The client will send a request to this endpoint, and we will verify the token.
export async function GET(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const appCheckToken = requestHeaders.get('X-Firebase-AppCheck');
  const storeId = new URL(request.url).searchParams.get('storeId');

  // 1. Check if the App Check token is present
  if (!appCheckToken) {
    console.error('Missing App Check token.');
    return NextResponse.json({ error: 'Unauthorized: Missing App Check token.' }, { status: 401 });
  }

  // 2. Check if the store ID is present
  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required.' }, { status: 400 });
  }

  try {
    // 3. Verify the token using the Admin SDK. This is the core security step.
    await getAppCheck().verifyToken(appCheckToken);
    
    // 4. If the token is valid, securely fetch the data from Firestore.
    console.log('App Check token verified. Fetching data from Firestore...');
    const firestore = getFirestore();
    const storeRef = firestore.collection('stores').doc(storeId);
    const doc = await storeRef.get();

    if (!doc.exists) {
      notFound(); // This will render Next.js's 404 page
    }
    
    const storeData = doc.data();

    // 5. Send the data back as a JSON response
    return NextResponse.json(storeData);

  } catch (error) {
    // 6. If token verification fails, return an unauthorized error.
    console.error('App Check token verification failed:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid App Check token.' }, { status: 401 });
  }
}
