import admin from 'firebase-admin';
import { config } from './config';

const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const firebaseAuth = admin.auth();