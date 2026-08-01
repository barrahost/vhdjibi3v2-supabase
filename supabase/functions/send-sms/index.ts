import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY    = 2000;
const MAX_BACKOFF    = 30000;
const AT_API_URL      = 'https://api.africastalking.com/version1/messaging';
const ORANGE_TOKEN_URL = 'https://api.orange.com/oauth/v3/token';
const ORANGE_SMS_BASE  = 'https://api.orange.com/smsmessaging/v1/outbound';
const ORANGE_MAX_TPS   = 5; // limite Orange : 5 SMS/seconde
const LETEXTO_SEND_URL = 'https://apis.letexto.com/v1/messages/send';
const LETEXTO_MAX_TPS  = 5; // prudence : throttle les envois en boucle

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Provider = 'africastalking' | 'orange' | 'letexto';

interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  senderId: string;
}

interface OrangeConfig {
  clientId: string;
  clientSecret: string;
  senderNumber: string; // numéro CI associé au contrat, ex: 225XXXXXXXXX
  senderName: string;   // nom d'expéditeur approuvé, ex: AGCDJIBI3
}

interface LeTextoConfig {
  apiKey: string;   // clé API générée depuis l'application LeTexto (section API développeur)
  senderId: string; // nom d'expéditeur (sender), max 11 caractères
}

interface SMSConfig {
  provider: Provider;
  africastalking: AfricasTalkingConfig;
  orange: OrangeConfig;
  letexto: LeTextoConfig;
}

interface SendSMSRequest {
  recipients: string | string[];
  message: string;
  soulName?: string;
  soulNickname?: string;
  scheduleTime?: string;
}

// Charge la config SMS depuis app_settings (clé 'sms'), avec fallback sur les env vars
async function loadSMSConfig(): Promise<SMSConfig> {
  const fallback: SMSConfig = {
    provider: (Deno.env.get('SMS_PROVIDER') as Provider) || 'africastalking',
    africastalking: {
      apiKey:   Deno.env.get('AT_API_KEY') || '',
      username: Deno.env.get('AT_USERNAME') || 'vhdjibi3',
      senderId: Deno.env.get('AT_SENDER_ID') || '',
    },
    orange: {
      clientId:     Deno.env.get('ORANGE_CLIENT_ID') || '',
      clientSecret: Deno.env.get('ORANGE_CLIENT_SECRET') || '',
      senderNumber: Deno.env.get('ORANGE_SENDER_NUMBER') || '',
      senderName:   Deno.env.get('ORANGE_SENDER_NAME') || '',
    },
    letexto: {
      apiKey:   Deno.env.get('LETEXTO_API_KEY') || '',
      senderId: Deno.env.get('LETEXTO_SENDER_ID') || '',
    },
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'sms')
      .single();

    if (error || !data?.value) return fallback;

    const cfg = data.value as Record<string, any>;
    return {
      provider: cfg.provider || fallback.provider,
      africastalking: {
        apiKey:   cfg.africastalking?.apiKey   ?? cfg.apiKey   ?? fallback.africastalking.apiKey,
        username: cfg.africastalking?.username ?? cfg.username ?? fallback.africastalking.username,
        senderId: cfg.africastalking?.senderId ?? cfg.senderId ?? fallback.africastalking.senderId,
      },
      orange: {
        clientId:     cfg.orange?.clientId     || fallback.orange.clientId,
        clientSecret: cfg.orange?.clientSecret || fallback.orange.clientSecret,
        senderNumber: cfg.orange?.senderNumber || fallback.orange.senderNumber,
        senderName:   cfg.orange?.senderName   || fallback.orange.senderName,
      },
      letexto: {
        apiKey:   cfg.letexto?.apiKey   || fallback.letexto.apiKey,
        senderId: cfg.letexto?.senderId || fallback.letexto.senderId,
      },
    };
  } catch {
    return fallback;
  }
}

function validateAndFormatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('225')) {
    if (cleanPhone.length !== 13) throw new Error(`Numéro invalide : ${phone}`);
    return `+${cleanPhone}`;
  }
  if (cleanPhone.length !== 10) throw new Error(`Numéro invalide : ${phone}`);
  return `+225${cleanPhone}`;
}

function personalizeMessage(message: string, name: string, nickname?: string): string {
  return message
    .replace(/\[nom\]/g, name)
    .replace(/\[surnom\]/g, nickname || name.split(' ')[0]);
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

// ============================================================
// Africa's Talking — envoi en un seul appel (destinataires séparés par virgule)
// ============================================================
async function sendViaAfricasTalking(
  cfg: AfricasTalkingConfig,
  formattedPhones: string[],
  message: string,
  scheduleTime?: string
): Promise<any> {
  if (!cfg.apiKey) throw new Error("Configuration Africa's Talking manquante (apiKey)");

  const params = new URLSearchParams({
    username: cfg.username,
    to:       formattedPhones.join(','),
    message,
  });
  if (cfg.senderId) params.append('from', cfg.senderId);
  if (scheduleTime) params.append('scheduledDelivery', new Date(scheduleTime).toISOString());

  const response = await fetchWithRetry(AT_API_URL, {
    method:  'POST',
    headers: {
      'apiKey':       cfg.apiKey,
      'Accept':       'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const result = await response.json();
  const recipientsResult = result?.SMSMessageData?.Recipients ?? [];
  const failed = recipientsResult.filter((r: any) => r.status !== 'Success');
  if (failed.length > 0) console.warn('Some recipients failed:', failed);

  return result;
}

// ============================================================
// Orange CI — OAuth2 puis un appel par destinataire (max 5/s)
// ============================================================
async function getOrangeAccessToken(cfg: OrangeConfig): Promise<string> {
  const basicAuth = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  const response = await fetchWithRetry(ORANGE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!data.access_token) throw new Error("Impossible d'obtenir un token d'accès Orange");
  return data.access_token;
}

async function sendViaOrange(
  cfg: OrangeConfig,
  formattedPhones: string[],
  message: string
): Promise<any> {
  if (!cfg.clientId || !cfg.clientSecret) throw new Error('Configuration Orange manquante (clientId/clientSecret)');
  if (!cfg.senderNumber) throw new Error('Configuration Orange manquante (senderNumber)');

  const accessToken = await getOrangeAccessToken(cfg);
  const senderAddress = `tel:+${cfg.senderNumber.replace(/\D/g, '')}`;
  const url = `${ORANGE_SMS_BASE}/${encodeURIComponent(senderAddress)}/requests`;

  const results: any[] = [];

  for (let i = 0; i < formattedPhones.length; i++) {
    const phone = formattedPhones[i];
    try {
      const body: Record<string, any> = {
        outboundSMSMessageRequest: {
          address: `tel:${phone}`,
          senderAddress,
          outboundSMSTextMessage: { message },
        },
      };
      if (cfg.senderName) {
        body.outboundSMSMessageRequest.senderName = cfg.senderName;
      }

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      results.push({ phone, status: 'Success', data: await response.json() });
    } catch (error: any) {
      console.warn(`Orange SMS failed for ${phone}:`, error.message);
      results.push({ phone, status: 'Failed', error: error.message });
    }

    // Respecter la limite de 5 SMS/seconde
    if (i < formattedPhones.length - 1) {
      await new Promise(r => setTimeout(r, 1000 / ORANGE_MAX_TPS));
    }
  }

  return { Recipients: results };
}

// ============================================================
// LeTexto (Arolitec) — un appel par destinataire, Bearer token
// Doc : https://apis.letexto.com/v1/messages/send
// ============================================================
async function sendViaLeTexto(
  cfg: LeTextoConfig,
  formattedPhones: string[],
  message: string
): Promise<any> {
  if (!cfg.apiKey) throw new Error('Configuration LeTexto manquante (apiKey)');
  if (!cfg.senderId) throw new Error('Configuration LeTexto manquante (senderId)');
  if (cfg.senderId.length > 11) throw new Error('LeTexto : le sender doit faire 11 caractères maximum');

  const results: any[] = [];

  for (let i = 0; i < formattedPhones.length; i++) {
    // LeTexto attend le format international SANS le "+" (ex: 2250585743342)
    const phone = formattedPhones[i].replace(/^\+/, '');
    try {
      const response = await fetchWithRetry(LETEXTO_SEND_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    cfg.senderId,
          to:      phone,
          content: message,
        }),
      });
      results.push({ phone, status: 'Success', data: await response.json() });
    } catch (error: any) {
      console.warn(`LeTexto SMS failed for ${phone}:`, error.message);
      results.push({ phone, status: 'Failed', error: error.message });
    }

    if (i < formattedPhones.length - 1) {
      await new Promise(r => setTimeout(r, 1000 / LETEXTO_MAX_TPS));
    }
  }

  const failed = results.filter(r => r.status !== 'Success');
  if (failed.length > 0 && failed.length === results.length) {
    throw new Error(`LeTexto : tous les envois ont échoué (${failed[0].error})`);
  }

  return { Recipients: results };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cfg = await loadSMSConfig();

  try {
    const { recipients, message, soulName, soulNickname, scheduleTime }: SendSMSRequest =
      await req.json();

    if (!message?.trim()) throw new Error('Le message ne peut pas être vide');

    const recipientList   = Array.isArray(recipients) ? recipients : [recipients];
    const formattedPhones = recipientList.map(p => validateAndFormatPhone(p));

    const finalMessage = soulName
      ? personalizeMessage(message, soulName, soulNickname)
      : message;

    if (finalMessage.length > 160) throw new Error('Le message ne doit pas dépasser 160 caractères');

    const result = cfg.provider === 'orange'
      ? await sendViaOrange(cfg.orange, formattedPhones, finalMessage)
      : cfg.provider === 'letexto'
      ? await sendViaLeTexto(cfg.letexto, formattedPhones, finalMessage)
      : await sendViaAfricasTalking(cfg.africastalking, formattedPhones, finalMessage, scheduleTime);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-sms:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erreur lors de l'envoi du SMS" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
