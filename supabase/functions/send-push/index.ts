import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendPushRequest {
  user_ids: string[];
  title: string;
  body: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@example.com';
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Clés VAPID manquantes (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)');
    }
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { user_ids, title, body, url }: SendPushRequest = await req.json();
    if (!user_ids?.length) throw new Error('user_ids est requis');
    if (!title?.trim() || !body?.trim()) throw new Error('title et body sont requis');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', user_ids);
    if (error) throw error;

    const payload = JSON.stringify({ title, body, url: url || '/' });

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];

    await Promise.all((subs ?? []).map(async (sub: any) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err: any) {
        failed++;
        // 404/410 = abonnement expiré ou révoqué côté navigateur : on le nettoie.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleIds.push(sub.id);
        } else {
          console.warn('Push failed for subscription', sub.id, err?.message || err);
        }
      }
    }));

    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, cleaned: staleIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-push:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erreur lors de l'envoi de la notification" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
