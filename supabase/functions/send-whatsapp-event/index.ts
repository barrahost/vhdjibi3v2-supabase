import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY    = 2000;
const MAX_BACKOFF    = 30000;
const GRAPH_API_VERSION = 'v20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

// Événements déclenchés côté SQL (net.http_post depuis les triggers)
interface EventPayload {
  type: 'leave_request_submitted' | 'shepherd_confirmation_submitted' | 'leave_request_decided' | 'interaction_reminder';
  church_id: string;
  // leave_request_submitted
  user_name?: string;
  start_date?: string;
  end_date?: string;
  // shepherd_confirmation_submitted
  shepherd_name?: string;
  // leave_request_decided
  phone?: string;
  decision_label?: string;
  // interaction_reminder
  target_user_id?: string;
  soul_name?: string;
  days?: number;
}

// Charge la config WhatsApp depuis app_settings, avec fallback sur les env vars
async function loadWhatsAppConfig(supabase: any): Promise<WhatsAppConfig> {
  const fallback: WhatsAppConfig = {
    phoneNumberId:     Deno.env.get('WA_PHONE_NUMBER_ID') || '',
    accessToken:       Deno.env.get('WA_ACCESS_TOKEN') || '',
    businessAccountId: Deno.env.get('WA_BUSINESS_ACCOUNT_ID') || '',
  };

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'whatsapp')
      .single();

    if (error || !data?.value) return fallback;

    const cfg = data.value as Record<string, any>;
    return {
      phoneNumberId:     cfg.phoneNumberId     || fallback.phoneNumberId,
      accessToken:       cfg.accessToken       || fallback.accessToken,
      businessAccountId: cfg.businessAccountId || fallback.businessAccountId,
    };
  } catch {
    return fallback;
  }
}

function validateAndFormatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('225')) {
    if (cleanPhone.length !== 13) throw new Error(`Numéro invalide : ${phone}`);
    return cleanPhone;
  }
  if (cleanPhone.length !== 10) throw new Error(`Numéro invalide : ${phone}`);
  return `225${cleanPhone}`;
}

function getBackoffTime(attempt: number): number {
  return Math.min(RETRY_DELAY * Math.pow(2, attempt - 1), MAX_BACKOFF) + Math.random() * 1000;
}

async function fetchWithRetry(url: string, options: RequestInit, attempt = 1): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000 * Math.pow(1.5, attempt - 1));
    const response   = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error('La requête a expiré');
    const isNetwork =
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('network timeout');
    if (isNetwork && attempt < RETRY_ATTEMPTS) {
      await new Promise(r => setTimeout(r, getBackoffTime(attempt)));
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw error;
  }
}

async function sendTemplate(
  cfg: WhatsAppConfig,
  toPhone: string,
  templateName: string,
  params: string[]
): Promise<any> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${cfg.phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: validateAndFormatPhone(toPhone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'fr' },
      components: [
        {
          type: 'body',
          parameters: params.map(text => ({ type: 'text', text })),
        },
      ],
    },
  };

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

async function resolveAdminPhones(supabase: any, churchId: string): Promise<string[]> {
  const [usersRes, adminsRes] = await Promise.all([
    supabase
      .from('users')
      .select('phone, role, roles')
      .eq('church_id', churchId)
      .eq('status', 'active')
      .not('phone', 'is', null),
    supabase
      .from('admins')
      .select('phone, status')
      .eq('status', 'active')
      .not('phone', 'is', null),
  ]);

  const phones = new Set<string>();

  for (const u of usersRes.data ?? []) {
    const roleList: string[] = Array.isArray(u.roles) ? u.roles : [];
    if (u.role === 'admin' || u.role === 'super_admin' || roleList.includes('admin') || roleList.includes('super_admin')) {
      if (u.phone) phones.add(u.phone);
    }
  }
  for (const a of adminsRes.data ?? []) {
    if (a.phone) phones.add(a.phone);
  }

  return [...phones];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    const providedSecret = req.headers.get('x-webhook-secret');
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const cfg = await loadWhatsAppConfig(supabase);
    if (!cfg.phoneNumberId || !cfg.accessToken) {
      throw new Error('Configuration WhatsApp manquante (phoneNumberId/accessToken)');
    }

    const payload: EventPayload = await req.json();
    const results: any[] = [];

    switch (payload.type) {
      case 'leave_request_submitted': {
        const phones = await resolveAdminPhones(supabase, payload.church_id);
        for (const phone of phones) {
          results.push(await sendTemplate(cfg, phone, 'leave_request_submitted', [
            payload.user_name ?? '',
            payload.start_date ?? '',
            payload.end_date ?? '',
          ]));
        }
        break;
      }
      case 'shepherd_confirmation_submitted': {
        const phones = await resolveAdminPhones(supabase, payload.church_id);
        for (const phone of phones) {
          results.push(await sendTemplate(cfg, phone, 'shepherd_confirmation_submitted', [
            payload.shepherd_name ?? '',
          ]));
        }
        break;
      }
      case 'leave_request_decided': {
        if (!payload.phone) throw new Error('Numéro manquant pour leave_request_decided');
        results.push(await sendTemplate(cfg, payload.phone, 'leave_request_decided', [
          payload.start_date ?? '',
          payload.end_date ?? '',
          payload.decision_label ?? '',
        ]));
        break;
      }
      case 'interaction_reminder': {
        if (!payload.target_user_id) throw new Error('target_user_id manquant pour interaction_reminder');
        const { data: shepherd } = await supabase
          .from('users')
          .select('phone')
          .eq('id', payload.target_user_id)
          .single();
        if (shepherd?.phone) {
          results.push(await sendTemplate(cfg, shepherd.phone, 'interaction_reminder', [
            payload.soul_name ?? '',
            String(payload.days ?? ''),
          ]));
        }
        break;
      }
      default:
        throw new Error(`Type d'événement inconnu : ${payload.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-whatsapp-event:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erreur lors de l'envoi WhatsApp" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
