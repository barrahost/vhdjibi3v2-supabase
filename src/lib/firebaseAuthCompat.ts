/**
 * firebaseAuthCompat.ts
 * Stub for firebase/auth — deleteUser is a no-op since we use
 * custom auth (phone+password in Supabase), not Firebase Auth.
 */

export async function deleteUser(_user: any): Promise<void> {
  // No-op: Firebase Auth is not used; user deletion is handled
  // directly on the Supabase 'users' table via deleteDoc/supabase.
  console.warn('[firebaseAuthCompat] deleteUser: Firebase Auth not in use. Delete the user row directly from Supabase.');
}

export function getAuth(_app?: any) { return {}; }
export function signOut(_auth: any) { return Promise.resolve(); }
