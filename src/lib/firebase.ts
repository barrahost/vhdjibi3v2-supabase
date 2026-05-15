import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions'; 
import { writeBatch } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCyzCfrYsKmh2MXHKLB5SMKHuYqDSt_tM8",
  authDomain: "cvdh-9e570.firebaseapp.com",
  projectId: "cvdh-9e570",
  storageBucket: "cvdh-9e570.appspot.com",
  messagingSenderId: "767149392286",
  appId: "1:767149392286:web:10c3990dbaea5ba73bd68f"
};

// Initialize Firebase with enhanced network resilience
const app = initializeApp(firebaseConfig);

// Initialize Firestore with optimized network settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  ignoreUndefinedProperties: true
});

// Initialize Storage
export const storage = getStorage(app);

// Initialize Functions
export const functions = getFunctions(app);

// Export writeBatch for convenience
export { writeBatch };

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Connect to emulators only if explicitly enabled via environment variable
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    // Connect to Functions emulator if needed
    // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
    console.log('Falling back to production Firebase');
  }
}

// Connect to emulators only if explicitly enabled via environment variable
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    // Connect to Functions emulator if needed
    // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
    console.log('Falling back to production Firebase');
  }
}

// Enable offline persistence with error handling
export const enableOfflineMode = async () => {
  try {
    // Firestore is already configured for offline persistence with persistentLocalCache
    console.log('Offline mode enabled for Firestore');
  } catch (error) {
    console.error('Failed to enable offline persistence:', error);
  }
};