-- Journal des rappels SMS aux evangelistes (anti-relance + historique).
-- reminder_type : 'relance' (contacts a relancer), 'attendus' (attendus au culte de demain).
CREATE TABLE IF NOT EXISTS evangelist_reminder_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     TEXT NOT NULL,
  evangelist_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('relance', 'attendus')),
  item_count    INT  NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE evangelist_reminder_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evangelist_reminder_log_all ON evangelist_reminder_log;
CREATE POLICY evangelist_reminder_log_all ON evangelist_reminder_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_evangelist_reminder_log_recent ON evangelist_reminder_log (church_id, evangelist_id, sent_at DESC);
