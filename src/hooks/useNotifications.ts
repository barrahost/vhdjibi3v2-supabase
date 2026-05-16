import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const compute = async () => {
      try {
        // Récupérer les âmes du berger
        const soulsData = await getDocs(supabase)
          .from('souls')
          .select('id, full_name')
          .eq('shepherd_id', userId);

        if (soulsErr) throw soulsErr;
        const souls = soulsData || [];
        if (souls.length === 0) return;

        // Récupérer les interactions du berger (tri desc par date)
        const interactionsData = await getDocs(supabase)
          .from('interactions')
          .select('soul_id, date')
          .eq('shepherd_id', userId)
          .order('date', { ascending: false });

        if (intErr) throw intErr;

        const interactions = interactionsData || [];
        const today = new Date();
        const newNotifications: Notification[] = [];
        const currentIds: string[] = [];

        for (const soul of souls) {
          const soulInteractions = interactions.filter((i: any) => i.soul_id === soul.id);
          const lastInteraction = soulInteractions.length > 0
            ? new Date(soulInteractions[0].date)
            : null;

          const daysWithoutInteraction = lastInteraction
            ? Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
            : Infinity;

          if (daysWithoutInteraction >= 5) {
            newNotifications.push({
              soulId: soul.id,
              soulName: soul.full_name,
              lastInteractionDate: lastInteraction,
              daysWithoutInteraction,
            });
            currentIds.push(soul.id);

            if (!previousNotifications.includes(soul.id)) {
              toast.error(
                `${soul.full_name} n'a pas eu d'interaction depuis ${daysWithoutInteraction} jours`,
                { duration: 5000 }
              );
              notificationSound.play().catch(console.error);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification("Rappel d'interaction", {
                  body: `${soul.full_name} n'a pas eu d'interaction depuis ${daysWithoutInteraction} jours`,
                  icon: '/favicon.ico',
                });
              }
            }
          }
        }

        setNotifications(newNotifications);
        setNotificationsCount(newNotifications.length);
        setPreviousNotifications(currentIds);
      } catch (err) {
        console.error('useNotifications error:', err);
      }
    };

    compute();

    // Écouter les changements en temps réel
    const soulsChannel = supabase
      .channel(`notifications-souls-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'souls',
        filter: `shepherd_id=eq.${userId}`,
      }, compute)
      .subscribe();

    const interactionsChannel = supabase
      .channel(`notifications-interactions-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'interactions',
        filter: `shepherd_id=eq.${userId}`,
      }, compute)
      .subscribe();

    return () => {
      supabase.removeChannel(soulsChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [userId]);

  return { notifications, notificationsCount };
}
