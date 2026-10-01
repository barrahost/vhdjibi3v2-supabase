import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

// Convertit la clé publique VAPID (base64url) au format attendu par
// PushManager.subscribe (Uint8Array) -- conversion standard Web Push.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export const PushService = {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  // Demande la permission, inscrit le service worker, s'abonne au push et
  // enregistre l'abonnement côté serveur. Retourne false sans lever d'erreur
  // si le navigateur ne supporte pas le push ou si la permission est refusée.
  async subscribe(userId: string): Promise<boolean> {
    if (!this.isSupported()) return false;

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY manquant — notifications push indisponibles.');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const json = subscription.toJSON();
      const { error } = await supabase.rpc('upsert_push_subscription', {
        p_church_id: getChurchId(),
        p_user_id: userId,
        p_endpoint: json.endpoint,
        p_p256dh: json.keys?.p256dh,
        p_auth: json.keys?.auth,
        p_user_agent: navigator.userAgent,
      });
      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux notifications push:', error);
      return false;
    }
  },

  async unsubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await supabase.rpc('remove_push_subscription', { p_endpoint: endpoint });
      }
    } catch (error) {
      console.error('Erreur lors du désabonnement aux notifications push:', error);
    }
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },

  // Best-effort : ne doit jamais bloquer l'action qui l'appelle (attribution
  // d'une âme, etc.) si l'envoi échoue -- comportement symétrique à SMSService.
  async notify(userIds: string[], title: string, body: string, url?: string): Promise<void> {
    if (userIds.length === 0) return;
    try {
      await supabase.functions.invoke('send-push', {
        body: { user_ids: userIds, title, body, url },
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification push:', error);
    }
  },
};
