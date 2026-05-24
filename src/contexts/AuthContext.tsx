import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { DEFAULT_PASSWORDS } from '../constants/auth';
import { RoleService } from '../services/auth/roleService';
import type { Permission, Role, BaseRole } from '../types/permission.types';
import { ROLE_PERMISSIONS } from '../constants/roles';
import { PROFILE_PERMISSIONS, getProfilePermissions } from '../types/businessProfile.types';
import type { BusinessProfileType } from '../types/businessProfile.types';
import { validatePhoneNumber } from '../utils/phoneValidation';
import toast from 'react-hot-toast';

// Helper : churchId courant depuis le hostname (même logique que ChurchContext)
function getCurrentChurchId(): string {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'agc'; // dev
  }
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === 'bergerie') return ''; // super admin
    return subdomain;
  }
  return ''; // root domain = super admin
}

// ---------------------------------------------------------------------------
// Mappers Supabase (snake_case) → camelCase
// ---------------------------------------------------------------------------
function mapUserRow(row: any) {
  return {
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
}

function mapAdminRow(row: any) {
  return {
    id: row.id,
    uid: row.uid,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthState {
  user: any | null;
  loading: boolean;
  userRole: Role | null;
  availableRoles: BaseRole[];
  activeRole: BaseRole | null;
  additionalMenus: string[];
  permissions: Permission[];
  login: (phone: string, password: string) => Promise<any>;
  logout: () => void;
  switchRole: (role: BaseRole | BusinessProfileType) => void;
  switchToProfile: (profileType: BusinessProfileType) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  userRole: null,
  availableRoles: [],
  activeRole: null,
  additionalMenus: [],
  permissions: [],
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
  switchToProfile: async () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    userRole: null,
    availableRoles: [],
    activeRole: null,
    additionalMenus: [],
    permissions: [],
    login: async () => null,
    logout: () => {},
    switchRole: () => {},
    switchToProfile: async () => {},
  });

  // -------------------------------------------------------------------------
  // Restore session on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const userData = JSON.parse(savedUser);

    const loadPermissions = async () => {
      // Load additional menus for shepherds / interns from Supabase
      let additionalMenus: string[] = userData.additionalMenus || [];
      if (userData.role === 'shepherd' || userData.role === 'intern') {
        try {
          const { data } = await supabase
            .from('users')
            .select('additional_menus')
            .eq('church_id', getChurchId())
            .eq('uid', userData.uid)
            .limit(1);
          if (data && data.length > 0) {
            additionalMenus = data[0].additional_menus || [];
          }
        } catch (error) {
          console.error('Error loading additional menus:', error);
        }
      }

      let availableRoles: BaseRole[] = [];
      let activeRole: BaseRole | null = null;
      let activePermissions: Permission[] = [];

      if (userData.businessProfiles && Array.isArray(userData.businessProfiles) && userData.businessProfiles.length > 0) {
        availableRoles = userData.businessProfiles.map((p: any) => p.type);

        const savedActiveProfile = localStorage.getItem('activeProfileType') as BusinessProfileType | null;
        let chosenProfile: BusinessProfileType | null = null;

        if (savedActiveProfile && availableRoles.includes(savedActiveProfile as BaseRole)) {
          chosenProfile = savedActiveProfile;
        } else {
          const primary = userData.businessProfiles.find((p: any) => p.isPrimary);
          const active = userData.businessProfiles.find((p: any) => p.isActive);
          chosenProfile = (primary?.type ?? active?.type ?? userData.businessProfiles[0]?.type) as BusinessProfileType;
        }

        userData.businessProfiles = userData.businessProfiles.map((p: any) => ({
          ...p,
          isActive: p.type === chosenProfile,
        }));

        activePermissions = getProfilePermissions(chosenProfile) as Permission[];
        activeRole = chosenProfile as BaseRole;
        localStorage.setItem('activeProfileType', chosenProfile);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        if (userData.roles?.primary) {
          availableRoles.push(userData.roles.primary);
          if (userData.roles.secondary) availableRoles.push(...userData.roles.secondary);
        } else if (userData.role) {
          availableRoles.push(userData.role);
        }
        activeRole = userData.activeRole || (userData.role as BaseRole);
        activePermissions = getUserPermissions(activeRole as Role);
      }

      setState(prev => ({
        ...prev,
        user: userData,
        userRole: userData.role,
        availableRoles,
        activeRole,
        additionalMenus,
        permissions: activePermissions,
        loading: false,
      }));
    };

    loadPermissions();
  }, []);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const getUserPermissions = (role: Role): Permission[] => {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    return Array.isArray(permissions) ? [...permissions] : [];
  };

  const getRoleLabel = (role: BaseRole | BusinessProfileType) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrateur';
      case 'shepherd': return 'Berger(e)';
      case 'adn': return 'ADN';
      case 'department_leader': return 'Responsable Département';
      case 'family_leader': return 'Responsable de Famille';
      default: return 'Utilisateur';
    }
  };

  // -------------------------------------------------------------------------
  // login()
  // -------------------------------------------------------------------------
  const login = async (phone: string, password: string) => {
    try {
      if (!phone || !password) throw new Error('Phone and password required');

      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Numéro de téléphone invalide');
      }

      const formattedPhone = phoneValidation.formattedNumber;
      const cleanPhone = phoneValidation.cleanNumber;
      const phoneCandidates = Array.from(new Set([formattedPhone, cleanPhone].filter(Boolean)));

      console.log('Attempting login with:', { phone: formattedPhone, passwordLength: password.length });

      // Query Supabase: users + admins (filtrés par church_id)
      const churchId = getCurrentChurchId();
      const [usersRes, adminsRes] = await Promise.all([
        churchId
          ? supabase
              .from('users')
              .select('*')
              .eq('church_id', getChurchId())
              .in('phone', phoneCandidates)
              .eq('status', 'active')
              .eq('church_id', churchId)
          : supabase
              .from('users')
              .select('*')
              .eq('church_id', getChurchId())
              .in('phone', phoneCandidates)
              .eq('status', 'active'),
        supabase
          .from('admins')
          .select('*')
          .in('phone', phoneCandidates)
          .eq('role', 'super_admin')
          .eq('status', 'active'),
      ]);

      type Candidate = { data: any; collectionName: 'users' | 'admins' };
      const candidateMap = new Map<string, Candidate>();

      (usersRes.data || []).forEach((row: any) => {
        candidateMap.set(`users:${row.id}`, { data: mapUserRow(row), collectionName: 'users' });
      });
      (adminsRes.data || []).forEach((row: any) => {
        candidateMap.set(`admins:${row.id}`, { data: mapAdminRow(row), collectionName: 'admins' });
      });

      const candidateDocs = Array.from(candidateMap.values());

      if (candidateDocs.length === 0) {
        console.error('User profile not found');
        throw new Error('User not found');
      }

      const validateCandidatePassword = (candidateData: any) => {
        if (candidateData.password && password === String(candidateData.password)) {
          return { isValid: true, matchType: 'custom_password' };
        }

        if (candidateData.businessProfiles && candidateData.businessProfiles.length > 0) {
          for (const profile of candidateData.businessProfiles) {
            if (['shepherd', 'department_leader', 'family_leader', 'evangelist'].includes(profile.type)) {
              if (password === DEFAULT_PASSWORDS.SHEPHERD) {
                return { isValid: true, matchType: `business_profile:${profile.type}` };
              }
            } else if (profile.type === 'adn' && password === DEFAULT_PASSWORDS.ADN) {
              return { isValid: true, matchType: 'business_profile:adn' };
            } else if (profile.type === 'admin' && password === DEFAULT_PASSWORDS.ADMIN) {
              return { isValid: true, matchType: 'business_profile:admin' };
            }
          }
        }

        if (candidateData.role) {
          if (['shepherd', 'adn', 'department_leader', 'family_leader', 'evangelist'].includes(candidateData.role)) {
            const defaultPassword = candidateData.role === 'adn' ? DEFAULT_PASSWORDS.ADN : DEFAULT_PASSWORDS.SHEPHERD;
            if (password === defaultPassword) {
              return { isValid: true, matchType: `legacy_role:${candidateData.role}` };
            }
          } else if (['admin', 'super_admin'].includes(candidateData.role) && password === DEFAULT_PASSWORDS.ADMIN) {
            return { isValid: true, matchType: `legacy_role:${candidateData.role}` };
          }
        }

        return { isValid: false, matchType: null };
      };

      const customPasswordMatch = candidateDocs.find(c => {
        return c.data.password && password === String(c.data.password);
      });
      const fallbackMatch = candidateDocs.find(c => validateCandidatePassword(c.data).isValid);
      const matchedCandidate = customPasswordMatch || fallbackMatch;

      console.log('Login candidates found:', candidateDocs.map(c => {
        const validation = validateCandidatePassword(c.data);
        return {
          role: c.data.role,
          docId: c.data.id,
          collection: c.collectionName,
          hasStoredPassword: !!c.data.password,
          matchesPassword: validation.isValid,
          matchType: validation.matchType,
        };
      }));

      if (!matchedCandidate) {
        console.error('Invalid password');
        throw new Error('Invalid password');
      }

      const userData = matchedCandidate.data;
      console.log('Password validated:', {
        role: userData.role,
        docId: userData.id,
        collection: matchedCandidate.collectionName,
        matchType: validateCandidatePassword(userData).matchType,
      });

      // Determine permissions
      let permissions: Permission[] = [];
      if (userData.businessProfiles && userData.businessProfiles.length > 0) {
        const activeProfileTypes = userData.businessProfiles
          .filter((p: any) => p.isActive)
          .map((p: any) => p.type as BusinessProfileType);
        const chosenType = activeProfileTypes[0] ?? userData.businessProfiles[0].type;
        permissions = getProfilePermissions(chosenType) as Permission[];
      } else {
        permissions = getUserPermissions(userData.role as Role);
      }

      const additionalMenus: string[] = userData.additionalMenus || [];

      // Build userToStore
      const userToStore: any = { ...userData };

      // Determine available roles & activeRole
      let availableRoles: BaseRole[] = [];
      let activeRole: BaseRole | null = null;

      if (userData.businessProfiles && Array.isArray(userData.businessProfiles) && userData.businessProfiles.length > 0) {
        availableRoles = userData.businessProfiles.map((p: any) => p.type as BaseRole);

        const savedActiveProfile = localStorage.getItem('activeProfileType') as BusinessProfileType | null;
        const primary = userData.businessProfiles.find((p: any) => p.isPrimary);
        let chosenProfile: BusinessProfileType;

        if (primary) {
          chosenProfile = primary.type as BusinessProfileType;
        } else if (savedActiveProfile && availableRoles.includes(savedActiveProfile as BaseRole)) {
          chosenProfile = savedActiveProfile;
        } else {
          const activeProfiles = userData.businessProfiles.filter((p: any) => p.isActive);
          chosenProfile = (activeProfiles[0]?.type ?? userData.businessProfiles[0]?.type) as BusinessProfileType;
        }

        userToStore.businessProfiles = userData.businessProfiles.map((p: any) => ({
          ...p,
          isActive: p.type === chosenProfile,
        }));

        permissions = getProfilePermissions(chosenProfile) as Permission[];
        activeRole = chosenProfile as BaseRole;
        localStorage.setItem('activeProfileType', chosenProfile);
      } else {
        availableRoles = userData.roles && Array.isArray(userData.roles)
          ? (userData.roles as BaseRole[])
          : [userData.role as BaseRole];
        activeRole = userData.role as BaseRole;
      }

      localStorage.setItem('user', JSON.stringify(userToStore));

      setState(prev => ({
        ...prev,
        user: userToStore,
        userRole: userToStore.role as Role,
        availableRoles,
        activeRole,
        additionalMenus,
        permissions,
        loading: false,
      }));

      return userToStore;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // -------------------------------------------------------------------------
  // logout()
  // -------------------------------------------------------------------------
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('activeProfileType');
    setState({
      user: null,
      loading: false,
      userRole: null,
      availableRoles: [],
      activeRole: null,
      additionalMenus: [],
      permissions: [],
      login,
      logout,
      switchRole,
      switchToProfile,
    });
    navigate('/login');
  };

  // -------------------------------------------------------------------------
  // switchToProfile()
  // -------------------------------------------------------------------------
  const switchToProfile = async (profileType: BusinessProfileType) => {
    if (!state.user?.businessProfiles) return;

    try {
      const updatedProfiles = state.user.businessProfiles.map((p: any) => ({
        ...p,
        isActive: p.type === profileType,
      }));

      const newPermissions = getProfilePermissions(profileType) as Permission[];
      const updatedUser = { ...state.user, businessProfiles: updatedProfiles };

      setState(prev => ({
        ...prev,
        user: updatedUser,
        permissions: newPermissions,
        activeRole: profileType as BaseRole,
      }));

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('activeProfileType', profileType);

      toast.success(`Profil basculé vers: ${getRoleLabel(profileType as BaseRole)}`);
    } catch (error) {
      console.error('Error switching profile:', error);
      toast.error('Erreur lors du changement de profil');
    }
  };

  // -------------------------------------------------------------------------
  // switchRole()
  // -------------------------------------------------------------------------
  const switchRole = (newRole: BaseRole | BusinessProfileType) => {
    if (state.user?.businessProfiles?.some((p: any) => p.type === newRole)) {
      switchToProfile(newRole as BusinessProfileType);
      return;
    }

    if (!state.availableRoles.includes(newRole as BaseRole)) return;

    const newPermissions = getUserPermissions(newRole as Role);

    setState(prev => ({
      ...prev,
      activeRole: newRole as BaseRole,
      permissions: newPermissions,
    }));

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...currentUser, activeRole: newRole }));

    toast.success(`Basculé vers le rôle: ${getRoleLabel(newRole as BaseRole)}`);
  };

  // -------------------------------------------------------------------------
  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchRole, switchToProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
