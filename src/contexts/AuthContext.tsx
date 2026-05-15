import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { DEFAULT_PASSWORDS } from '../constants/auth';
import { RoleService } from '../services/auth/roleService';
import type { Permission, Role, BaseRole } from '../types/permission.types';
import { ROLE_PERMISSIONS } from '../constants/roles';
import { PROFILE_PERMISSIONS, getProfilePermissions } from '../types/businessProfile.types';
import type { BusinessProfileType } from '../types/businessProfile.types';
import { validatePhoneNumber } from '../utils/phoneValidation';
import toast from 'react-hot-toast';

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
  switchToProfile: async () => {}
});

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
    switchToProfile: async () => {}
  });

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Convert date strings back to Date objects
      if (userData.createdAt) {
        userData.createdAt = new Date(userData.createdAt);
      }
      if (userData.lastLoginAt) {
        userData.lastLoginAt = new Date(userData.lastLoginAt);
      }
      
      const loadPermissions = async () => {
        // For regular admins, we now look in the users collection
        const permissions = await RoleService.getUserPermissions(userData.uid);
        
        // Load additional menus if user is a shepherd
        let additionalMenus: string[] = [];
        if (userData.role === 'shepherd' || userData.role === 'intern') {
          try {
            const userQuery = query(
              collection(db, 'users'),
              where('uid', '==', userData.uid)
            );
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0].data();
              additionalMenus = userDoc.additionalMenus || [];
            }
          } catch (error) {
            console.error('Error loading additional menus:', error);
          }
        }
        
        let availableRoles = [];
        let activeRole = null;
        let activePermissions: Permission[] = [];
        
        // Check for business profiles first (new system)
        if (userData.businessProfiles && Array.isArray(userData.businessProfiles) && userData.businessProfiles.length > 0) {
          availableRoles = userData.businessProfiles.map((profile: any) => profile.type);

          // Restore last active profile from localStorage if still available
          const savedActiveProfile = localStorage.getItem('activeProfileType') as BusinessProfileType | null;
          let chosenProfile: BusinessProfileType | null = null;

          if (savedActiveProfile && availableRoles.includes(savedActiveProfile as BaseRole)) {
            chosenProfile = savedActiveProfile;
          } else {
            // Priority: isPrimary > isActive > first profile
            const primary = userData.businessProfiles.find((p: any) => p.isPrimary);
            const active = userData.businessProfiles.find((p: any) => p.isActive);
            chosenProfile = (primary?.type ?? active?.type ?? userData.businessProfiles[0]?.type) as BusinessProfileType;
          }

          // Sync isActive flags so a single profile is active
          userData.businessProfiles = userData.businessProfiles.map((p: any) => ({
            ...p,
            isActive: p.type === chosenProfile,
          }));

          activePermissions = getProfilePermissions(chosenProfile) as Permission[];
          activeRole = chosenProfile as BaseRole;
          localStorage.setItem('activeProfileType', chosenProfile);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Fallback to old system
          if (userData.roles && userData.roles.primary) {
            availableRoles.push(userData.roles.primary);
            if (userData.roles.secondary) {
              availableRoles.push(...userData.roles.secondary);
            }
          } else if (userData.role) {
            availableRoles.push(userData.role);
          }
          activeRole = userData.activeRole || userData.role as BaseRole;
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
          loading: false
        }));
      };
      loadPermissions();
    } else {
      setState(prev => ({
        ...prev, 
        loading: false
      }));
    }
  }, []);

  // Helper function to get user permissions based on role
  const getUserPermissions = (role: Role): Permission[] => {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    return Array.isArray(permissions) ? [...permissions] : [];
  };

  const login = async (phone: string, password: string) => {
    try {
      if (!phone || !password) {
        throw new Error('Phone and password required');
      }

      // Validate and format phone number
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Numéro de téléphone invalide');
      }
      
      const formattedPhone = phoneValidation.formattedNumber;
      const cleanPhone = phoneValidation.cleanNumber;
      const phoneCandidates = Array.from(new Set([formattedPhone, cleanPhone].filter(Boolean)));
      console.log('Attempting login with:', { phone: formattedPhone, passwordLength: password.length });

      // Try Firebase Auth first (for backward compatibility)
      try {
        await auth.signOut().catch(err => {
          console.log('Firebase signout error (non-critical):', err);
        });
        console.log('Firebase Auth cleared for custom authentication');
      } catch (firebaseError) {
        console.log('Firebase auth operation failed, continuing with custom auth');
      }

      const usersSnapshots = await Promise.all(
        phoneCandidates.map((phoneCandidate) =>
          getDocs(query(
            collection(db, 'users'),
            where('phone', '==', phoneCandidate),
            where('status', '==', 'active')
          ))
        )
      );

      const adminsSnapshots = await Promise.all(
        phoneCandidates.map((phoneCandidate) =>
          getDocs(query(
            collection(db, 'admins'),
            where('phone', '==', phoneCandidate),
            where('role', '==', 'super_admin'),
            where('status', '==', 'active')
          ))
        )
      );

      const candidateMap = new Map<string, { docSnapshot: any; collectionName: 'users' | 'admins' }>();
      usersSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((docSnapshot) => {
          candidateMap.set(`users:${docSnapshot.id}`, { docSnapshot, collectionName: 'users' });
        });
      });
      adminsSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((docSnapshot) => {
          candidateMap.set(`admins:${docSnapshot.id}`, { docSnapshot, collectionName: 'admins' });
        });
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
            if (
              profile.type === 'shepherd' ||
              profile.type === 'department_leader' ||
              profile.type === 'family_leader' ||
              profile.type === 'evangelist'
            ) {
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
            const defaultPassword = candidateData.role === 'adn'
              ? DEFAULT_PASSWORDS.ADN
              : DEFAULT_PASSWORDS.SHEPHERD;

            if (password === defaultPassword) {
              return { isValid: true, matchType: `legacy_role:${candidateData.role}` };
            }
          } else if (
            (candidateData.role === 'admin' || candidateData.role === 'super_admin') &&
            password === DEFAULT_PASSWORDS.ADMIN
          ) {
            return { isValid: true, matchType: `legacy_role:${candidateData.role}` };
          }
        }

        return { isValid: false, matchType: null };
      };

      const customPasswordMatch = candidateDocs.find(({ docSnapshot }) => {
        const candidateData = docSnapshot.data();
        return candidateData.password && password === String(candidateData.password);
      });
      const fallbackMatch = candidateDocs.find(({ docSnapshot }) => validateCandidatePassword(docSnapshot.data()).isValid);
      const matchedCandidate = customPasswordMatch || fallbackMatch;

      console.log('Login candidates found:', candidateDocs.map(({ docSnapshot, collectionName }) => {
        const candidateData = docSnapshot.data();
        const validation = validateCandidatePassword(candidateData);
        return {
          role: candidateData.role,
          docId: docSnapshot.id,
          collection: collectionName,
          hasStoredPassword: !!candidateData.password,
          storedPasswordLength: candidateData.password ? String(candidateData.password).length : 0,
          typedPasswordLength: password.length,
          matchesPassword: validation.isValid,
          matchType: validation.matchType,
        };
      }));

      if (!matchedCandidate) {
        console.error('Invalid password');
        throw new Error('Invalid password');
      }

      const userDoc = matchedCandidate.docSnapshot;
      const userData = userDoc.data();
      console.log('Password validated for selected login document:', {
        role: userData.role,
        docId: userDoc.id,
        collection: matchedCandidate.collectionName,
        matchType: validateCandidatePassword(userData).matchType,
      });

      // Get permissions based on role or business profiles
      let permissions: Permission[] = [];
      
      if (userData.businessProfiles && userData.businessProfiles.length > 0) {
        // Use new business profiles system - get cumulative permissions
        const activeProfileTypes = userData.businessProfiles
          .filter((profile: any) => profile.isActive)
          .map((profile: any) => profile.type as BusinessProfileType);
        
        if (activeProfileTypes.length === 0) {
          // If no active profiles, activate the first one
          activeProfileTypes.push(userData.businessProfiles[0].type as BusinessProfileType);
        }
        
        permissions = getProfilePermissions(activeProfileTypes[0]) as Permission[];
        console.log('🔍 [AuthContext] Business profile permissions:', {
          activeProfileTypes,
          permissions
        });
      } else {
        // Fallback to old role system
        permissions = getUserPermissions(userData.role as Role);
        console.log('🔍 [AuthContext] Legacy role permissions:', {
          role: userData.role,
          permissions
        });
      }
      
      // Get additional menus if user is a shepherd or intern
      let additionalMenus: string[] = [];
      if (userData.role === 'shepherd') {
        additionalMenus = userData.additionalMenus || [];
      }
      
      // Store user data
      const userToStore: any = {
        id: userDoc.id,
        uid: userData.uid || userDoc.id,
        role: userData.role as Role,
        additionalMenus,
        ...userData,
        // Ensure dates are serialized properly
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
        lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : userData.lastLoginAt
      };
      
      console.log('🔍 [AuthContext] User data after login:', {
        fullName: userData.fullName,
        role: userToStore.role,
        businessProfiles: userData.businessProfiles,
        additionalMenus: userToStore.additionalMenus,
        hasBusinessProfiles: !!(userData.businessProfiles && userData.businessProfiles.length > 0)
      });
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Determine available roles - prioritize business profiles
      let availableRoles: BaseRole[] = [];
      let activeRole: BaseRole | null = null;
      
      if (userData.businessProfiles && Array.isArray(userData.businessProfiles) && userData.businessProfiles.length > 0) {
        availableRoles = userData.businessProfiles.map((profile: any) => profile.type as BaseRole);

        // At login: prefer the primary profile (default at connection).
        // The saved activeProfileType is used only as a fallback if no primary is set.
        const savedActiveProfile = localStorage.getItem('activeProfileType') as BusinessProfileType | null;
        const primary = userData.businessProfiles.find((p: any) => p.isPrimary);
        let chosenProfile: BusinessProfileType | null = null;

        if (primary) {
          chosenProfile = primary.type as BusinessProfileType;
        } else if (savedActiveProfile && availableRoles.includes(savedActiveProfile as BaseRole)) {
          chosenProfile = savedActiveProfile;
        } else {
          const activeProfiles = userData.businessProfiles.filter((p: any) => p.isActive);
          chosenProfile = (activeProfiles[0]?.type ?? userData.businessProfiles[0]?.type) as BusinessProfileType;
        }

        // Sync isActive flags
        const syncedProfiles = userData.businessProfiles.map((p: any) => ({
          ...p,
          isActive: p.type === chosenProfile,
        }));
        userToStore.businessProfiles = syncedProfiles;

        permissions = getProfilePermissions(chosenProfile) as Permission[];
        activeRole = chosenProfile as BaseRole;
        localStorage.setItem('activeProfileType', chosenProfile);
        localStorage.setItem('user', JSON.stringify(userToStore));
      } else {
        // Fallback to old role system
        availableRoles = userData.roles && Array.isArray(userData.roles)
          ? userData.roles as BaseRole[]
          : [userToStore.role as BaseRole];
        activeRole = userToStore.role as BaseRole;
      }
      
      console.log('🔍 [AuthContext] Roles determined:', {
        availableRoles,
        activeRole,
        permissions
      });
      
      // Update state
      setState(prev => ({
        ...prev,
        user: userToStore,
        userRole: userToStore.role as Role,
        availableRoles,
        activeRole,
        additionalMenus,
        permissions,
        loading: false
      }));

      return userToStore;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      auth.signOut().catch(err => {
        console.log('Firebase signout error (non-critical):', err);
      });
    } catch (e) {
      console.log('Error during signout (non-critical)');
    }
    
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
      switchToProfile
    });
    navigate('/login');
  };

  // Switch to single profile function for business profiles
  const switchToProfile = async (profileType: BusinessProfileType) => {
    if (!state.user?.businessProfiles) return;
    
    console.log('🔄 [AuthContext] Switching to profile:', profileType);
    
    try {
      // Set only the selected profile as active
      const updatedProfiles = state.user.businessProfiles.map((profile: any) => ({
        ...profile,
        isActive: profile.type === profileType
      }));
      
      // Get permissions from the single active profile
      const newPermissions = getProfilePermissions(profileType) as Permission[];
      
      // Update user object
      const updatedUser = {
        ...state.user,
        businessProfiles: updatedProfiles
      };
      
      // Update state
      setState(prev => ({
        ...prev,
        user: updatedUser,
        permissions: newPermissions,
        activeRole: profileType as BaseRole
      }));
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('activeProfileType', profileType);

      const profileLabel = getRoleLabel(profileType as BaseRole);
      toast.success(`Profil basculé vers: ${profileLabel}`);
    } catch (error) {
      console.error('❌ [AuthContext] Error switching profile:', error);
      toast.error('Erreur lors du changement de profil');
    }
  };

  // Switch role function (updated to handle both old and new systems)
  const switchRole = (newRole: BaseRole | BusinessProfileType) => {
    // For business profiles, use switchToProfile functionality
    if (state.user?.businessProfiles && state.user.businessProfiles.some((p: any) => p.type === newRole)) {
      switchToProfile(newRole as BusinessProfileType);
      return;
    }
    
    // Legacy role switching
    if (!state.availableRoles.includes(newRole as BaseRole)) return;
    
    const newPermissions = getUserPermissions(newRole as Role);
    
    setState(prev => ({
      ...prev,
      activeRole: newRole as BaseRole,
      permissions: newPermissions
    }));
    
    // Store active role in localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...currentUser, activeRole: newRole }));
    
    toast.success(`Basculé vers le rôle: ${getRoleLabel(newRole as BaseRole)}`);
  };

  // Helper function to get role labels
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

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchRole, switchToProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);