import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import NotificationsModal from './NotificationsModal';
import AdminNotificationsModal from './AdminNotificationsModal';

const ADMIN_ROLES = ['admin', 'super_admin', 'adn'];

export function NotificationBell() {
  const { user, userRole, activeRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const effectiveRole = (activeRole || userRole) as string;
  const isAdmin = ADMIN_ROLES.includes(effectiveRole);

  // Shepherd notifications
  const { notifications, notificationsCount } = useNotifications(
    !isAdmin ? user?.uid : undefined
  );

  // Admin notifications
  const {
    alerts,
    totalCount: adminCount,
    loading: adminLoading,
    refresh: adminRefresh,
  } = useAdminNotifications();

  const count = isAdmin ? adminCount : notificationsCount;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        data-tour="notification-bell"
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-red-500 rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isAdmin ? (
        <AdminNotificationsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          alerts={alerts}
          loading={adminLoading}
          onRefresh={() => { adminRefresh(); }}
        />
      ) : (
        <NotificationsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          notifications={notifications}
        />
      )}
    </>
  );
}
