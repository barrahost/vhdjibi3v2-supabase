import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { PushService } from './push.service';
import { SMSService } from './sms.service';
import { CulteDirectory } from './culteDirectory.service';
import { toSmsText } from '../lib/smsText';

/** Garde-fou : un SMS coûte de l'argent, jamais d'envoi en masse depuis ce module. */
const MAX_SMS_PER_CALL = 5;

export interface NotifyPayload {
  title: string;
  body: string;
  /** Chemin ouvert au toucher de la notification (ex. '/plan-actions'). */
  url: string;
  /** Texte du SMS envoyé à ceux qui n'ont pas activé les notifications push. Sans SMS si absent. */
  sms?: string;
}

/**
 * Prévient des personnes par notification push ; celles qui n'ont pas activé le push reçoivent
 * un SMS de secours (si `sms` est fourni et que le crédit SMS le permet).
 * Best-effort : ne lève jamais, pour ne pas faire échouer l'action qui l'appelle.
 */
export const CulteNotifyService = {
  async notifyUsers(
    userIds: string[],
    payload: NotifyPayload,
    options: { excludeUserId?: string | null } = {}
  ): Promise<{ pushed: number; sms: number }> {
    const ids = Array.from(new Set(userIds.filter(Boolean))).filter((id) => id !== options.excludeUserId);
    if (ids.length === 0) return { pushed: 0, sms: 0 };

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .eq('church_id', getChurchId())
        .in('user_id', ids);

      if (error) {
        // On ne sait pas qui est abonné : push à tout le monde (les non-abonnés sont ignorés côté serveur),
        // mais jamais de SMS « par défaut ».
        console.error('Abonnés push introuvables, pas de SMS de secours :', error);
        await PushService.notify(ids, payload.title, payload.body, payload.url);
        return { pushed: ids.length, sms: 0 };
      }
      const subscribed = new Set<string>((data ?? []).map((row: any) => row.user_id));

      const toPush = ids.filter((id) => subscribed.has(id));
      if (toPush.length > 0) await PushService.notify(toPush, payload.title, payload.body, payload.url);

      let sms = 0;
      if (payload.sms) {
        const toSms = ids.filter((id) => !subscribed.has(id));
        if (toSms.length > MAX_SMS_PER_CALL) console.warn(`SMS de secours limité à ${MAX_SMS_PER_CALL} destinataires.`);
        if (toSms.length > 0) sms = await sendSmsTo(toSms.slice(0, MAX_SMS_PER_CALL), toSmsText(payload.sms));
      }
      return { pushed: toPush.length, sms };
    } catch (error) {
      console.error('Erreur lors de la notification du module Cultes:', error);
      return { pushed: 0, sms: 0 };
    }
  },
};

async function sendSmsTo(userIds: string[], message: string): Promise<number> {
  try {
    const users = await CulteDirectory.users();
    const phones = users
      .filter((u) => userIds.includes(u.id) && u.phone)
      .map((u) => (u.phone as string).replace('+225', ''));
    if (phones.length === 0) return 0;

    const credits = await SMSService.checkSufficientCredits();
    if (!credits.sufficient) {
      console.warn('Crédit SMS insuffisant — SMS du module Cultes non envoyé.');
      return 0;
    }
    await SMSService.sendSMS(phones, message);
    return phones.length;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS du module Cultes:', error);
    return 0;
  }
}
