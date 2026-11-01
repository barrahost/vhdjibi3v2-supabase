import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

/** Chemin de retour après l'autorisation Google (à déclarer dans Google Cloud, avec le domaine). */
export const YOUTUBE_CALLBACK_PATH = '/youtube-callback';
const STATE_KEY = 'youtube-oauth-state';
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly'];

export interface YoutubeStatus {
  configured: boolean;
  clientId: string | null;
  connected: boolean;
  channelTitle: string | null;
  channelId: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  sync?: { ok: boolean; skipped?: boolean; error?: string; lives?: number; updated?: number };
}

export interface YoutubeLive {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  views: number;
  liveViews: number | null;
  replayViews: number | null;
  minutesWatched: number | null;
  avgViewDurationSec: number | null;
  peakConcurrent: number | null;
  avgConcurrent: number | null;
  likes: number | null;
  comments: number | null;
  subscribersGained: number | null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('youtube-stats', { body: { churchId: getChurchId(), ...body } });
  if (error) {
    // Message renvoyé par la fonction, s'il y en a un
    let message = error.message;
    try {
      const details = await error.context?.json?.();
      if (details?.error) message = details.error;
    } catch {
      /* corps illisible */
    }
    throw new Error(message || 'Service YouTube indisponible');
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const getYoutubeStatus = () => call<YoutubeStatus>({ action: 'status' });
export const syncYoutube = (force = false) => call<YoutubeStatus>({ action: 'sync', force });
export const exchangeYoutubeCode = (code: string, redirectUri: string) => call<YoutubeStatus>({ action: 'exchange', code, redirectUri });

export const youtubeRedirectUri = () => `${window.location.origin}${YOUTUBE_CALLBACK_PATH}`;

/** Adresse de la page d'autorisation Google (compte de l'église). */
export function youtubeAuthUrl(clientId: string): string {
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    /* navigation privée */
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: youtubeRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Vérifie que le retour de Google correspond bien à la demande faite depuis ce navigateur. */
export function checkYoutubeState(state: string | null): boolean {
  try {
    return !!state && state === sessionStorage.getItem(STATE_KEY);
  } catch {
    return false;
  }
}

export function clearYoutubeState() {
  try {
    sessionStorage.removeItem(STATE_KEY);
  } catch {
    /* ignoré */
  }
}

// Un code Google ne sert qu'une fois : si la page est affichée deux fois, on réutilise le même échange
const exchanges = new Map<string, Promise<YoutubeStatus>>();
export function exchangeYoutubeCodeOnce(code: string, redirectUri: string): Promise<YoutubeStatus> {
  if (!exchanges.has(code)) exchanges.set(code, exchangeYoutubeCode(code, redirectUri));
  return exchanges.get(code)!;
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export async function listYoutubeLives(): Promise<YoutubeLive[]> {
  const { data, error } = await supabase
    .from('youtube_live_stats')
    .select('*')
    .eq('church_id', getChurchId())
    .order('started_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? [])
    .filter((r: any) => r.started_at)
    .map((r: any) => ({
      videoId: r.video_id,
      title: r.title || '',
      thumbnailUrl: r.thumbnail_url,
      startedAt: new Date(r.started_at),
      endedAt: r.ended_at ? new Date(r.ended_at) : null,
      durationSeconds: num(r.duration_seconds),
      views: Number(r.views ?? 0),
      liveViews: num(r.live_views),
      replayViews: num(r.replay_views),
      minutesWatched: num(r.minutes_watched),
      avgViewDurationSec: num(r.avg_view_duration_sec),
      peakConcurrent: num(r.peak_concurrent),
      avgConcurrent: num(r.avg_concurrent),
      likes: num(r.likes),
      comments: num(r.comments),
      subscribersGained: num(r.subscribers_gained),
    }))
    .sort((a: YoutubeLive, b: YoutubeLive) => b.startedAt.getTime() - a.startedAt.getTime());
}
