import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AT_API_KEY    = Deno.env.get('AT_API_KEY');
const AT_USERNAME   = Deno.env.get('AT_USERNAME') || 'vhdjibi3';
const AT_SENDER_ID  = Deno.env.get('AT_SENDER_ID') || '';   // optionnel (shortcode/alphanumeric)
const AT_API_URL    = 'https://api.africastalking.com/version1/messaging';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY    = 2000;
const MAX_BACKOFF    = 30000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  recipients: string | string[];
  message: string;
  soulName?: string;
  soulNickname?: string;
  scheduleTime?: string;
}

// Validate phone number and format to E.164 (+225XXXXXXXXXX)
function validateAndFormatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.startsWith('225')) {
    if (cleanPhone.length !== 13) {
      throw new Error(`Numéro invalide : ${phone}. Format attendu : 225XXXXXXXXXX (13 chiffres).`);
    }
    return `+${cleanPhone}`;
  }

  if (cleanPhone.length !== 10) {
    throw new Error(`Numéro invalide : ${phone}. Il doit contenir 10 chiffres ou être précédé de l'indicatif 225.`);
  }

  return `+225${cleanPhone}`;
}

// Replace [nom] / [surnom] placeholders
function personalizeMessage(message: string, name: string, nickname?: string): string {
  return message
    .replace(/\[nom\]/g, name)
    .replace(/\[surnom\]/g, nickname || name.split(' ')[0]);
}

// Exponential backoff
function getBackoffTime(attempt: number): number {
  return Math.min(RETRY_DELAY * Math.pow(2, attempt - 1), MAX_BACKOFF) + Math.random() * 1000;
}

// Fetch with retry
async function fetchWithRetry(url: string, options: RequestInit, attempt = 1): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000 * Math.pow(1.5, attempt - 1));

    const response = await fetch(url, { ...options, signal: controller.signal });
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
      const delay = getBackoffTime(attempt);
      console.log(`Retry ${attempt}/${RETRY_ATTEMPTS} in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!AT_API_KEY) throw new Error('Configuration Africa\'s Talking manquante (AT_API_KEY)');

    const { recipients, message, soulName, soulNickname, scheduleTime }: SendSMSRequest =
      await req.json();

    if (!message?.trim()) throw new Error('Le message ne peut pas être vide');

    // Format phones
    const recipientList  = Array.isArray(recipients) ? recipients : [recipients];
    const formattedPhones = recipientList.map(p => validateAndFormatPhone(p));

    // Personalize
    const finalMessage = soulName
      ? personalizeMessage(message, soulName, soulNickname)
      : message;

    if (finalMessage.length > 160) {
      throw new Error('Le message ne doit pas dépasser 160 caractères');
    }

    // Build Africa's Talking request (application/x-www-form-urlencoded)
    const params = new URLSearchParams({
      username: AT_USERNAME,
      to:       formattedPhones.join(','),
      message:  finalMessage,
    });
    if (AT_SENDER_ID) params.append('from', AT_SENDER_ID);
    if (scheduleTime) params.append('scheduledDelivery', new Date(scheduleTime).toISOString());

    const response = await fetchWithRetry(AT_API_URL, {
      method: 'POST',
      headers: {
        'apiKey':       AT_API_KEY,
        'Accept':       'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();

    // AT returns { SMSMessageData: { Recipients: [...] } }
    const recipients_result = result?.SMSMessageData?.Recipients ?? [];
    const failed = recipients_result.filter((r: any) => r.status !== 'Success');

    if (failed.length > 0) {
      console.warn('Some recipients failed:', failed);
    }

    console.log('SMS sent via Africa\'s Talking:', {
      to:     formattedPhones,
      length: finalMessage.length,
      result: result?.SMSMessageData?.Message,
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-sms function:', error);

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erreur lors de l\'envoi du SMS' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
