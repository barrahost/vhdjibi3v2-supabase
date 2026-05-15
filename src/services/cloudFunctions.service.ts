import { collection, query, where, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Service for password operations.
 *
 * The app uses a custom Firestore-based auth system: `AuthContext.login`
 * validates the typed password against the `password` field on each user
 * document. We therefore update that field directly from the client and
 * bypass the Firebase Cloud Function (which is not auto-deployed here).
 *
 * IMPORTANT: when possible, callers should pass the Firestore document id
 * (`docId`) so that we update the EXACT same document that login reads.
 * Searching by `uid` alone can miss the right document when the `uid`
 * field is missing, was generated synthetically, or when duplicates exist.
 */
export class CloudFunctionsService {
  static async resetUserPassword(
    uid: string,
    newPassword: string,
    isSelfReset = false,
    currentPassword?: string,
    docId?: string
  ): Promise<{ success: true }> {
    if ((!uid && !docId) || !newPassword) {
      throw new Error('Identifiant utilisateur et nouveau mot de passe requis');
    }

    if (newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const savedUserRaw = localStorage.getItem('user');
    const callerUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

    if (!callerUser) {
      throw new Error('Vous devez être connecté pour effectuer cette action');
    }

    if (!isSelfReset) {
      const isAdmin =
        callerUser.role === 'admin' ||
        callerUser.role === 'super_admin' ||
        callerUser.role === 'pasteur' ||
        (Array.isArray(callerUser.businessProfiles) &&
          callerUser.businessProfiles.some(
            (p: any) =>
              p &&
              (p.type === 'admin' || p.type === 'super_admin') &&
              p.isActive !== false
          ));

      if (!isAdmin) {
        throw new Error(
          "Seuls les administrateurs peuvent réinitialiser le mot de passe d'un autre utilisateur"
        );
      }
    } else if (uid && callerUser.uid !== uid) {
      throw new Error(
        "Vous ne pouvez pas réinitialiser le mot de passe d'un autre utilisateur"
      );
    }

    let resolvedDocId: string | null = null;
    let collectionName: 'users' | 'admins' = 'users';
    let targetData: any = null;

    // Strategy 1: direct lookup by docId (most reliable — matches login lookup)
    if (docId) {
      const usersDoc = await getDoc(doc(db, 'users', docId));
      if (usersDoc.exists()) {
        resolvedDocId = usersDoc.id;
        targetData = usersDoc.data();
      } else {
        const adminsDoc = await getDoc(doc(db, 'admins', docId));
        if (adminsDoc.exists()) {
          resolvedDocId = adminsDoc.id;
          collectionName = 'admins';
          targetData = adminsDoc.data();
        }
      }
    }

    // Strategy 2: fallback — lookup by uid field
    if (!resolvedDocId && uid) {
      const usersSnap = await getDocs(
        query(collection(db, 'users'), where('uid', '==', uid))
      );
      if (!usersSnap.empty) {
        resolvedDocId = usersSnap.docs[0].id;
        targetData = usersSnap.docs[0].data();
      } else {
        const adminsSnap = await getDocs(
          query(collection(db, 'admins'), where('uid', '==', uid))
        );
        if (!adminsSnap.empty) {
          resolvedDocId = adminsSnap.docs[0].id;
          collectionName = 'admins';
          targetData = adminsSnap.docs[0].data();
        }
      }
    }

    if (!resolvedDocId || !targetData) {
      throw new Error('Utilisateur introuvable');
    }

    if (isSelfReset && targetData.password && currentPassword !== targetData.password) {
      throw new Error('Mot de passe actuel incorrect');
    }

    console.log('[resetUserPassword] Updating password on:', {
      collection: collectionName,
      docId: resolvedDocId,
      phone: targetData.phone,
      hadPreviousPassword: !!targetData.password,
    });

    await updateDoc(doc(db, collectionName, resolvedDocId), {
      password: newPassword,
      updatedAt: new Date(),
    });

    return { success: true };
  }
}
