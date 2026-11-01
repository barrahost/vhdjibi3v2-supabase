// Statistiques des directs YouTube des cultes.
//
// Secrets a definir dans Supabase (Edge Functions > Secrets) :
//   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET  (identifiant OAuth « Application Web » de Google Cloud)
//
// Actions (POST, corps JSON) :
//   { action: 'status',   churchId }                      -> etat de la connexion (jamais le jeton)
//   { action: 'exchange', churchId, code, redirectUri }   -> enregistre l'autorisation Google, puis synchronise
//   { action: 'sync',     churchId, force? }              -> synchronise (au plus une fois toutes les 10 min)
//   { action: 'sync-all' }                                -> synchronise toutes les eglises connectees (pg_cron)
//
// Le jeton (refresh token) reste dans youtube_connection, table sans politique RLS : seule cette fonction le lit.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

/** Premiere synchronisation : directs des 400 derniers jours. */
const LOOKBACK_DAYS = 400;
/** Les chiffres YouTube Analytics se stabilisent en quelques jours : on recalcule les directs recents. */
const REFRESH_DAYS = 35;
const MIN_SYNC_INTERVAL_MS = 10 * 60 * 1000;
/** Bouton « Actualiser » : au plus une synchronisation toutes les 2 minutes. */
const MIN_FORCED_INTERVAL_MS = 2 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

class GoogleError extends Error {}

async function google(url: string, accessToken: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new GoogleError(body?.error?.message || `Google ${res.status}`);
  return body;
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = body?.error === 'invalid_grant' ? "autorisation Google expiree ou retiree : reconnectez la chaine" : body?.error_description || body?.error;
    throw new GoogleError(reason || `Google ${res.status}`);
  }
  return body as { access_token: string; refresh_token?: string };
}

const accessTokenFor = async (refreshToken: string) =>
  (await tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' })).access_token;

async function myChannel(accessToken: string) {
  const body = await google('https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true', accessToken);
  const channel = body.items?.[0];
  if (!channel) throw new GoogleError("Ce compte Google n'a pas de chaine YouTube");
  return {
    id: channel.id as string,
    title: channel.snippet?.title as string,
    uploads: channel.contentDetails?.relatedPlaylists?.uploads as string,
  };
}

/** Lignes d'un rapport YouTube Analytics, en objets { nomColonne: valeur }. */
function rows(report: any): Record<string, any>[] {
  const headers: string[] = (report.columnHeaders ?? []).map((h: any) => h.name);
  return (report.rows ?? []).map((r: any[]) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Duree ISO 8601 (PT1H23M4S) en secondes. */
function isoDuration(value?: string): number | null {
  const m = value?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + +(m[4] ?? 0);
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

async function analyticsFor(accessToken: string, video: any) {
  const base = 'https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE';
  const range = `&startDate=${day(new Date(video.liveStreamingDetails.actualStartTime))}&endDate=${day(new Date())}`;
  const filter = `&filters=video==${video.id}`;
  const out: Record<string, number | null> = {};

  const totals = rows(await google(`${base}${range}${filter}&metrics=views,estimatedMinutesWatched,averageViewDuration,likes,comments,subscribersGained`, accessToken))[0];
  if (totals) {
    out.views = totals.views;
    out.minutes_watched = totals.estimatedMinutesWatched;
    out.avg_view_duration_sec = totals.averageViewDuration;
    out.likes = totals.likes;
    out.comments = totals.comments;
    out.subscribers_gained = totals.subscribersGained;
  }

  // En direct / en rediffusion
  try {
    const split = rows(await google(`${base}${range}${filter}&dimensions=liveOrOnDemand&metrics=views,estimatedMinutesWatched`, accessToken));
    if (split.length) {
      const live = split.find((r) => r.liveOrOnDemand === 'LIVE');
      const replay = split.find((r) => r.liveOrOnDemand === 'ON_DEMAND');
      out.live_views = live?.views ?? 0;
      out.live_minutes_watched = live?.estimatedMinutesWatched ?? 0;
      out.replay_views = replay?.views ?? 0;
    }
  } catch (e) {
    console.warn('liveOrOnDemand', video.id, (e as Error).message);
  }

  // Spectateurs simultanes (minute par minute pendant le direct)
  try {
    const perMinute = rows(
      await google(`${base}${range}${filter}&dimensions=livestreamPosition&metrics=averageConcurrentViewers,peakConcurrentViewers&sort=livestreamPosition`, accessToken),
    );
    if (perMinute.length) {
      out.peak_concurrent = Math.max(...perMinute.map((r) => Number(r.peakConcurrentViewers) || 0));
      out.avg_concurrent = Math.round((perMinute.reduce((n, r) => n + (Number(r.averageConcurrentViewers) || 0), 0) / perMinute.length) * 10) / 10;
    }
  } catch (e) {
    console.warn('livestreamPosition', video.id, (e as Error).message);
  }
  return out;
}

async function syncChurch(connection: { church_id: string; refresh_token: string; channel_id: string }) {
  const churchId = connection.church_id;
  try {
    const accessToken = await accessTokenFor(connection.refresh_token);
    const channel = await myChannel(accessToken);

    const { data: known } = await db.from('youtube_live_stats').select('video_id, started_at').eq('church_id', churchId);
    const knownIds = new Set((known ?? []).map((k: any) => k.video_id));
    const cutoff = Date.now() - LOOKBACK_DAYS * 86_400_000;

    // Videos de la chaine, des plus recentes aux plus anciennes
    const videoIds: string[] = [];
    let pageToken = '';
    for (let page = 0; page < 20; page++) {
      const body = await google(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${channel.uploads}${pageToken ? `&pageToken=${pageToken}` : ''}`,
        accessToken,
      );
      let older = false;
      for (const item of body.items ?? []) {
        const published = Date.parse(item.contentDetails?.videoPublishedAt ?? '');
        if (published && published < cutoff) older = true;
        else videoIds.push(item.contentDetails.videoId);
      }
      pageToken = body.nextPageToken ?? '';
      if (older || !pageToken) break;
    }

    // Details : ne garder que les directs termines
    const videos: any[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const body = await google(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,contentDetails,statistics&id=${videoIds.slice(i, i + 50).join(',')}`,
        accessToken,
      );
      videos.push(...(body.items ?? []).filter((v: any) => v.liveStreamingDetails?.actualStartTime && v.liveStreamingDetails?.actualEndTime));
    }

    const refreshFrom = Date.now() - REFRESH_DAYS * 86_400_000;
    const toCompute = videos.filter((v) => !knownIds.has(v.id) || Date.parse(v.liveStreamingDetails.actualStartTime) >= refreshFrom);

    const records = await inBatches(toCompute, 4, async (v) => {
      const analytics = await analyticsFor(accessToken, v).catch((e) => {
        console.warn('analytics', v.id, e.message);
        return {} as Record<string, number | null>;
      });
      const start = v.liveStreamingDetails.actualStartTime;
      const end = v.liveStreamingDetails.actualEndTime;
      return {
        church_id: churchId,
        video_id: v.id,
        title: v.snippet?.title ?? '',
        thumbnail_url: v.snippet?.thumbnails?.medium?.url ?? v.snippet?.thumbnails?.default?.url ?? null,
        scheduled_at: v.liveStreamingDetails.scheduledStartTime ?? null,
        started_at: start,
        ended_at: end,
        duration_seconds: isoDuration(v.contentDetails?.duration) ?? Math.round((Date.parse(end) - Date.parse(start)) / 1000),
        // Les chiffres Analytics arrivent avec 1 a 3 jours de retard : en attendant, compteurs publics de la video
        views: analytics.views ?? Number(v.statistics?.viewCount ?? 0),
        likes: analytics.likes ?? Number(v.statistics?.likeCount ?? 0),
        comments: analytics.comments ?? Number(v.statistics?.commentCount ?? 0),
        live_views: analytics.live_views ?? null,
        replay_views: analytics.replay_views ?? null,
        minutes_watched: analytics.minutes_watched ?? null,
        live_minutes_watched: analytics.live_minutes_watched ?? null,
        avg_view_duration_sec: analytics.avg_view_duration_sec ?? null,
        peak_concurrent: analytics.peak_concurrent ?? null,
        avg_concurrent: analytics.avg_concurrent ?? null,
        subscribers_gained: analytics.subscribers_gained ?? null,
        synced_at: new Date().toISOString(),
      };
    });

    if (records.length) {
      const { error } = await db.from('youtube_live_stats').upsert(records, { onConflict: 'church_id,video_id' });
      if (error) throw error;
    }
    await db
      .from('youtube_connection')
      .update({ last_sync_at: new Date().toISOString(), last_error: null, channel_title: channel.title })
      .eq('church_id', churchId);
    return { ok: true, lives: videos.length, updated: records.length };
  } catch (e) {
    const message = (e as Error).message || String(e);
    console.error('sync', churchId, message);
    await db.from('youtube_connection').update({ last_sync_at: new Date().toISOString(), last_error: message }).eq('church_id', churchId);
    return { ok: false, error: message };
  }
}

async function status(churchId: string) {
  const { data } = await db
    .from('youtube_connection')
    .select('channel_id, channel_title, connected_at, last_sync_at, last_error')
    .eq('church_id', churchId)
    .maybeSingle();
  return {
    configured: !!(CLIENT_ID && CLIENT_SECRET),
    clientId: CLIENT_ID || null,
    connected: !!data,
    channelTitle: data?.channel_title ?? null,
    channelId: data?.channel_id ?? null,
    connectedAt: data?.connected_at ?? null,
    lastSyncAt: data?.last_sync_at ?? null,
    lastError: data?.last_error ?? null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const churchId = String(body.churchId || 'bergerie');

    if (action === 'status') return json(await status(churchId));

    if (!CLIENT_ID || !CLIENT_SECRET) return json({ error: 'YOUTUBE_CLIENT_ID et YOUTUBE_CLIENT_SECRET ne sont pas definis dans Supabase.' }, 400);

    if (action === 'exchange') {
      if (!body.code || !body.redirectUri) return json({ error: 'code et redirectUri requis' }, 400);
      const tokens = await tokenRequest({ code: body.code, redirect_uri: body.redirectUri, grant_type: 'authorization_code' });
      if (!tokens.refresh_token) return json({ error: "Google n'a pas fourni d'autorisation durable. Retirez l'acces de Bergerie dans votre compte Google puis recommencez." }, 400);
      const channel = await myChannel(tokens.access_token);
      // Une chaine deja reliee ne peut etre remplacee que par elle-meme (pour changer de chaine : supprimer la ligne en SQL)
      const { data: existing } = await db.from('youtube_connection').select('channel_id').eq('church_id', churchId).maybeSingle();
      if (existing && existing.channel_id !== channel.id) {
        return json({ error: `Une autre chaine est deja reliee. Connectez-vous avec le compte de cette chaine.` }, 409);
      }
      const { error } = await db.from('youtube_connection').upsert({
        church_id: churchId,
        channel_id: channel.id,
        channel_title: channel.title,
        refresh_token: tokens.refresh_token,
        connected_at: new Date().toISOString(),
        last_error: null,
      });
      if (error) throw error;
      const sync = await syncChurch({ church_id: churchId, refresh_token: tokens.refresh_token, channel_id: channel.id });
      return json({ ...(await status(churchId)), sync });
    }

    if (action === 'sync') {
      const { data: connection } = await db.from('youtube_connection').select('*').eq('church_id', churchId).maybeSingle();
      if (!connection) return json({ error: 'Aucune chaine YouTube reliee' }, 404);
      const elapsed = connection.last_sync_at ? Date.now() - Date.parse(connection.last_sync_at) : Infinity;
      if (elapsed < (body.force ? MIN_FORCED_INTERVAL_MS : MIN_SYNC_INTERVAL_MS)) return json({ ...(await status(churchId)), sync: { ok: true, skipped: true } });
      const sync = await syncChurch(connection);
      return json({ ...(await status(churchId)), sync });
    }

    if (action === 'sync-all') {
      const { data: connections } = await db.from('youtube_connection').select('*');
      const results = [];
      for (const c of connections ?? []) results.push({ churchId: c.church_id, ...(await syncChurch(c)) });
      return json({ results });
    }

    return json({ error: 'action inconnue' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || String(e) }, e instanceof GoogleError ? 400 : 500);
  }
});
