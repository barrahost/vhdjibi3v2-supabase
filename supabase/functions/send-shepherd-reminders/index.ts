// Rappel SMS hebdomadaire aux bergers ayant des âmes sans interaction récente.
// Appelée toutes les heures par pg_cron (via pg_net) ; ne fait quelque chose que
// si la config (app_settings.sms.shepherdReminders) est activée et que le
// jour/heure courants correspondent. Protégée par le header X-Cron-Secret.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface ReminderConfig {
  enabled: boolean;
  dayOfWeek: number;      // 0 = dimanche ... 6 = samedi
  hour: number;           // heure d'envoi (fuseau Abidjan = UTC)
  thresholdDays: number;  // jours sans interaction avant rappel
  cooldownDays: number;   // délai minimum entre deux rappels au même berger
  message: string;        // modèle avec [surnom] et [nombre]
}

const DEFAULT_MESSAGE =
  "Bergerie AGC : [surnom], tu as [nombre] ame(s) sans interaction depuis 5+ jours. " +
  "Merci de les contacter et d'enregistrer l'interaction dans l'appli.";

function normalizeReminderConfig(raw: any): ReminderConfig {
  return {
    enabled:       raw?.enabled === true,
    dayOfWeek:     Number.isInteger(raw?.dayOfWeek) ? raw.dayOfWeek : 2, // mardi
    hour:          Number.isInteger(raw?.hour) ? raw.hour : 8,
    thresholdDays: Number(raw?.thresholdDays) > 0 ? Number(raw.thresholdDays) : 5,
    cooldownDays:  Number(raw?.cooldownDays) > 0 ? Number(raw.cooldownDays) : 7,
    message:       (raw?.message || '').trim() || DEFAULT_MESSAGE,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });

  try {
    // ── Sécurité : appel serveur → serveur uniquement ──
    const secret = Deno.env.get('CRON_SECRET') || '';
    if (!secret || req.headers.get('x-cron-secret') !== secret) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ── Config ──
    const { data: settingsRow } = await supabase
      .from('app_settings')
      .select('value, church_id')
      .eq('key', 'sms')
      .single();

    const cfg = normalizeReminderConfig(settingsRow?.value?.shepherdReminders);
    const churchId = settingsRow?.church_id || 'bergerie';

    if (!cfg.enabled) return json({ skipped: 'disabled' });

    // Fuseau d'Abidjan = UTC : comparaison directe. force=true (test manuel) ignore le créneau.
    const force = new URL(req.url).searchParams.get('force') === 'true';
    const now = new Date();
    if (!force && (now.getUTCDay() !== cfg.dayOfWeek || now.getUTCHours() !== cfg.hour)) {
      return json({ skipped: 'outside schedule' });
    }

    const cutoff = new Date(now.getTime() - cfg.thresholdDays * 24 * 3600 * 1000).toISOString();
    const cooldownCutoff = new Date(now.getTime() - cfg.cooldownDays * 24 * 3600 * 1000).toISOString();

    // ── Âmes actives assignées ──
    const { data: souls, error: soulsErr } = await supabase
      .from('souls')
      .select('id, shepherd_id, created_at')
      .eq('church_id', churchId)
      .eq('status', 'active')
      .not('shepherd_id', 'is', null);
    if (soulsErr) throw soulsErr;

    const soulIds = (souls || []).map((s: any) => s.id);
    if (soulIds.length === 0) return json({ sent: 0, reason: 'no assigned souls' });

    // ── Dernière interaction par âme ──
    const lastInteraction = new Map<string, string>();
    for (let i = 0; i < soulIds.length; i += 500) {
      const batch = soulIds.slice(i, i + 500);
      const { data: rows, error } = await supabase
        .from('interactions')
        .select('soul_id, date')
        .eq('church_id', churchId)
        .in('soul_id', batch);
      if (error) throw error;
      (rows || []).forEach((r: any) => {
        const prev = lastInteraction.get(r.soul_id);
        if (!prev || (r.date && r.date > prev)) lastInteraction.set(r.soul_id, r.date);
      });
    }

    // ── Retards par berger (jamais contactée → date de création de l'âme) ──
    const lateBySheperd = new Map<string, number>();
    (souls || []).forEach((s: any) => {
      const lastDate = lastInteraction.get(s.id) || s.created_at;
      if (lastDate && lastDate < cutoff) {
        lateBySheperd.set(s.shepherd_id, (lateBySheperd.get(s.shepherd_id) || 0) + 1);
      }
    });
    if (lateBySheperd.size === 0) return json({ sent: 0, reason: 'no late souls' });

    // ── Anti-relance : bergers déjà notifiés récemment ──
    const { data: recentLogs } = await supabase
      .from('shepherd_reminder_log')
      .select('shepherd_id')
      .eq('church_id', churchId)
      .gte('sent_at', cooldownCutoff);
    const recentlyNotified = new Set((recentLogs || []).map((r: any) => r.shepherd_id));

    const shepherdIds = Array.from(lateBySheperd.keys()).filter(id => !recentlyNotified.has(id));
    if (shepherdIds.length === 0) return json({ sent: 0, reason: 'all in cooldown' });

    // ── Coordonnées des bergers ──
    const { data: shepherds, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, nickname, phone')
      .eq('church_id', churchId)
      .eq('status', 'active')
      .in('id', shepherdIds);
    if (usersErr) throw usersErr;

    // ── Envoi (réutilise la fonction send-sms → fournisseur actif) ──
    const results: any[] = [];
    for (const sh of shepherds || []) {
      if (!sh.phone) {
        results.push({ shepherd: sh.id, status: 'skipped', reason: 'no phone' });
        continue;
      }
      const count = lateBySheperd.get(sh.id) || 0;
      const surnom = sh.nickname || (sh.full_name || '').split(' ')[0] || '';
      const message = cfg.message
        .replace(/\[surnom\]/g, surnom)
        .replace(/\[nombre\]/g, String(count));

      try {
        const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipients: sh.phone, message }),
        });
        const data = await resp.json();
        if (!resp.ok || data?.success === false) throw new Error(data?.error || `HTTP ${resp.status}`);

        await supabase.from('shepherd_reminder_log').insert({
          church_id: churchId,
          shepherd_id: sh.id,
          souls_count: count,
        });
        results.push({ shepherd: sh.id, status: 'sent', count });
      } catch (e: any) {
        console.error(`Reminder failed for shepherd ${sh.id}:`, e.message);
        results.push({ shepherd: sh.id, status: 'failed', error: e.message });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    console.log(`Shepherd reminders: ${sent} sent`, results);
    return json({ sent, results });
  } catch (error: any) {
    console.error('Error in send-shepherd-reminders:', error);
    return json({ error: error.message }, 500);
  }
});
