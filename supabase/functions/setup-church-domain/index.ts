import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CF_API_TOKEN   = Deno.env.get('CLOUDFLARE_API_TOKEN')!;
const CF_ACCOUNT_ID  = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
const CF_ZONE_ID     = Deno.env.get('CLOUDFLARE_ZONE_ID')!;
const CF_PAGES_PROJECT = Deno.env.get('CLOUDFLARE_PAGES_PROJECT')!; // vhdjibi3v2-supabase
const BASE_DOMAIN    = Deno.env.get('BASE_DOMAIN') || 'evdh.org';

const CF_HEADERS = {
  'Authorization': `Bearer ${CF_API_TOKEN}`,
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const { slug } = await req.json();
    if (!slug) return new Response(JSON.stringify({ error: 'slug requis' }), { status: 400 });

    const subdomain = `${slug}.${BASE_DOMAIN}`;
    const results: Record<string, unknown> = {};

    // ----------------------------------------------------------------
    // 1. Créer l'enregistrement DNS CNAME
    // ----------------------------------------------------------------
    const dnsRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`,
      {
        method: 'POST',
        headers: CF_HEADERS,
        body: JSON.stringify({
          type: 'CNAME',
          name: slug,                          // mhad3
          content: `${CF_PAGES_PROJECT}.pages.dev`,
          proxied: true,
          ttl: 1,                              // Auto
        }),
      }
    );
    const dnsJson = await dnsRes.json();
    results.dns = dnsJson.success
      ? { ok: true, id: dnsJson.result?.id }
      : { ok: false, errors: dnsJson.errors };

    // ----------------------------------------------------------------
    // 2. Ajouter le custom domain dans Cloudflare Pages
    // ----------------------------------------------------------------
    const pagesRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains`,
      {
        method: 'POST',
        headers: CF_HEADERS,
        body: JSON.stringify({ name: subdomain }),
      }
    );
    const pagesJson = await pagesRes.json();
    results.pages = pagesJson.success
      ? { ok: true }
      : { ok: false, errors: pagesJson.errors };

    const allOk = (results.dns as any).ok && (results.pages as any).ok;

    return new Response(
      JSON.stringify({ ok: allOk, subdomain, results }),
      {
        status: allOk ? 200 : 207,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
