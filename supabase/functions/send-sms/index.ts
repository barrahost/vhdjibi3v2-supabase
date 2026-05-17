import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY    = 2000;
const MAX_BACKOFF    = 30000;
const AT_API_URL     = 'https://api.africastalking.com/version1/messaging';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSConfig {
  apiKey: string;
  username: string;
  senderId: string;
}

interface SendSMSRequest {
  recipients: string | string[];
  message: string;
  soulName?: string;
  soulNickname?: string;
  scheduleTime?: string;
}

// Charge la config SMS depuis app_settings, avec fallback sur les env vars
async function loadSMSConfig(): Promise<SMSConfig> {
  const fallback: SMSConfig = {
    apiKey:   Deno.env.get('AT_API_KEY') || '',
    username: Deno.env.get('AT_USERNAME') || 'vhdjibi3',
    senderId: Deno.env.get('AT_SENDER_ID') || '',
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
      apiKey:   cfg.apiKey   || fallback.apiKey,
      username: cfg.username || fallback.username,
      senderId: cfg.senderId !== undefined ? cfg.senderId : fallback.senderId,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cfg = await loadSMSConfig();

  try {
    if (!cfg.apiKey) throw new Error("Configuration Africa's Talking manquante (apiKey)");

    const { recipients, message, soulName, soulNickname, scheduleTime }: SendSMSRequest =
      await req.json();

    if (!message?.trim()) throw new Error('Le message ne peut pas être vide');

    const recipientList   = Array.isArray(recipients) ? recipients : [recipients];
    const formattedPhones = recipientList.map(p => validateAndFormatPhone(p));

    const finalMessage = soulName
      ? personalizeMessage(message, soulName, soulNickname)
      : message;

    if (finalMessage.length > 160) throw new Error('Le message ne doit pas dépasser 160 caractères');

    const params = new URLSearchParams({
      username: cfg.username,
      to:       formattedPhones.join(','),
      message:  finalMessage,
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

    const result     = await response.json();
    const recipients_result = result?.SMSMessageData?.Recipients ?? [];
    const failed     = recipients_result.filter((r: any) => r.status !== 'Success');
    if (failed.length > 0) console.warn('Some recipients failed:', failed);

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
