import admin from 'firebase-admin';
import { config } from './config';

try {
  const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.warn("⚠️ Firebase Initialization Failed.");
  console.warn("If you are running locally, ensure FIREBASE_SERVICE_ACCOUNT in .env is a structurally valid JSON with a 'private_key' and 'client_email'.");
  console.warn("Local auth tests bypassing Firebase will still work using the magic MOCK_TOKEN_LEON@TEST.COM token.");
}

export const firebaseAuth = admin.apps.length ? admin.auth() : {} as admin.auth.Auth;
