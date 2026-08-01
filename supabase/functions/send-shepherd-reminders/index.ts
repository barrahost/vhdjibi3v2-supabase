// Rappels SMS automatiques — bergers et chefs de famille.
// Appelée toutes les heures par pg_cron (via pg_net) ; chaque bloc ne fait quelque
// chose que si sa config (app_settings.sms.*) est activée et que le jour/heure
// courants correspondent. Protégée par le header X-Cron-Secret.
//
// Blocs :
//  - shepherdReminders     : bergers avec âmes sans interaction depuis X jours
//  - familyLeaderReminders : chefs de famille — âmes sans berger + bergers en
//    retard durable (escalade), et sur un créneau séparé, récap des nouvelles âmes
//  - leaveRequestSms       : pasteurs — relance hebdo des demandes de congé
//    restées sans réponse (défaut : dimanche 8h)
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

interface EvangelistConfig {
  enabled: boolean;
  dayOfWeek: number;      // creneau du rappel "a relancer"
  hour: number;
  thresholdDays: number;  // jours sans contact avant relance
  cooldownDays: number;
  relanceMessage: string;    // [surnom], [nombre]
  attendusEnabled: boolean;  // rappel la veille de chaque culte
  attendusHour: number;      // heure d'envoi la veille (jour derive du programme des cultes)
  attendusMessage: string;   // [surnom], [nombre]
}

const DEFAULT_EV_RELANCE_MESSAGE =
  "Bergerie AGC : [surnom], [nombre] de tes contacts evangelises attendent une relance. " +
  "Retrouve-les dans « A relancer » sur l'appli.";
const DEFAULT_EV_ATTENDUS_MESSAGE =
  "Bergerie AGC : [surnom], [nombre] de tes contacts sont attendus au culte de demain. " +
  "Appelle-les ce soir et accueille-les a l'entree !";

// Relance des demandes de congé sans réponse, envoyée aux pasteurs
interface LeaveReminderConfig {
  reminderEnabled: boolean;
  reminderDayOfWeek: number; // défaut 0 = dimanche
  reminderHour: number;      // défaut 8h
  reminderMessage: string;   // [nombre]
}

const DEFAULT_LEAVE_REMINDER_MESSAGE =
  "Bergerie AGC : [nombre] demande(s) de conge attendent ta reponse. " +
  "Merci de les traiter dans l'appli.";

function normalizeLeaveReminderConfig(raw: any): LeaveReminderConfig {
  return {
    reminderEnabled:   raw?.reminderEnabled === true,
    reminderDayOfWeek: Number.isInteger(raw?.reminderDayOfWeek) ? raw.reminderDayOfWeek : 0,
    reminderHour:      Number.isInteger(raw?.reminderHour) ? raw.reminderHour : 8,
    reminderMessage:   (raw?.reminderMessage || '').trim() || DEFAULT_LEAVE_REMINDER_MESSAGE,
  };
}

// Un utilisateur est "pasteur" quel que soit l'endroit où le rôle est stocké :
// colonne role (texte), roles jsonb {primary, secondary} ou business_profiles.
function isPasteur(u: any): boolean {
  if (u.role === 'pasteur') return true;
  if (u.roles?.primary === 'pasteur') return true;
  if (Array.isArray(u.roles?.secondary) && u.roles.secondary.includes('pasteur')) return true;
  if (Array.isArray(u.business_profiles) && u.business_profiles.some((p: any) => p?.type === 'pasteur')) return true;
  return false;
}

// Culte envisage (formulaire d'evangelisation) -> type de rencontre du programme recurrent
const PLANNED_SERVICE_TO_MEETING_TYPE: Record<string, string> = {
  wednesday_evening: 'Rendez-Vous des Champions',
  sunday_first: '1er Culte de Célébration & Contemplation',
  sunday_second: '2e Culte de Célébration & Contemplation',
};

function normalizeEvangelistConfig(raw: any): EvangelistConfig {
  return {
    enabled:         raw?.enabled === true,
    dayOfWeek:       Number.isInteger(raw?.dayOfWeek) ? raw.dayOfWeek : 2,
    hour:            Number.isInteger(raw?.hour) ? raw.hour : 8,
    thresholdDays:   Number(raw?.thresholdDays) > 0 ? Number(raw.thresholdDays) : 7,
    cooldownDays:    Number(raw?.cooldownDays) > 0 ? Number(raw.cooldownDays) : 7,
    relanceMessage:  (raw?.relanceMessage || '').trim() || DEFAULT_EV_RELANCE_MESSAGE,
    attendusEnabled: raw?.attendusEnabled === true,
    attendusHour:    Number.isInteger(raw?.attendusHour) ? raw.attendusHour : 18,
    attendusMessage: (raw?.attendusMessage || '').trim() || DEFAULT_EV_ATTENDUS_MESSAGE,
  };
}

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
    const evCfg = normalizeEvangelistConfig(settingsRow?.value?.evangelistReminders);
    const lrCfg = normalizeLeaveReminderConfig(settingsRow?.value?.leaveRequestSms);
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
    const evRelanceSlot = evCfg.enabled && slotMatches(evCfg.dayOfWeek, evCfg.hour);
    // Attendus : la bonne heure suffit ici ; le "est-ce la veille d'un culte ?"
    // est verifie dans le bloc via le programme recurrent.
    const evAttendusMaybe = evCfg.enabled && evCfg.attendusEnabled && (force || now.getUTCHours() === evCfg.attendusHour);
    const leaveSlot = lrCfg.reminderEnabled && slotMatches(lrCfg.reminderDayOfWeek, lrCfg.reminderHour);

    if (!shepherdSlot && !flAlertSlot && !flRecapSlot && !evRelanceSlot && !evAttendusMaybe && !leaveSlot) {
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

    // ════════════════════════════════════════════════════════════════════
    // BLOCS 4 & 5 — Évangélistes (relances hebdo + attendus de la veille)
    // ════════════════════════════════════════════════════════════════════
    if (evRelanceSlot || evAttendusMaybe) {
      const results: any[] = [];

      // Contacts évangélisés encore suivis par l'évangéliste (non reçus à l'église)
      const { data: evSouls, error: evErr } = await supabase
        .from('evangelized_souls')
        .select('id, evangelist_id, evangelization_date, planned_service, service_attendance, imported_to_soul_id, created_at')
        .eq('church_id', churchId)
        .eq('status', 'active')
        .not('evangelist_id', 'is', null)
        .is('imported_to_soul_id', null);
      if (evErr) throw evErr;

      const { data: recentEvLogs } = await supabase
        .from('evangelist_reminder_log')
        .select('evangelist_id, reminder_type, sent_at')
        .eq('church_id', churchId)
        .gte('sent_at', new Date(now.getTime() - evCfg.cooldownDays * 24 * 3600 * 1000).toISOString());

      const evangelistIds = [...new Set((evSouls || []).map((s: any) => s.evangelist_id))];
      const { data: evangelists } = evangelistIds.length
        ? await supabase.from('users').select('id, full_name, nickname, phone')
            .eq('church_id', churchId).eq('status', 'active').in('id', evangelistIds)
        : { data: [] };
      const evangelistById = new Map((evangelists || []).map((u: any) => [u.id, u]));

      // L'anti-relance est géré par l'appelant (cooldown 7j pour 'relance', 1/jour pour 'attendus')
      const notifyEvangelist = async (evId: string, type: string, count: number, template: string) => {
        if (count <= 0) return;
        const ev = evangelistById.get(evId);
        if (!ev) { results.push({ evangelist: evId, type, status: 'skipped', reason: 'no user' }); return; }
        if (!ev.phone) { results.push({ evangelist: evId, type, status: 'skipped', reason: 'no phone' }); return; }
        const message = template
          .replace(/\[surnom\]/g, surnomOf(ev))
          .replace(/\[nombre\]/g, String(count));
        try {
          await sendSms(ev.phone, message);
          await supabase.from('evangelist_reminder_log').insert({ church_id: churchId, evangelist_id: evId, reminder_type: type, item_count: count });
          results.push({ evangelist: evId, type, status: 'sent', count });
        } catch (e: any) {
          console.error(`Evangelist reminder ${type} failed for ${evId}:`, e.message);
          results.push({ evangelist: evId, type, status: 'failed', error: e.message });
        }
      };

      // ── BLOC 4 : relances hebdo (contacts sans nouvelle depuis X jours) ──
      if (evRelanceSlot) {
        const relanceCooldown = new Set(
          (recentEvLogs || []).filter((r: any) => r.reminder_type === 'relance').map((r: any) => r.evangelist_id)
        );
        // Dernier contact par âme évangélisée (interactions rattachées à son id)
        const evSoulIds = (evSouls || []).map((s: any) => s.id);
        const lastContact = new Map<string, string>();
        for (let i = 0; i < evSoulIds.length; i += 500) {
          const batch = evSoulIds.slice(i, i + 500);
          const { data: rows } = await supabase
            .from('interactions')
            .select('soul_id, date')
            .eq('church_id', churchId)
            .in('soul_id', batch);
          (rows || []).forEach((r: any) => {
            const prev = lastContact.get(r.soul_id);
            if (!prev || (r.date && r.date > prev)) lastContact.set(r.soul_id, r.date);
          });
        }
        const cutoff = new Date(now.getTime() - evCfg.thresholdDays * 24 * 3600 * 1000).toISOString();
        const toRelanceBy = new Map<string, number>();
        (evSouls || []).forEach((s: any) => {
          const last = lastContact.get(s.id) || s.evangelization_date || s.created_at;
          if (last && last < cutoff) {
            toRelanceBy.set(s.evangelist_id, (toRelanceBy.get(s.evangelist_id) || 0) + 1);
          }
        });
        for (const [evId, count] of toRelanceBy) {
          if (relanceCooldown.has(evId)) { results.push({ evangelist: evId, type: 'relance', status: 'cooldown' }); continue; }
          await notifyEvangelist(evId, 'relance', count, evCfg.relanceMessage);
        }
      }

      // ── BLOC 5 : attendus au culte de demain (veille de chaque culte) ──
      if (evAttendusMaybe) {
        // Quels types de culte ont lieu DEMAIN, d'après le programme récurrent ?
        const tomorrowDow = (now.getUTCDay() + 1) % 7;
        const { data: schedules } = await supabase
          .from('culte_recurring_schedules')
          .select('meeting_type_name, day_of_week, is_active')
          .eq('church_id', churchId)
          .eq('is_active', true)
          .eq('day_of_week', tomorrowDow);
        const meetingNamesTomorrow = new Set((schedules || []).map((s: any) => s.meeting_type_name));
        const plannedKeysTomorrow = Object.entries(PLANNED_SERVICE_TO_MEETING_TYPE)
          .filter(([, name]) => meetingNamesTomorrow.has(name))
          .map(([key]) => key);

        if (plannedKeysTomorrow.length > 0) {
          // Un seul rappel "attendus" par évangéliste et par jour
          const today = now.toISOString().slice(0, 10);
          const attendusSentToday = new Set(
            (recentEvLogs || [])
              .filter((r: any) => r.reminder_type === 'attendus' && String(r.sent_at).slice(0, 10) === today)
              .map((r: any) => r.evangelist_id)
          );
          const attendusBy = new Map<string, number>();
          (evSouls || []).forEach((s: any) => {
            if (plannedKeysTomorrow.includes(s.planned_service) && s.service_attendance !== 'came') {
              attendusBy.set(s.evangelist_id, (attendusBy.get(s.evangelist_id) || 0) + 1);
            }
          });
          for (const [evId, count] of attendusBy) {
            if (attendusSentToday.has(evId)) { results.push({ evangelist: evId, type: 'attendus', status: 'already sent today' }); continue; }
            await notifyEvangelist(evId, 'attendus', count, evCfg.attendusMessage);
          }
        } else {
          results.push({ info: 'pas de culte demain' });
        }
      }

      summary.evangelists = { sent: results.filter(r => r.status === 'sent').length, results };
    }

    // ════════════════════════════════════════════════════════════════════
    // BLOC 6 — Relance aux pasteurs : demandes de congé sans réponse
    // ════════════════════════════════════════════════════════════════════
    if (leaveSlot) {
      const results: any[] = [];

      const { count: pendingCount, error: pendingErr } = await supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('status', 'pending');
      if (pendingErr) throw pendingErr;

      if ((pendingCount || 0) > 0) {
        const { data: users, error: usersErr } = await supabase
          .from('users')
          .select('id, full_name, nickname, phone, role, roles, business_profiles')
          .eq('church_id', churchId)
          .eq('status', 'active');
        if (usersErr) throw usersErr;
        const pasteurs = (users || []).filter((u: any) => isPasteur(u));

        // Anti-doublon : au plus une relance par pasteur et par jour (protège
        // des doubles executions du cron et des tests manuels force=true)
        const dayCutoff = new Date(now.getTime() - 20 * 3600 * 1000).toISOString();
        const { data: recentLogs } = await supabase
          .from('leave_reminder_log')
          .select('pasteur_id')
          .eq('church_id', churchId)
          .gte('sent_at', dayCutoff);
        const alreadySent = new Set((recentLogs || []).map((r: any) => r.pasteur_id));

        for (const p of pasteurs) {
          if (alreadySent.has(p.id)) { results.push({ pasteur: p.id, status: 'already sent today' }); continue; }
          if (!p.phone) { results.push({ pasteur: p.id, status: 'skipped', reason: 'no phone' }); continue; }
          const message = lrCfg.reminderMessage
            .replace(/\[surnom\]/g, surnomOf(p))
            .replace(/\[nombre\]/g, String(pendingCount));
          try {
            await sendSms(p.phone, message);
            await supabase.from('leave_reminder_log').insert({ church_id: churchId, pasteur_id: p.id, pending_count: pendingCount });
            results.push({ pasteur: p.id, status: 'sent', count: pendingCount });
          } catch (e: any) {
            console.error(`Leave reminder failed for ${p.id}:`, e.message);
            results.push({ pasteur: p.id, status: 'failed', error: e.message });
          }
        }
      } else {
        results.push({ info: 'aucune demande en attente' });
      }

      summary.leaveRequests = { sent: results.filter(r => r.status === 'sent').length, results };
    }

    console.log('Reminders summary:', JSON.stringify(summary));
    return json(summary);
  } catch (error: any) {
    console.error('Error in send-shepherd-reminders:', error);
    return json({ error: error.message }, 500);
  }
});
