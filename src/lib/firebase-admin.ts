import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 * Returns null if not configured (development mode without service account)
 */
export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.warn('Firebase Admin: FIREBASE_SERVICE_ACCOUNT_KEY not set');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    return adminApp;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
}

/**
 * Get Firebase Admin Firestore instance
 * Returns null if not configured
 */
export function getAdminFirestore(): Firestore | null {
  if (adminDb) return adminDb;
  
  const app = getAdminApp();
  if (!app) return null;
  
  adminDb = getFirestore(app);
  return adminDb;
}

/**
 * Check if Firebase Admin is configured
 */
export function isAdminConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}
