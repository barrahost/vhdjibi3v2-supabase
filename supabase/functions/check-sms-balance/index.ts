import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AT_API_KEY   = Deno.env.get('AT_API_KEY');
const AT_USERNAME  = Deno.env.get('AT_USERNAME') || 'vhdjibi3';
// Coût par SMS en XOF pour la Côte d'Ivoire (~0.04 USD × 600 XOF/USD ≈ 24 XOF)
// Configurable via secret AT_SMS_COST_XOF
const SMS_COST_XOF = parseFloat(Deno.env.get('AT_SMS_COST_XOF') || '24');

const AT_USER_URL  = `https://api.africastalking.com/version1/user?username=${AT_USERNAME}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse "XOF 43.2338" → 43.2338
function parseBalance(balanceStr: string): number {
  const match = balanceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!AT_API_KEY) throw new Error('Configuration Africa\'s Talking manquante (AT_API_KEY)');

    const response = await fetch(AT_USER_URL, {
      method: 'GET',
      headers: {
        'apiKey': AT_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erreur API Africa's Talking: ${response.status} ${text}`);
    }

    const data = await response.json();
    const balanceStr = data?.UserData?.balance ?? '0';
    const balance    = parseBalance(balanceStr);
    const smsCount   = Math.floor(balance / SMS_COST_XOF);

    console.log('Balance AT:', { balanceStr, balance, smsCount, smsCostXOF: SMS_COST_XOF });

    return new Response(
      JSON.stringify({
        credits:          balance,      // solde XOF (float)
        smsCount,                       // nombre de SMS estimé
        currency:         'XOF',
        smsCostXOF:       SMS_COST_XOF, // coût par SMS en XOF
        balanceRaw:       balanceStr,   // ex: "XOF 43.2338"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in check-sms-balance function:', error);

    return new Response(
      JSON.stringify({
        credits:    null,
        smsCount:   null,
        currency:   'XOF',
        smsCostXOF: SMS_COST_XOF,
        error:      error.message || 'Erreur lors de la récupération du solde',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
