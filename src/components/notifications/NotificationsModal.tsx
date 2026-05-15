import { Modal } from '../ui/Modal';
import { Bell } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import type { Notification } from '../../hooks/useNotifications';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications
}: NotificationsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
    >
      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">
              Aucune notification pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.soulId}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <h3 className="font-medium text-red-800">
                  Interaction requise avec {notification.soulName}
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  {notification.daysWithoutInteraction === Infinity ? (
                    "Aucune interaction enregistrée"
                  ) : (
                    <>
                      Dernière interaction il y a {notification.daysWithoutInteraction} jours
                      ({formatDate(notification.lastInteractionDate)})
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}