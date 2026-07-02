import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import type { AppNotification } from '../../services/notification.service';

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: () => void; // appelé avant de naviguer, pour fermer la modale
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function NotificationsFeedContent({
  notifications, unreadCount, loading, onMarkAsRead, onMarkAllAsRead, onNavigate,
}: Props) {
  const navigate = useNavigate();

  const handleClick = (n: AppNotification) => {
    if (!n.isRead) onMarkAsRead(n.id);
    if (n.navigateTo) {
      onNavigate();
      navigate(n.navigateTo);
    }
  };

  return (
    <div className="p-4 min-w-[340px]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-[#00665C] hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#00665C] rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">Aucune notification pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                n.isRead
                  ? 'bg-white border-gray-100 hover:bg-gray-50'
                  : 'bg-[#00665C]/5 border-[#00665C]/20 hover:bg-[#00665C]/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${n.isRead ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                  {n.title}
                </p>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#00665C] mt-1.5 flex-shrink-0" />}
              </div>
              {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
              <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
