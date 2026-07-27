-- ============================================================
-- Culte events (decouple les rapports de departement du rapport
-- "Gestion des Cultes" pour supprimer la dependance totale)
-- ============================================================

CREATE TABLE IF NOT EXISTS culte_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id TEXT NOT NULL,
  service_date DATE NOT NULL,
  meeting_type_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (church_id, service_date, meeting_type_name)
);

ALTER TABLE culte_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_culte_events ON culte_events FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS culte_recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id TEXT NOT NULL,
  meeting_type_name TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE culte_recurring_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_culte_recurring_schedules ON culte_recurring_schedules FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE culte_reports ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES culte_events(id);
CREATE INDEX IF NOT EXISTS idx_culte_reports_event ON culte_reports (event_id);

-- Programme recurrent connu (Mercredi 19h / Dimanche 7h30 / Dimanche 10h)
INSERT INTO culte_recurring_schedules (church_id, meeting_type_name, day_of_week) VALUES
  ('bergerie', 'Rendez-Vous des Champions', 3),
  ('bergerie', '1er Culte de Célébration & Contemplation', 0),
  ('bergerie', '2e Culte de Célébration & Contemplation', 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Migration des rapports existants vers le nouveau modele
-- ============================================================

-- 1. Un culte_event par rapport "worship" existant (date + type de rencontre)
INSERT INTO culte_events (church_id, service_date, meeting_type_name)
SELECT DISTINCT church_id, service_date, coalesce(meeting_type_name, 'Culte')
FROM culte_reports
WHERE report_type = 'worship'
ON CONFLICT (church_id, service_date, meeting_type_name) DO NOTHING;

-- 2. Rattache chaque rapport "worship" a son evenement
UPDATE culte_reports r
SET event_id = e.id
FROM culte_events e
WHERE r.report_type = 'worship'
  AND r.church_id = e.church_id
  AND r.service_date = e.service_date
  AND coalesce(r.meeting_type_name, 'Culte') = e.meeting_type_name
  AND r.event_id IS NULL;

-- 3. Rattache chaque rapport dependant a l'evenement du rapport "worship" qu'il referencait
UPDATE culte_reports r
SET event_id = w.event_id
FROM culte_reports w
WHERE r.worship_report_id = w.id
  AND w.event_id IS NOT NULL
  AND r.event_id IS NULL;
