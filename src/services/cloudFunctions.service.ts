import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

/**
 * Service for password operations.
 *
 * The app uses a custom Supabase-based auth system: `AuthContext.login`
 * validates the typed password against the `password` field on each user
 * document. We therefore update that field directly from the client.
 *
 * IMPORTANT: when possible, callers should pass the document id (`docId`)
 * so that we update the EXACT same document that login reads.
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

    // Strategy 1: direct lookup by docId
    if (docId) {
      const { data: usersRow } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('id', docId)
        .single();
      if (usersRow) {
        resolvedDocId = usersRow.id;
        targetData = usersRow;
      } else {
        const { data: adminsRow } = await supabase
          .from('admins')
          .select('*')
          .eq('id', docId)
          .single();
        if (adminsRow) {
          resolvedDocId = adminsRow.id;
          collectionName = 'admins';
          targetData = adminsRow;
        }
      }
    }

    // Strategy 2: fallback — lookup by uid field
    if (!resolvedDocId && uid) {
      const { data: usersRows } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('uid', uid)
        .limit(1);
      if (usersRows && usersRows.length > 0) {
        resolvedDocId = usersRows[0].id;
        targetData = usersRows[0];
      } else {
        const { data: adminsRows } = await supabase
          .from('admins')
          .select('*')
          .eq('uid', uid)
          .limit(1);
        if (adminsRows && adminsRows.length > 0) {
          resolvedDocId = adminsRows[0].id;
          collectionName = 'admins';
          targetData = adminsRows[0];
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

    const { error } = await supabase
      .from(collectionName)
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('id', resolvedDocId);

    if (error) throw error;

    return { success: true };
  }
}
