import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSConfig {
  provider: string;
  apiKey: string;
  username: string;
  smsCostXOF: number;
}

// Charge la config SMS depuis app_settings, avec fallback sur les env vars
async function loadSMSConfig(): Promise<SMSConfig> {
  const fallback: SMSConfig = {
    provider:   Deno.env.get('SMS_PROVIDER') || 'africastalking',
    apiKey:     Deno.env.get('AT_API_KEY') || '',
    username:   Deno.env.get('AT_USERNAME') || 'vhdjibi3',
    smsCostXOF: parseFloat(Deno.env.get('AT_SMS_COST_XOF') || '24'),
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
      provider:   cfg.provider || fallback.provider,
      apiKey:     cfg.africastalking?.apiKey   ?? cfg.apiKey   ?? fallback.apiKey,
      username:   cfg.africastalking?.username ?? cfg.username ?? fallback.username,
      smsCostXOF: cfg.smsCostXOF || fallback.smsCostXOF,
    };
  } catch {
    return fallback;
  }
}

function parseBalance(balanceStr: string): number {
  const match = balanceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cfg = await loadSMSConfig();

  if (cfg.provider !== 'africastalking') {
    // Orange CI n'expose pas de solde consultable via API — à vérifier depuis la console développeur.
    return new Response(
      JSON.stringify({ credits: null, smsCount: null, currency: 'XOF', smsCostXOF: cfg.smsCostXOF, unsupported: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  try {
    if (!cfg.apiKey) throw new Error("Configuration Africa's Talking manquante (AT_API_KEY)");

    const AT_USER_URL = `https://api.africastalking.com/version1/user?username=${cfg.username}`;

    const response = await fetch(AT_USER_URL, {
      method: 'GET',
      headers: { 'apiKey': cfg.apiKey, 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erreur API Africa's Talking: ${response.status} ${text}`);
    }

    const data        = await response.json();
    const balanceStr  = data?.UserData?.balance ?? '0';
    const balance     = parseBalance(balanceStr);
    const smsCount    = Math.floor(balance / cfg.smsCostXOF);

    return new Response(
      JSON.stringify({ credits: balance, smsCount, currency: 'XOF', smsCostXOF: cfg.smsCostXOF, balanceRaw: balanceStr }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in check-sms-balance:', error);
    return new Response(
      JSON.stringify({ credits: null, smsCount: null, currency: 'XOF', smsCostXOF: cfg.smsCostXOF, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
