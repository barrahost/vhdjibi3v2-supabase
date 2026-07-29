import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

const BACKUP_KEY = 'impersonator_backup';

/** Session admin sauvegardée pendant un aperçu "connecté en tant que". */
export function getImpersonatorBackup(): any | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  return !!localStorage.getItem(BACKUP_KEY);
}

/**
 * Bascule la session courante (admin) vers celle de l'utilisateur cible.
 * La session admin est sauvegardée pour pouvoir revenir. Recharge l'appli
 * pour que AuthContext recalcule tout (permissions, menu, dashboard).
 */
export async function impersonateUser(targetUserId: string): Promise<void> {
  if (isImpersonating()) {
    throw new Error('Déjà en mode aperçu — revenez d\'abord à votre compte.');
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('church_id', getChurchId())
    .eq('id', targetUserId)
    .eq('status', 'active')
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Utilisateur introuvable ou inactif.');

  // Même forme que la session produite par AuthContext.login()
  const targetUser = {
    id: row.id,
    uid: row.uid,
    fullName: row.full_name,
    nickname: row.nickname,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role,
    roles: row.roles,
    businessProfiles: row.business_profiles,
    activeProfiles: row.active_profiles,
    additionalMenus: row.additional_menus || [],
    location: row.location,
    coordinates: row.coordinates,
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const currentSession = localStorage.getItem('user');
  if (!currentSession) throw new Error('Session admin introuvable.');

  localStorage.setItem(BACKUP_KEY, currentSession);
  localStorage.setItem('user', JSON.stringify(targetUser));
  window.location.href = '/';
}

/** Restaure la session admin sauvegardée et recharge l'appli. */
export function stopImpersonation(): void {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (!backup) return;
  localStorage.setItem('user', backup);
  localStorage.removeItem(BACKUP_KEY);
  window.location.href = '/';
}
