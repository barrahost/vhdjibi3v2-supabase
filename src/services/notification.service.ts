import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  navigateTo?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  isRead: boolean;
}

function mapNotification(r: any): AppNotification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body ?? undefined,
    navigateTo: r.navigate_to ?? undefined,
    metadata: r.metadata ?? {},
    createdAt: new Date(r.created_at),
    isRead: !!r.is_read,
  };
}

export const NotificationService = {
  async getForUser(userId: string, roles: string[], limit = 50): Promise<AppNotification[]> {
    const { data, error } = await supabase.rpc('get_notifications_for_user', {
      p_church_id: getChurchId(),
      p_user_id: userId,
      p_roles: roles,
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []).map(mapNotification);
  },

  async getUnreadCount(userId: string, roles: string[]): Promise<number> {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      p_church_id: getChurchId(),
      p_user_id: userId,
      p_roles: roles,
    });
    if (error) throw error;
    return data ?? 0;
  },

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
      p_user_id: userId,
    });
    if (error) throw error;
  },

  async markAllAsRead(userId: string, roles: string[]): Promise<void> {
    const { error } = await supabase.rpc('mark_all_notifications_read', {
      p_church_id: getChurchId(),
      p_user_id: userId,
      p_roles: roles,
    });
    if (error) throw error;
  },

  async runInteractionReminderCheck(thresholdDays = 5): Promise<number> {
    const { data, error } = await supabase.rpc('check_interaction_reminders', {
      p_church_id: getChurchId(),
      p_threshold_days: thresholdDays,
    });
    if (error) throw error;
    return data ?? 0;
  },
};
