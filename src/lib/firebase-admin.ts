// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json';

const apps = admin.apps;

if (!apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const adminDb = admin.firestore();