import { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationsFeed } from '../../hooks/useNotificationsFeed';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import NotificationsModal from './NotificationsModal';

const ADMIN_ROLES = ['admin', 'super_admin', 'adn'];

export function NotificationBell() {
  const { user, userRole, activeRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const effectiveRole = (activeRole || userRole) as string;
  const isAdmin = ADMIN_ROLES.includes(effectiveRole);

  const roles = useMemo(() => {
    const r = [userRole, activeRole].filter(Boolean) as string[];
    return [...new Set(r)];
  }, [userRole, activeRole]);

  const userId = user?.uid;

  const {
    notifications,
    unreadCount: feedUnreadCount,
    loading: feedLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationsFeed(userId, roles);

  const {
    alerts,
    totalCount: adminCount,
    loading: adminLoading,
    refresh: adminRefresh,
  } = useAdminNotifications();

  const badgeCount = feedUnreadCount + (isAdmin ? adminCount : 0);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        data-tour="notification-bell"
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-red-500 rounded-full">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      <NotificationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showAlertsTab={isAdmin}
        alerts={alerts}
        alertsLoading={adminLoading}
        onRefreshAlerts={adminRefresh}
        notifications={notifications}
        unreadCount={feedUnreadCount}
        feedLoading={feedLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </>
  );
}
