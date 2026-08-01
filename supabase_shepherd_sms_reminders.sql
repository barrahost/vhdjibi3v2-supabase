-- Rappels SMS automatiques aux bergers (ames sans interaction depuis X jours)
-- Journal des envois : sert a l'anti-relance (cooldown) et a l'historique.
CREATE TABLE IF NOT EXISTS shepherd_reminder_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  shepherd_id TEXT NOT NULL,
  souls_count INT  NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE shepherd_reminder_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shepherd_reminder_log_all ON shepherd_reminder_log;
CREATE POLICY shepherd_reminder_log_all ON shepherd_reminder_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_shepherd_reminder_log_recent ON shepherd_reminder_log (church_id, shepherd_id, sent_at DESC);

-- Planification : toutes les heures, la fonction decide elle-meme (config app_settings)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('shepherd-sms-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'shepherd-sms-reminders');
SELECT cron.schedule(
  'shepherd-sms-reminders',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://mowsaahfkkygveqhkvup.supabase.co/functions/v1/send-shepherd-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Cron-Secret', '<CRON_SECRET — defini dans Supabase, jamais committe>'),
    body    := '{}'::jsonb
  );
  $$
);
