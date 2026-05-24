import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

interface UserRole {
  isAdmin: boolean;
  isShepherd: boolean;
  isADN: boolean;
  adminRole?: string;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Check in users table
    const { data: userRows } = await supabase
      .from('users')
      .select('role, status')
      .eq('church_id', getChurchId())
      .eq('id', userId)
      .eq('status', 'active')
      .limit(1);

    let isAdmin = false;
    let isShepherd = false;
    let isADN = false;
    let adminRole: string | null = null;

    if (userRows && userRows.length > 0) {
      const role = userRows[0].role;
      isAdmin = role === 'admin' || role === 'pasteur';
      isShepherd = role === 'shepherd' || role === 'intern';
      isADN = role === 'adn';
    }

    // Check admins table for super_admin
    if (!isAdmin) {
      const { data: adminRows } = await supabase
        .from('admins')
        .select('role')
        .eq('id', userId)
        .eq('role', 'super_admin')
        .limit(1);

      if (adminRows && adminRows.length > 0) {
        isAdmin = true;
        adminRole = 'super_admin';
      }
    }

    return { isAdmin, isShepherd, isADN, adminRole: adminRole || undefined };
  } catch (error) {
    console.error('Error getting user role:', error);
    return { isAdmin: false, isShepherd: false, isADN: false };
  }
}
