-- ============================================================
-- SMS demandes de congé — journal de la relance aux pasteurs
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_leave_requests.sql
-- ============================================================
-- La relance hebdo (défaut : dimanche 8h) est envoyée par l'edge function
-- send-shepherd-reminders, déjà appelée toutes les heures par le pg_cron
-- 'shepherd-sms-reminders' (voir supabase_shepherd_sms_reminders.sql) :
-- aucun nouveau cron n'est nécessaire. Ce journal sert d'anti-doublon
-- (au plus une relance par pasteur et par jour) et d'historique.
--
-- Les SMS immédiats (soumission -> pasteur, décision -> demandeur) passent
-- par l'edge function notify-leave-request et n'utilisent pas ce journal.
-- L'ensemble s'active dans Paramètres -> SMS -> « SMS demandes de congé ».

CREATE TABLE IF NOT EXISTS leave_reminder_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     TEXT NOT NULL,
  pasteur_id    TEXT NOT NULL,
  pending_count INT  NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE leave_reminder_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leave_reminder_log_all ON leave_reminder_log;
CREATE POLICY leave_reminder_log_all ON leave_reminder_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_leave_reminder_log_recent ON leave_reminder_log (church_id, pasteur_id, sent_at DESC);
