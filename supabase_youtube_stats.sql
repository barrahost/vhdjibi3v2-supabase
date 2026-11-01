-- Statistiques des directs YouTube des cultes
-- A executer une fois dans le SQL Editor de Supabase, APRES avoir deploye la fonction youtube-stats.
-- Le jeton Google (refresh token) n'est lisible que par la fonction (cle service) : aucune politique RLS sur youtube_connection.

-- 1. Connexion a la chaine YouTube de l'eglise (une par eglise)
CREATE TABLE IF NOT EXISTS youtube_connection (
  church_id      TEXT PRIMARY KEY,
  channel_id     TEXT NOT NULL,
  channel_title  TEXT,
  refresh_token  TEXT NOT NULL,
  connected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at   TIMESTAMPTZ,
  last_error     TEXT
);
ALTER TABLE youtube_connection ENABLE ROW LEVEL SECURITY;
-- Pas de politique : ni l'application ni le public ne peuvent lire le jeton.
DROP POLICY IF EXISTS youtube_connection_all ON youtube_connection;

-- 2. Chiffres de chaque direct (remplis par la fonction, lus par l'application)
CREATE TABLE IF NOT EXISTS youtube_live_stats (
  church_id              TEXT NOT NULL,
  video_id               TEXT NOT NULL,
  title                  TEXT,
  thumbnail_url          TEXT,
  scheduled_at           TIMESTAMPTZ,
  started_at             TIMESTAMPTZ,
  ended_at               TIMESTAMPTZ,
  duration_seconds       INT,
  views                  INT,
  live_views             INT,
  replay_views           INT,
  minutes_watched        NUMERIC,
  live_minutes_watched   NUMERIC,
  avg_view_duration_sec  INT,
  peak_concurrent        INT,
  avg_concurrent         NUMERIC,
  likes                  INT,
  comments               INT,
  subscribers_gained     INT,
  synced_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (church_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_youtube_live_stats_started ON youtube_live_stats (church_id, started_at DESC);
ALTER TABLE youtube_live_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS youtube_live_stats_read ON youtube_live_stats;
CREATE POLICY youtube_live_stats_read ON youtube_live_stats FOR SELECT USING (true);
-- Ecriture : uniquement la fonction (cle service, qui ignore RLS).

-- 3. Synchronisation automatique chaque jour a 3 h (heure d'Abidjan = UTC), et le dimanche a 15 h apres les cultes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
SELECT cron.unschedule('youtube-stats-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'youtube-stats-daily');
SELECT cron.unschedule('youtube-stats-sunday') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'youtube-stats-sunday');
SELECT cron.schedule(
  'youtube-stats-daily',
  '7 3 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://mowsaahfkkygveqhkvup.supabase.co/functions/v1/youtube-stats',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := '{"action":"sync-all"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
SELECT cron.schedule(
  'youtube-stats-sunday',
  '7 15 * * 0',
  $$
  SELECT net.http_post(
    url     := 'https://mowsaahfkkygveqhkvup.supabase.co/functions/v1/youtube-stats',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := '{"action":"sync-all"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Verification
SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'youtube-stats%';
