import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPageTitle } from '../../utils/pageTitle';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { ProfileSwitcher } from './ProfileSwitcher';
import { ChurchSelector } from './ChurchSelector';
import { Logo } from './Logo';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

export function Header() {
  const { user, userRole, activeRole, logout } = useAuth();
  const { openProfileModal } = useUserProfile();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) return;

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
      case 'super_admin': return 'Super Admin Central';
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

  const showNotificationBell =
    (activeRole || userRole) === 'shepherd' ||
    (userRole as any) === 'intern' ||
    (activeRole || userRole) === 'admin' ||
    (activeRole || userRole) === 'super_admin' ||
    (activeRole || userRole) === 'adn';

  const Avatar = () => (
    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center overflow-hidden flex-shrink-0">
      {userPhotoURL ? (
        <img
          src={userPhotoURL}
          alt="Photo de profil"
          className="w-8 h-8 object-cover"
          onError={() => setUserPhotoURL(null)}
        />
      ) : (
        <UserIcon className="w-4 h-4 text-amber-500" />
      )}
    </div>
  );

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      {/* Mobile header */}
      <div className="flex lg:hidden items-center justify-between px-4 h-14">
        <Logo className="h-11 w-auto" />
        <div className="flex items-center gap-2">
          <ChurchSelector />
          <ProfileSwitcher />
          {showNotificationBell && <NotificationBell />}
          <button
            onClick={openProfileModal}
            className="p-1 rounded-full"
            aria-label="Profil"
          >
            <Avatar />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between gap-4 px-6 h-16">
        <div className="flex items-center gap-3">
          <ChurchSelector />
          {pageTitle && (
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {pageTitle}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ProfileSwitcher />
          {showNotificationBell && <NotificationBell />}

          <button
            onClick={openProfileModal}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Avatar />
            <div className="text-left hidden xl:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {userFullName || getRoleLabel()}
              </p>
              <p className="text-xs text-gray-500 leading-tight">{getRoleLabel()}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden xl:block" />
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
