import { useState } from 'react';
import { Modal } from '../ui/Modal';
import AdminAlertsContent from './AdminAlertsContent';
import NotificationsFeedContent from './NotificationsFeedContent';
import type { AdminAlert } from '../../hooks/useAdminNotifications';
import type { AppNotification } from '../../services/notification.service';

type Tab = 'feed' | 'alerts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showAlertsTab: boolean;
  alerts: AdminAlert[];
  alertsLoading: boolean;
  onRefreshAlerts: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  feedLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationsModal({
  isOpen, onClose, showAlertsTab,
  alerts, alertsLoading, onRefreshAlerts,
  notifications, unreadCount, feedLoading, onMarkAsRead, onMarkAllAsRead,
}: Props) {
  const [tab, setTab] = useState<Tab>('feed');
  const alertsTotal = alerts.reduce((s, a) => s + a.count, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={showAlertsTab ? 'Alertes & Notifications' : 'Notifications'}>
      {showAlertsTab && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setTab('feed')}
              className={`flex-1 h-8 rounded-lg text-sm font-medium transition-all ${
                tab === 'feed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('alerts')}
              className={`flex-1 h-8 rounded-lg text-sm font-medium transition-all ${
                tab === 'alerts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Alertes
              {alertsTotal > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold text-white bg-amber-500 rounded-full">
                  {alertsTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {(!showAlertsTab || tab === 'feed') ? (
        <NotificationsFeedContent
          notifications={notifications}
          unreadCount={unreadCount}
          loading={feedLoading}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onNavigate={onClose}
        />
      ) : (
        <AdminAlertsContent
          alerts={alerts}
          loading={alertsLoading}
          onRefresh={onRefreshAlerts}
          onNavigate={onClose}
        />
      )}
    </Modal>
  );
}
