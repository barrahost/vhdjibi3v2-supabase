-- Journal des rappels SMS aux chefs de famille (anti-relance + historique).
-- reminder_type : 'unassigned' (ames sans berger), 'escalation' (bergers en
-- retard durable), 'recap' (nouvelles ames de la semaine).
CREATE TABLE IF NOT EXISTS family_reminder_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     TEXT NOT NULL,
  leader_id     TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('unassigned', 'escalation', 'recap')),
  item_count    INT  NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE family_reminder_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_reminder_log_all ON family_reminder_log;
CREATE POLICY family_reminder_log_all ON family_reminder_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_family_reminder_log_recent ON family_reminder_log (church_id, leader_id, sent_at DESC);
