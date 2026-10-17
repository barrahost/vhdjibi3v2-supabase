import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CF_ACCOUNT_ID = 'c082969c724cd3bcda269a40664dea26';
const R2_BUCKET     = 'vhagc-academie-media';
const R2_PUBLIC_URL = 'https://pub-0b04f4639f4e41489b5c3a6cdc109f80.r2.dev';
const PRESIGN_TTL   = 300; // secondes

// --- SigV4 helpers (identiques a r2-storage, bucket different) ---

const enc = (s: string) => new TextEncoder().encode(s);
const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

const hmac = async (key: ArrayBuffer, data: string): Promise<ArrayBuffer> => {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc(data));
};

async function signingKey(secret: string, dateStamp: string): Promise<ArrayBuffer> {
  const kDate    = await hmac(enc('AWS4' + secret), dateStamp);
  const kRegion  = await hmac(kDate, 'auto');
  const kService = await hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

// --- Presigned PUT URL (upload direct depuis le navigateur, sans exposer les creds) ---
async function presignPut(filePath: string, contentType: string, token: string, secret: string): Promise<string> {
  const now             = new Date();
  const dateStamp       = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate         = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const host            = `${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm':     'AWS4-HMAC-SHA256',
    'X-Amz-Credential':    `${token}/${credentialScope}`,
    'X-Amz-Date':          amzDate,
    'X-Amz-Expires':       String(PRESIGN_TTL),
    'X-Amz-SignedHeaders': 'content-type;host',
  });

  const canonicalRequest = [
    'PUT',
    `/${R2_BUCKET}/${filePath}`,
    queryParams.toString(),
    `content-type:${contentType}\nhost:${host}\n`,
    'content-type;host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const crHash       = hex(await crypto.subtle.digest('SHA-256', enc(canonicalRequest)));
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, crHash].join('\n');
  const kSigning     = await signingKey(secret, dateStamp);
  const signature    = hex(await hmac(kSigning, stringToSign));

  queryParams.set('X-Amz-Signature', signature);

  return `https://${host}/${R2_BUCKET}/${filePath}?${queryParams.toString()}`;
}

// --- Liste des objets sous un prefixe (GET bucket ?list-type=2&prefix=...) ---
async function listObjects(prefix: string, token: string, secret: string): Promise<{ key: string; size: number }[]> {
  const now       = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate   = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const host      = `${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const bodyHash  = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // sha256('')

  const queryParams = new URLSearchParams({ 'list-type': '2', 'prefix': prefix, 'max-keys': '1000' });
  const canonicalQuery = [...queryParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const credentialScope  = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders    = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['GET', `/${R2_BUCKET}`, canonicalQuery, canonicalHeaders, signedHeaders, bodyHash].join('\n');
  const crHash           = hex(await crypto.subtle.digest('SHA-256', enc(canonicalRequest)));
  const stringToSign     = ['AWS4-HMAC-SHA256', amzDate, credentialScope, crHash].join('\n');
  const kSigning         = await signingKey(secret, dateStamp);
  const signature        = hex(await hmac(kSigning, stringToSign));
  const authorization    = `AWS4-HMAC-SHA256 Credential=${token}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(`https://${host}/${R2_BUCKET}?${canonicalQuery}`, {
    headers: { Authorization: authorization, 'x-amz-date': amzDate, 'x-amz-content-sha256': bodyHash },
  });
  const xml = await resp.text();
  if (!resp.ok) throw new Error(`R2 list failed: ${resp.status} ${xml.slice(0, 300)}`);

  const results: { key: string; size: number }[] = [];
  const contentsRe = /<Contents>([\s\S]*?)<\/Contents>/g;
  let m: RegExpExecArray | null;
  while ((m = contentsRe.exec(xml))) {
    const block = m[1];
    const keyMatch = /<Key>([\s\S]*?)<\/Key>/.exec(block);
    const sizeMatch = /<Size>([\s\S]*?)<\/Size>/.exec(block);
    if (keyMatch) {
      results.push({ key: decodeXml(keyMatch[1]), size: sizeMatch ? parseInt(sizeMatch[1], 10) : 0 });
    }
  }
  return results;
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// --- Main ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const R2_TOKEN  = Deno.env.get('ACADEMIE_R2_TOKEN');
  const R2_SECRET = Deno.env.get('ACADEMIE_R2_SECRET');
  if (!R2_TOKEN || !R2_SECRET) {
    return new Response(JSON.stringify({ error: 'R2 credentials not configured on server' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as { action: string; prefix?: string; filePath?: string; contentType?: string };
    const { action } = body;

    if (action === 'list') {
      const prefix = body.prefix ?? '';
      const objects = await listObjects(prefix, R2_TOKEN, R2_SECRET);
      const withUrls = objects.map(o => ({ ...o, url: `${R2_PUBLIC_URL}/${o.key}` }));
      return new Response(JSON.stringify({ objects: withUrls }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'presign') {
      if (!body.filePath) throw new Error('filePath is required');
      const contentType = body.contentType ?? 'application/octet-stream';
      const uploadUrl   = await presignPut(body.filePath, contentType, R2_TOKEN, R2_SECRET);
      const publicUrl   = `${R2_PUBLIC_URL}/${body.filePath}`;
      return new Response(JSON.stringify({ uploadUrl, publicUrl, r2Key: body.filePath }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err: any) {
    console.error('academie-media error:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
