import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../constants/roles';
import type { Permission } from '../types/permission.types';
import { getProfilePermissions } from '../types/businessProfile.types';
import type { BusinessProfileType } from '../types/businessProfile.types';

export function usePermissions() {
  const { permissions, userRole, activeRole, additionalMenus } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    // Use active role if available, otherwise fall back to userRole
    const currentRole = activeRole || userRole;
    
    console.log('🔍 [usePermissions] Checking permission:', {
      permission,
      currentRole,
      userRole,
      activeRole,
      permissions,
      additionalMenus
    });
    
    // Le super admin a toutes les permissions
    if (currentRole === 'super_admin') return true;
    
    // Check if the user has this permission in their additional menus
    if (additionalMenus && additionalMenus.includes(permission)) {
      console.log('🔍 [usePermissions] Permission found in additionalMenus');
      return true;
    }
    
    if (!permissions || !Array.isArray(permissions)) {
      console.log('🔍 [usePermissions] No permissions array found');
      return false;
    }
    
    const hasIt = permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission);
    console.log('🔍 [usePermissions] Permission check result:', hasIt);
    return hasIt;
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  return { hasPermission, hasAllPermissions, hasAnyPermission };
}