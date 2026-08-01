// Notifications SMS liées aux demandes de congé.
// Appelée par l'appli (formulaire public + page Absences) juste après l'écriture
// en base ; tout le contenu des SMS est reconstruit ici à partir de la base
// (jamais depuis le payload client), le client ne fournit que des identifiants.
//
// Actions :
//  - { type: 'submitted', userId } : SMS aux pasteurs — une demande vient d'être soumise
//  - { type: 'decision', requestId } : SMS au demandeur — sa demande a été approuvée/refusée
//
// Config : app_settings.sms.leaveRequestSms (enabled + messages personnalisables).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fenêtre de fraîcheur pour 'submitted' : on ne notifie que les demandes
// réellement récentes, pour empêcher de rejouer indéfiniment l'endpoint.
const SUBMITTED_MAX_AGE_MS = 6 * 3600 * 1000;

interface LeaveRequestSmsConfig {
  enabled: boolean;
  submittedMessage: string; // [nom], [role], [periode] — envoyé aux pasteurs
  approvedMessage: string;  // [surnom], [periode]     — envoyé au demandeur
  rejectedMessage: string;  // [surnom], [periode]     — envoyé au demandeur
}

const DEFAULT_SUBMITTED_MESSAGE =
  "Bergerie AGC : [nom] ([role]) a soumis une demande de conge : [periode]. " +
  "Merci de la traiter dans l'appli.";
const DEFAULT_APPROVED_MESSAGE =
  "Bergerie AGC : [surnom], ta demande de conge [periode] a ete APPROUVEE. Bon repos !";
const DEFAULT_REJECTED_MESSAGE =
  "Bergerie AGC : [surnom], ta demande de conge [periode] n'a pas ete acceptee. " +
  "Rapproche-toi du pasteur pour en savoir plus.";

function normalizeLeaveRequestSmsConfig(raw: any): LeaveRequestSmsConfig {
  return {
    enabled:          raw?.enabled === true,
    submittedMessage: (raw?.submittedMessage || '').trim() || DEFAULT_SUBMITTED_MESSAGE,
    approvedMessage:  (raw?.approvedMessage || '').trim() || DEFAULT_APPROVED_MESSAGE,
    rejectedMessage:  (raw?.rejectedMessage || '').trim() || DEFAULT_REJECTED_MESSAGE,
  };
}

// 'YYYY-MM-DD' -> 'JJ/MM'
function ddmm(dateStr: string): string {
  const [, m, d] = String(dateStr).split('-');
  return `${d}/${m}`;
}

// Résumé compact des périodes, borné pour tenir dans un SMS de 160 caractères.
function formatPeriods(requests: { start_date: string; end_date: string }[]): string {
  if (requests.length === 0) return '';
  const first = [...requests].sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))[0];
  const range = `du ${ddmm(first.start_date)} au ${ddmm(first.end_date)}`;
  return requests.length === 1 ? range : `${requests.length} periodes, la 1re ${range}`;
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
        // La limite dure de send-sms est 160 caractères : on tronque plutôt
        // que d'échouer si un nom long fait déborder le modèle.
        body: JSON.stringify({ recipients: phone, message: message.slice(0, 160) }),
      });
      const data = await resp.json();
      if (!resp.ok || data?.success === false) throw new Error(data?.error || `HTTP ${resp.status}`);
    };

    // ── Config (même source unique que send-shepherd-reminders) ──
    const { data: settingsRow } = await supabase
      .from('app_settings')
      .select('value, church_id')
      .eq('key', 'sms')
      .single();

    const cfg = normalizeLeaveRequestSmsConfig(settingsRow?.value?.leaveRequestSms);
    const churchId = settingsRow?.church_id || 'bergerie';

    if (!cfg.enabled) return json({ skipped: 'leaveRequestSms disabled' });

    const { type, userId, requestId } = await req.json();

    // ════════════════════════════════════════════════════════════════════
    // 'submitted' — une demande vient d'être soumise → SMS aux pasteurs
    // ════════════════════════════════════════════════════════════════════
    if (type === 'submitted') {
      if (!userId) return json({ error: 'userId requis' }, 400);

      const freshCutoff = new Date(Date.now() - SUBMITTED_MAX_AGE_MS).toISOString();
      const { data: requests, error: reqErr } = await supabase
        .from('leave_requests')
        .select('id, user_name, user_role, start_date, end_date')
        .eq('church_id', churchId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('submitted_at', freshCutoff)
        .order('start_date');
      if (reqErr) throw reqErr;
      if (!requests || requests.length === 0) return json({ skipped: 'no fresh pending request' });

      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, full_name, phone, role, roles, business_profiles')
        .eq('church_id', churchId)
        .eq('status', 'active');
      if (usersErr) throw usersErr;

      const pasteurs = (users || []).filter(u => isPasteur(u) && u.phone);
      if (pasteurs.length === 0) return json({ skipped: 'no pasteur with phone' });

      const message = cfg.submittedMessage
        .replace(/\[nom\]/g, requests[0].user_name || '')
        .replace(/\[role\]/g, requests[0].user_role || '')
        .replace(/\[periode\]/g, formatPeriods(requests));

      const results: any[] = [];
      for (const p of pasteurs) {
        try {
          await sendSms(p.phone, message);
          results.push({ pasteur: p.id, status: 'sent' });
        } catch (e: any) {
          console.error(`Leave submitted SMS failed for ${p.id}:`, e.message);
          results.push({ pasteur: p.id, status: 'failed', error: e.message });
        }
      }
      return json({ sent: results.filter(r => r.status === 'sent').length, results });
    }

    // ════════════════════════════════════════════════════════════════════
    // 'decision' — le pasteur a répondu → SMS au demandeur
    // ════════════════════════════════════════════════════════════════════
    if (type === 'decision') {
      if (!requestId) return json({ error: 'requestId requis' }, 400);

      const { data: request, error: reqErr } = await supabase
        .from('leave_requests')
        .select('id, user_id, user_name, start_date, end_date, status')
        .eq('church_id', churchId)
        .eq('id', requestId)
        .single();
      if (reqErr || !request) return json({ error: 'Demande introuvable' }, 404);
      if (request.status !== 'approved' && request.status !== 'rejected') {
        return json({ skipped: 'request still pending' });
      }

      // Les demandeurs saisis manuellement ('manual:...') n'ont pas de fiche
      // utilisateur, donc pas de téléphone : rien à envoyer.
      const { data: requester } = await supabase
        .from('users')
        .select('id, full_name, nickname, phone')
        .eq('church_id', churchId)
        .eq('id', request.user_id)
        .maybeSingle();
      if (!requester?.phone) return json({ skipped: 'requester has no phone' });

      const surnom = requester.nickname || (requester.full_name || request.user_name || '').split(' ')[0] || '';
      const template = request.status === 'approved' ? cfg.approvedMessage : cfg.rejectedMessage;
      const message = template
        .replace(/\[surnom\]/g, surnom)
        .replace(/\[periode\]/g, formatPeriods([request]));

      await sendSms(requester.phone, message);
      return json({ sent: 1, to: requester.id, decision: request.status });
    }

    return json({ error: `type inconnu : ${type}` }, 400);
  } catch (error: any) {
    console.error('Error in notify-leave-request:', error);
    return json({ error: error.message || 'Erreur notify-leave-request' }, 500);
  }
});
