export interface Env {
  BERGERIE_R2: R2Bucket;
  AUTH_SECRET: string;
}

const R2_PUBLIC_URL = 'https://pub-7b4d7eb30b5447a68ce0dc7d83ca47c5.r2.dev';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-file-path',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const auth = req.headers.get('Authorization');
    if (!auth || auth !== `Bearer ${env.AUTH_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const filePath = req.headers.get('x-file-path');
    if (!filePath) {
      return new Response(JSON.stringify({ error: 'x-file-path header required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const contentType = req.headers.get('content-type') || 'application/octet-stream';
      await env.BERGERIE_R2.put(filePath, req.body, {
        httpMetadata: { contentType },
      });
      return new Response(JSON.stringify({ url: `${R2_PUBLIC_URL}/${filePath}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      await env.BERGERIE_R2.delete(filePath);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
