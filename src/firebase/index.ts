'use client';

import { firebaseConfig, useEmulators, emulatorConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Track if emulators have been connected (only do once)
let emulatorsConnected = false;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  // Connect to emulators if enabled (only once)
  if (useEmulators && !emulatorsConnected) {
    try {
      const [authHost, authPort] = emulatorConfig.auth.split(':');
      const [firestoreHost, firestorePort] = emulatorConfig.firestore.split(':');
      const [storageHost, storagePort] = emulatorConfig.storage.split(':');

      connectAuthEmulator(auth, `http://${emulatorConfig.auth}`, { disableWarnings: true });
      connectFirestoreEmulator(firestore, firestoreHost, parseInt(firestorePort));
      connectStorageEmulator(storage, storageHost, parseInt(storagePort));
      
      emulatorsConnected = true;
      console.log('🔥 Connected to Firebase Emulators');
    } catch (error) {
      console.error('Failed to connect to Firebase Emulators:', error);
    }
  }

  return {
    firebaseApp,
    auth,
    firestore,
    storage
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
