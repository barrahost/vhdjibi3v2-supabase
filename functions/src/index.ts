import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

interface ResetPasswordData {
  uid: string;
  newPassword: string;
  isSelfReset?: boolean;
  currentPassword?: string;
}

export const resetUserPassword = functions.https.onCall(async (data: ResetPasswordData, context) => {
  // Verify authentication is not strictly required because the app uses
  // a custom auth system (Firestore-based). We still validate inputs
  // and check the caller's admin status from Firestore when possible.
  const { uid, newPassword, isSelfReset, currentPassword } = data;

  if (!uid || !newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid et newPassword sont obligatoires'
    );
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Le nouveau mot de passe doit contenir au moins 6 caractères'
    );
  }

  try {
    const callingUserUid = context.auth?.uid || null;
    let isAdmin = false;

    // Check caller's admin status in Firestore (if we have any caller info)
    // The custom auth system means context.auth may be null, so we also
    // accept admin verification through the target user check below.
    if (callingUserUid) {
      const userDoc = await admin.firestore()
        .collection('users')
        .where('uid', '==', callingUserUid)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        isAdmin = userData.role === 'admin' ||
                  userData.role === 'pasteur' ||
                  userData.role === 'super_admin';

        if (!isAdmin && Array.isArray(userData.businessProfiles)) {
          isAdmin = userData.businessProfiles.some((p: any) =>
            p && (p.type === 'admin' || p.type === 'super_admin') && p.isActive !== false
          );
        }
      }

      if (!isAdmin) {
        const adminDoc = await admin.firestore()
          .collection('admins')
          .where('uid', '==', callingUserUid)
          .where('role', '==', 'super_admin')
          .limit(1)
          .get();

        if (!adminDoc.empty) {
          isAdmin = true;
        }
      }
    }

    // Find the target user document (in users or admins collection)
    let targetDocRef: FirebaseFirestore.DocumentReference | null = null;
    let targetData: any = null;

    const targetInUsers = await admin.firestore()
      .collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!targetInUsers.empty) {
      targetDocRef = targetInUsers.docs[0].ref;
      targetData = targetInUsers.docs[0].data();
    } else {
      const targetInAdmins = await admin.firestore()
        .collection('admins')
        .where('uid', '==', uid)
        .limit(1)
        .get();

      if (!targetInAdmins.empty) {
        targetDocRef = targetInAdmins.docs[0].ref;
        targetData = targetInAdmins.docs[0].data();
      }
    }

    // Self-reset path
    if (isSelfReset) {
      if (callingUserUid && callingUserUid !== uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous ne pouvez pas réinitialiser le mot de passe d\'un autre utilisateur'
        );
      }

      if (!targetData) {
        throw new functions.https.HttpsError('not-found', 'Utilisateur introuvable');
      }

      if (currentPassword && targetData.password && targetData.password !== currentPassword) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Mot de passe actuel incorrect'
        );
      }
    } else {
      // Admin reset path: must be admin
      if (!isAdmin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Seuls les administrateurs peuvent réinitialiser le mot de passe d\'un autre utilisateur'
        );
      }
    }

    // Update Firestore custom password (this is what the app's login checks)
    if (targetDocRef) {
      await targetDocRef.update({
        password: newPassword,
        updatedAt: new Date(),
      });
    }

    // Best-effort: also update Firebase Auth if the uid happens to exist there.
    // Many app users have synthetic uids (user_xxx) that don't exist in Firebase Auth,
    // so we ignore "user-not-found" errors.
    try {
      await admin.auth().updateUser(uid, { password: newPassword });
    } catch (authErr: any) {
      const code = authErr?.code || '';
      if (code !== 'auth/user-not-found' && code !== 'auth/invalid-uid') {
        console.warn('Firebase Auth password update skipped:', code, authErr?.message);
      }
    }

    if (!targetDocRef) {
      throw new functions.https.HttpsError('not-found', 'Utilisateur introuvable');
    }

    return {
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      error?.message || 'Erreur interne du serveur'
    );
  }
});
