import { supabase } from '../../lib/supabase';
import { ROLES, ROLE_PERMISSIONS } from '../../constants/roles';
import type { Role, Permission } from '../../types/permission.types';

export class RoleService {
  static async getUserRole(userId: string): Promise<Role | null> {
    if (!userId) return null;

    try {
      // Check users table first
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('uid', userId)
        .limit(1);

      if (userData && userData.length > 0) {
        return userData[0].role as Role;
      }

      // Check admins table (super_admin only)
      const { data: adminData } = await supabase
        .from('admins')
        .select('role')
        .eq('uid', userId)
        .eq('role', 'super_admin')
        .limit(1);

      if (adminData && adminData.length > 0) {
        return ROLES.SUPER_ADMIN;
      }

      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  static async getUserPermissions(userId: string): Promise<Permission[]> {
    if (!userId) return [];

    try {
      const role = await this.getUserRole(userId);
      if (!role) return [];
      return Array.from(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || []) as Permission[];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }
}
