import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ROLES, ROLE_PERMISSIONS } from '../../constants/roles';
import type { Role, Permission } from '../../types/permission.types';

export class RoleService {
  static async getUserRole(userId: string): Promise<Role | null> {
    if (!userId) return null;

    try {
      // Check in users collection first (includes regular admins now)
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        return userData.role as Role;
      }

      // If not found in users, check in admins (only super_admin should be here)
      const adminQuery = query(
        collection(db, 'admins'),
        where('uid', '==', userId),
        where('role', '==', 'super_admin')
      );
      const adminSnapshot = await getDocs(adminQuery);
      
      if (!adminSnapshot.empty) {
        const adminData = adminSnapshot.docs[0].data();
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