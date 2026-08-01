// Rappels SMS automatiques — bergers et chefs de famille.
// Appelée toutes les heures par pg_cron (via pg_net) ; chaque bloc ne fait quelque
// chose que si sa config (app_settings.sms.*) est activée et que le jour/heure
// courants correspondent. Protégée par le header X-Cron-Secret.
//
// Blocs :
//  - shepherdReminders     : bergers avec âmes sans interaction depuis X jours
//  - familyLeaderReminders : chefs de famille — âmes sans berger + bergers en
//    retard durable (escalade), et sur un créneau séparé, récap des nouvelles âmes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// ── Configs ────────────────────────────────────────────────────────────────
interface ShepherdConfig {
  enabled: boolean;
  dayOfWeek: number;      // 0 = dimanche ... 6 = samedi
  hour: number;           // heure d'envoi (fuseau Abidjan = UTC)
  thresholdDays: number;
  cooldownDays: number;
  message: string;        // [surnom], [nombre]
}

interface FamilyLeaderConfig {
  enabled: boolean;
  dayOfWeek: number;
  hour: number;
  escalationDays: number; // retard durable d'un berger avant escalade
  cooldownDays: number;
  unassignedMessage: string; // [surnom], [nombre]
  escalationMessage: string; // [surnom], [nombre]
  recapEnabled: boolean;
  recapDayOfWeek: number;
  recapHour: number;
  recapMessage: string;      // [surnom], [nombre]
}

const DEFAULT_SHEPHERD_MESSAGE =
  "Bergerie AGC : [surnom], tu as [nombre] ame(s) sans interaction depuis 5+ jours. " +
  "Merci de les contacter et d'enregistrer l'interaction dans l'appli.";
const DEFAULT_UNASSIGNED_MESSAGE =
  "Bergerie AGC : [surnom], [nombre] ame(s) de ta famille n'ont pas encore de berger. " +
  "Merci de les assigner dans l'appli.";
const DEFAULT_ESCALATION_MESSAGE =
  "Bergerie AGC : [surnom], [nombre] berger(s) de ta famille ont des ames sans suivi " +
  "depuis 14+ jours. Un echange avec eux serait utile.";
const DEFAULT_RECAP_MESSAGE =
  "Bergerie AGC : [surnom], ta famille a accueilli [nombre] nouvelle(s) ame(s) cette semaine. " +
  "Pense a organiser leur accueil !";

function normalizeShepherdConfig(raw: any): ShepherdConfig {
  return {
    enabled:       raw?.enabled === true,
    dayOfWeek:     Number.isInteger(raw?.dayOfWeek) ? raw.dayOfWeek : 2,
    hour:          Number.isInteger(raw?.hour) ? raw.hour : 8,
    thresholdDays: Number(raw?.thresholdDays) > 0 ? Number(raw.thresholdDays) : 5,
    cooldownDays:  Number(raw?.cooldownDays) > 0 ? Number(raw.cooldownDays) : 7,
    message:       (raw?.message || '').trim() || DEFAULT_SHEPHERD_MESSAGE,
  };
}

function normalizeFamilyLeaderConfig(raw: any): FamilyLeaderConfig {
  return {
    enabled:           raw?.enabled === true,
    dayOfWeek:         Number.isInteger(raw?.dayOfWeek) ? raw.dayOfWeek : 2,
    hour:              Number.isInteger(raw?.hour) ? raw.hour : 8,
    escalationDays:    Number(raw?.escalationDays) > 0 ? Number(raw.escalationDays) : 14,
    cooldownDays:      Number(raw?.cooldownDays) > 0 ? Number(raw.cooldownDays) : 7,
    unassignedMessage: (raw?.unassignedMessage || '').trim() || DEFAULT_UNASSIGNED_MESSAGE,
    escalationMessage: (raw?.escalationMessage || '').trim() || DEFAULT_ESCALATION_MESSAGE,
    recapEnabled:      raw?.recapEnabled === true,
    recapDayOfWeek:    Number.isInteger(raw?.recapDayOfWeek) ? raw.recapDayOfWeek : 1, // lundi
    recapHour:         Number.isInteger(raw?.recapHour) ? raw.recapHour : 18,
    recapMessage:      (raw?.recapMessage || '').trim() || DEFAULT_RECAP_MESSAGE,
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

    const sendSms = async (phone: string, message: string) => {
      const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipients: phone, message }),
      });
      const data = await resp.json();
      if (!resp.ok || data?.success === false) throw new Error(data?.error || `HTTP ${resp.status}`);
    };

    const surnomOf = (u: any) => u.nickname || (u.full_name || '').split(' ')[0] || '';

    // ── Config ──
    const { data: settingsRow } = await supabase
      .from('app_settings')
      .select('value, church_id')
      .eq('key', 'sms')
      .single();

    const shepherdCfg = normalizeShepherdConfig(settingsRow?.value?.shepherdReminders);
    const flCfg = normalizeFamilyLeaderConfig(settingsRow?.value?.familyLeaderReminders);
    const churchId = settingsRow?.church_id || 'bergerie';

    // force=true (test manuel) ignore les créneaux jour/heure
    const force = new URL(req.url).searchParams.get('force') === 'true';
    const now = new Date();
    const slotMatches = (day: number, hour: number) =>
      force || (now.getUTCDay() === day && now.getUTCHours() === hour);

    const summary: Record<string, unknown> = {};

    // ── Données partagées : âmes actives + dernières interactions ──
    // (chargées une seule fois si au moins un bloc doit tourner)
    const shepherdSlot = shepherdCfg.enabled && slotMatches(shepherdCfg.dayOfWeek, shepherdCfg.hour);
    const flAlertSlot  = flCfg.enabled && slotMatches(flCfg.dayOfWeek, flCfg.hour);
    const flRecapSlot  = flCfg.enabled && flCfg.recapEnabled && slotMatches(flCfg.recapDayOfWeek, flCfg.recapHour);

    if (!shepherdSlot && !flAlertSlot && !flRecapSlot) {
      return json({ skipped: 'outside schedule or disabled' });
    }

    const { data: souls, error: soulsErr } = await supabase
      .from('souls')
      .select('id, shepherd_id, service_family_id, created_at')
      .eq('church_id', churchId)
      .eq('status', 'active');
    if (soulsErr) throw soulsErr;

    const lastInteraction = new Map<string, string>();
    if (shepherdSlot || flAlertSlot) {
      const assignedIds = (souls || []).filter((s: any) => s.shepherd_id).map((s: any) => s.id);
      for (let i = 0; i < assignedIds.length; i += 500) {
        const batch = assignedIds.slice(i, i + 500);
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
    }

    const lateSoulsBy = (thresholdDays: number) => {
      const cutoff = new Date(now.getTime() - thresholdDays * 24 * 3600 * 1000).toISOString();
      // par berger : nb d'âmes en retard ; par famille : bergers distincts en retard
      const byShepherd = new Map<string, number>();
      const lateShepherdsByFamily = new Map<string, Set<string>>();
      (souls || []).forEach((s: any) => {
        if (!s.shepherd_id) return;
        const lastDate = lastInteraction.get(s.id) || s.created_at;
        if (lastDate && lastDate < cutoff) {
          byShepherd.set(s.shepherd_id, (byShepherd.get(s.shepherd_id) || 0) + 1);
          if (s.service_family_id) {
            if (!lateShepherdsByFamily.has(s.service_family_id)) lateShepherdsByFamily.set(s.service_family_id, new Set());
            lateShepherdsByFamily.get(s.service_family_id)!.add(s.shepherd_id);
          }
        }
      });
      return { byShepherd, lateShepherdsByFamily };
    };

    // ════════════════════════════════════════════════════════════════════
    // BLOC 1 — Rappels aux bergers
    // ════════════════════════════════════════════════════════════════════
    if (shepherdSlot) {
      const { byShepherd } = lateSoulsBy(shepherdCfg.thresholdDays);
      const cooldownCutoff = new Date(now.getTime() - shepherdCfg.cooldownDays * 24 * 3600 * 1000).toISOString();

      const { data: recentLogs } = await supabase
        .from('shepherd_reminder_log')
        .select('shepherd_id')
        .eq('church_id', churchId)
        .gte('sent_at', cooldownCutoff);
      const recentlyNotified = new Set((recentLogs || []).map((r: any) => r.shepherd_id));

      const shepherdIds = Array.from(byShepherd.keys()).filter(id => !recentlyNotified.has(id));
      const results: any[] = [];

      if (shepherdIds.length > 0) {
        const { data: shepherds } = await supabase
          .from('users')
          .select('id, full_name, nickname, phone')
          .eq('church_id', churchId)
          .eq('status', 'active')
          .in('id', shepherdIds);

        for (const sh of shepherds || []) {
          if (!sh.phone) { results.push({ shepherd: sh.id, status: 'skipped', reason: 'no phone' }); continue; }
          const count = byShepherd.get(sh.id) || 0;
          const message = shepherdCfg.message
            .replace(/\[surnom\]/g, surnomOf(sh))
            .replace(/\[nombre\]/g, String(count));
          try {
            await sendSms(sh.phone, message);
            await supabase.from('shepherd_reminder_log').insert({ church_id: churchId, shepherd_id: sh.id, souls_count: count });
            results.push({ shepherd: sh.id, status: 'sent', count });
          } catch (e: any) {
            console.error(`Shepherd reminder failed for ${sh.id}:`, e.message);
            results.push({ shepherd: sh.id, status: 'failed', error: e.message });
          }
        }
      }
      summary.shepherds = { sent: results.filter(r => r.status === 'sent').length, results };
    }

    // ════════════════════════════════════════════════════════════════════
    // BLOCS 2 & 3 — Chefs de famille (alertes + récap)
    // ════════════════════════════════════════════════════════════════════
    if (flAlertSlot || flRecapSlot) {
      // Chefs de famille actifs : profil family_leader avec sa famille de service
      const { data: leaders } = await supabase
        .from('users')
        .select('id, full_name, nickname, phone, business_profiles')
        .eq('church_id', churchId)
        .eq('status', 'active')
        .contains('business_profiles', JSON.stringify([{ type: 'family_leader' }]));

      const leaderByFamily = new Map<string, any>();
      (leaders || []).forEach((u: any) => {
        const p = (u.business_profiles || []).find((x: any) => x?.type === 'family_leader');
        if (p?.serviceFamilyId) leaderByFamily.set(p.serviceFamilyId, u);
      });

      const cooldownCutoff = new Date(now.getTime() - flCfg.cooldownDays * 24 * 3600 * 1000).toISOString();
      const { data: recentFlLogs } = await supabase
        .from('family_reminder_log')
        .select('leader_id, reminder_type')
        .eq('church_id', churchId)
        .gte('sent_at', cooldownCutoff);
      const alreadySent = new Set((recentFlLogs || []).map((r: any) => `${r.leader_id}:${r.reminder_type}`));

      const results: any[] = [];

      const notifyLeader = async (leader: any, type: string, count: number, template: string) => {
        if (count <= 0) return;
        if (alreadySent.has(`${leader.id}:${type}`)) { results.push({ leader: leader.id, type, status: 'cooldown' }); return; }
        if (!leader.phone) { results.push({ leader: leader.id, type, status: 'skipped', reason: 'no phone' }); return; }
        const message = template
          .replace(/\[surnom\]/g, surnomOf(leader))
          .replace(/\[nombre\]/g, String(count));
        try {
          await sendSms(leader.phone, message);
          await supabase.from('family_reminder_log').insert({ church_id: churchId, leader_id: leader.id, reminder_type: type, item_count: count });
          results.push({ leader: leader.id, type, status: 'sent', count });
        } catch (e: any) {
          console.error(`Family reminder ${type} failed for ${leader.id}:`, e.message);
          results.push({ leader: leader.id, type, status: 'failed', error: e.message });
        }
      };

      if (flAlertSlot) {
        // Alerte 1 : âmes de la famille sans berger
        const unassignedByFamily = new Map<string, number>();
        (souls || []).forEach((s: any) => {
          if (!s.shepherd_id && s.service_family_id) {
            unassignedByFamily.set(s.service_family_id, (unassignedByFamily.get(s.service_family_id) || 0) + 1);
          }
        });
        // Alerte 2 : bergers de la famille en retard durable
        const { lateShepherdsByFamily } = lateSoulsBy(flCfg.escalationDays);

        for (const [familyId, leader] of leaderByFamily) {
          await notifyLeader(leader, 'unassigned', unassignedByFamily.get(familyId) || 0, flCfg.unassignedMessage);
          await notifyLeader(leader, 'escalation', lateShepherdsByFamily.get(familyId)?.size || 0, flCfg.escalationMessage);
        }
      }

      if (flRecapSlot) {
        // Récap : nouvelles âmes de la famille sur les 7 derniers jours
        const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
        const newByFamily = new Map<string, number>();
        (souls || []).forEach((s: any) => {
          if (s.service_family_id && s.created_at && s.created_at >= weekAgo) {
            newByFamily.set(s.service_family_id, (newByFamily.get(s.service_family_id) || 0) + 1);
          }
        });
        for (const [familyId, leader] of leaderByFamily) {
          await notifyLeader(leader, 'recap', newByFamily.get(familyId) || 0, flCfg.recapMessage);
        }
      }

      summary.familyLeaders = { sent: results.filter(r => r.status === 'sent').length, results };
    }

    console.log('Reminders summary:', JSON.stringify(summary));
    return json(summary);
  } catch (error: any) {
    console.error('Error in send-shepherd-reminders:', error);
    return json({ error: error.message }, 500);
  }
});
