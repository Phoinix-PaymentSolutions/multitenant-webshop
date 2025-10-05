// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

const apps = admin.apps;

if (!apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The replace fixes newline characters in the key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

export const adminDb = admin.firestore();