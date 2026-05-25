import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { slug, action = "create" } = await req.json();
    if (!slug) {
      return new Response(
        JSON.stringify({ error: "slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const CF_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN")!;
    const CF_ACCOUNT = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!;
    const CF_ZONE = Deno.env.get("CLOUDFLARE_ZONE_ID")!;
    const CF_PROJECT = Deno.env.get("CLOUDFLARE_PAGES_PROJECT") || "vhdjibi3v2-supabase";
    const BASE_DOMAIN = Deno.env.get("BASE_DOMAIN") || "evdh.org";
    const cfH = { "Authorization": `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" };
    const subdomain = `${slug}.${BASE_DOMAIN}`;

    // --------------------------------------------------------
    // DELETE: supprime le DNS + domaine Pages
    // --------------------------------------------------------
    if (action === "delete") {
      // 1. Trouver l'enregistrement DNS CNAME
      const listRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records?name=${subdomain}&type=CNAME`,
        { headers: cfH }
      );
      const listData = await listRes.json();

      let dnsResult = "not_found";
      if (listData.success && listData.result?.length > 0) {
        const recordId = listData.result[0].id;
        const delRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records/${recordId}`,
          { method: "DELETE", headers: cfH }
        );
        const delData = await delRes.json();
        dnsResult = delData.success ? "deleted" : "error";
      }

      // 2. Supprimer le domaine personnalise dans Cloudflare Pages
      const pagesDelRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/pages/projects/${CF_PROJECT}/domains/${subdomain}`,
        { method: "DELETE", headers: cfH }
      );
      const pagesDelData = await pagesDelRes.json();
      const pagesResult = pagesDelData.success ? "deleted" : "not_found";

      return new Response(
        JSON.stringify({ success: true, subdomain, dns: dnsResult, pages: pagesResult }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --------------------------------------------------------
    // CREATE (default): cree DNS + domaine Pages
    // --------------------------------------------------------
    const dnsRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records`,
      {
        method: "POST",
        headers: cfH,
        body: JSON.stringify({
          type: "CNAME",
          name: slug,
          content: `${CF_PROJECT}.pages.dev`,
          ttl: 1,
          proxied: true,
        }),
      }
    );
    const dnsData = await dnsRes.json();
    if (!dnsData.success && !dnsData.errors?.some((e: any) => e.code === 81057)) {
      return new Response(
        JSON.stringify({ error: "DNS failed", details: dnsData.errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pagesRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/pages/projects/${CF_PROJECT}/domains`,
      {
        method: "POST",
        headers: cfH,
        body: JSON.stringify({ name: subdomain }),
      }
    );
    const pagesData = await pagesRes.json();
    if (!pagesData.success && !pagesData.errors?.some((e: any) => e.code === 8000007)) {
      return new Response(
        JSON.stringify({ error: "Pages domain failed", details: pagesData.errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, subdomain }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});