import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Soul, Interaction } from '../types/database.types';
import toast from 'react-hot-toast';

export interface Notification {
  soulId: string;
  soulName: string;
  lastInteractionDate: Date | null;
  daysWithoutInteraction: number;
}

// Son de notification
const notificationSound = new Audio('/notification.mp3');

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [previousNotifications, setPreviousNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Demander la permission pour les notifications push
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Écouter les changements sur les âmes
    const soulsQuery = query(
      collection(db, 'souls'),
      where('shepherdId', '==', userId)
    );

    // Écouter les changements sur les interactions
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('shepherdId', '==', userId),
      orderBy('date', 'desc')
    );

    const unsubscribeSouls = onSnapshot(soulsQuery, async (soulsSnapshot) => {
      const souls = soulsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Soul));

      const interactionsSnapshot = await getDocs(interactionsQuery);
      const interactions = interactionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate()
      }));

      const newNotifications: Notification[] = [];
      const today = new Date();
      const currentNotificationIds: string[] = [];

      for (const soul of souls) {
        const soulInteractions = interactions.filter((i: any) => i.soulId === soul.id);
        const lastInteraction = soulInteractions.length > 0 
          ? soulInteractions[0].date 
          : null;

        const daysWithoutInteraction = lastInteraction
          ? Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        if (daysWithoutInteraction >= 5) {
          const notification = {
            soulId: soul.id,
            soulName: soul.fullName,
            lastInteractionDate: lastInteraction,
            daysWithoutInteraction
          };
          newNotifications.push(notification);
          currentNotificationIds.push(soul.id);

          // Vérifier si c'est une nouvelle notification
          if (!previousNotifications.includes(soul.id)) {
            // Notification toast
            toast.error(
              `${soul.fullName} n'a pas eu d'interaction depuis ${daysWithoutInteraction} jours`,
              { duration: 5000 }
            );

            // Son de notification
            notificationSound.play().catch(console.error);

            // Notification push
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Rappel d\'interaction', {
                body: `${soul.fullName} n'a pas eu d'interaction depuis ${daysWithoutInteraction} jours`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      }

      setNotifications(newNotifications);
      setNotificationsCount(newNotifications.length);
      setPreviousNotifications(currentNotificationIds);
    });

    return () => {
      unsubscribeSouls();
    };
  }, [userId]);

  return { notifications, notificationsCount };
}