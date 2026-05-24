import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { User as UserIcon, LogOut } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { ProfileSwitcher } from './ProfileSwitcher';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

export function Header() {
  const { user, userRole, activeRole, logout } = useAuth();
  const { openProfileModal } = useUserProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) return;

        // Chercher dans users
        const { data: userRows } = await supabase
          .from('users')
          .select('full_name, photo_url')
          .eq('church_id', getChurchId())
          .eq('id', currentUserId)
          .limit(1);

        if (userRows && userRows.length > 0) {
          setUserFullName(userRows[0].full_name || '');
          setUserPhotoURL(userRows[0].photo_url || null);
          return;
        }

        // Chercher dans admins
        const { data: adminRows } = await supabase
          .from('admins')
          .select('full_name, photo_url')
          .eq('id', currentUserId)
          .limit(1);

        if (adminRows && adminRows.length > 0) {
          setUserFullName(adminRows[0].full_name || '');
          setUserPhotoURL(adminRows[0].photo_url || null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  const getRoleLabel = () => {
    const role = activeRole || userRole;
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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout?.();
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1" />

        <div className="flex items-center space-x-4">
          <ProfileSwitcher />

          {((activeRole || userRole) === 'shepherd' || (userRole as any) === 'intern' || (activeRole || userRole) === 'admin' || (activeRole || userRole) === 'super_admin' || (activeRole || userRole) === 'adn') && <NotificationBell />}

          <button
            onClick={openProfileModal}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#F2B636]/10 flex items-center justify-center">
              {userPhotoURL ? (
                <img
                  src={userPhotoURL}
                  alt="Photo de profil"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    setUserPhotoURL(null);
                  }}
                />
              ) : (
                <UserIcon className="w-5 h-5 text-[#F2B636]" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{userFullName || 'Utilisateur'}</p>
              <p className="text-xs text-gray-500">{getRoleLabel()}</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-colors duration-200 ease-in-out border border-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
          </button>
        </div>
      </div>
    </header>
  );
}
