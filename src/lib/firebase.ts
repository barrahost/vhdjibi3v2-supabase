/**
 * firebase.ts — re-exports from Supabase-backed compatibility shims.
 * Kept for backward compatibility with components that import from this file.
 */
export {
  db,
  collection, doc, query,
  where, orderBy, limit, documentId,
  getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot,
  writeBatch,
  onData,
  Timestamp,
  increment,
} from './firebaseCompat';

// auth stub (signOut is a no-op)
export const auth = {
  signOut: () => Promise.resolve(),
  currentUser: null,
};

// storage stub
export const storage = {};

// functions stub
export const functions = {};

// Stubs for functions that existed only for Firebase internals
export function enableOfflineMode(): void {
  // No-op: Supabase does not require offline mode configuration.
}
