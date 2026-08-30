-- ============================================================
-- Cultes retirés de la liste d'un département (trop anciens, pas de rapport à faire)
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_culte_events.sql
-- ============================================================
-- Un "retrait" est propre à un département (report_type) : il fait disparaître
-- l'événement de SA liste "Culte du jour" uniquement -- l'événement lui-même et
-- les rapports déjà soumis par d'autres départements ne sont jamais touchés.

CREATE TABLE IF NOT EXISTS culte_event_dismissals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    TEXT NOT NULL,
  event_id     UUID NOT NULL REFERENCES culte_events(id) ON DELETE CASCADE,
  report_type  TEXT NOT NULL,
  dismissed_by TEXT,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, report_type)
);

ALTER TABLE culte_event_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_culte_event_dismissals ON culte_event_dismissals FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_culte_event_dismissals_lookup ON culte_event_dismissals (church_id, report_type);
