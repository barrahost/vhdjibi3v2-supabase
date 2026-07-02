import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { NotificationService, AppNotification } from '../services/notification.service';

function soundEnabled(): boolean {
  return localStorage.getItem('notif_sound_enabled') === 'true';
}

function browserNotifEnabled(): boolean {
  return localStorage.getItem('notif_browser_enabled') === 'true';
}

const notificationSound = new Audio('/notification.mp3');

export function useNotificationsFeed(userId: string | undefined, roles: string[]) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const rolesRef = useRef(roles);
  rolesRef.current = roles;

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await NotificationService.getForUser(userId, rolesRef.current);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('useNotificationsFeed load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();

    if (!userId) return;

    // Rappel de suivi (interactions) — une fois par session, idempotent côté SQL (dedupe_key)
    const todayKey = `interaction_check_${new Date().toISOString().slice(0, 10)}`;
    if (roles.includes('shepherd') && !sessionStorage.getItem(todayKey)) {
      sessionStorage.setItem(todayKey, '1');
      NotificationService.runInteractionReminderCheck().catch(err =>
        console.error('runInteractionReminderCheck error:', err)
      );
    }

    const channel = supabase
      .channel(`notifications-feed-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `church_id=eq.${getChurchId()}`,
      }, (payload: any) => {
        const row = payload.new as any;
        const targetsMe = row.target_user_id === userId || rolesRef.current.includes(row.target_role);
        if (!targetsMe) return;

        const notif: AppNotification = {
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body ?? undefined,
          navigateTo: row.navigate_to ?? undefined,
          metadata: row.metadata ?? {},
          createdAt: new Date(row.created_at),
          isRead: false,
        };

        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast(notif.title, { icon: '🔔' });

        if (soundEnabled()) {
          notificationSound.play().catch(() => {});
        }
        if (browserNotifEnabled() && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, { body: notif.body, icon: '/favicon.ico' });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await NotificationService.markAsRead(id, userId);
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await NotificationService.markAllAsRead(userId, rolesRef.current);
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
