-- ============================================================
-- Rapports de culte (fusion de vhdjibi3gestion dans Bergerie)
-- Exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS culte_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id           TEXT NOT NULL,
  report_type         TEXT NOT NULL CHECK (report_type IN
                        ('worship', 'adn', 'finance', 'sainte_cene', 'sono', 'academie')),
  department_id       TEXT,
  department_name     TEXT NOT NULL,
  worship_report_id   UUID REFERENCES culte_reports(id),
  service_date        DATE NOT NULL,
  meeting_type_id      UUID,
  meeting_type_name    TEXT,
  submitted_by         TEXT,
  submitted_by_name    TEXT NOT NULL,
  data                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes                TEXT,
  needs_notes          TEXT,
  legacy_firestore_id  TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (church_id, report_type, legacy_firestore_id)
);

CREATE INDEX IF NOT EXISTS idx_culte_reports_church_dept_date
  ON culte_reports (church_id, department_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_culte_reports_worship_link
  ON culte_reports (worship_report_id);

CREATE TABLE IF NOT EXISTS culte_report_meeting_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id           TEXT NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  legacy_firestore_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS culte_report_speakers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id           TEXT NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  legacy_firestore_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS culte_report_needs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id           TEXT NOT NULL,
  culte_report_id     UUID REFERENCES culte_reports(id) ON DELETE CASCADE,
  department_name     TEXT NOT NULL,
  description         TEXT NOT NULL,
  priority            TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  is_addressed        BOOLEAN NOT NULL DEFAULT false,
  addressed_by        TEXT,
  addressed_at        TIMESTAMPTZ,
  legacy_firestore_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_culte_report_needs_church
  ON culte_report_needs (church_id, is_addressed);

ALTER TABLE culte_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_report_meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_report_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_report_needs ENABLE ROW LEVEL SECURITY;

-- Cette app n'utilise pas de session Supabase Auth : la sécurité réelle est
-- appliquée côté app (permissions React), pas côté RLS — même pattern que
-- toutes les autres tables (souls, users, departments, leave_requests...).
CREATE POLICY "allow_all_culte_reports" ON culte_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_culte_report_meeting_types" ON culte_report_meeting_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_culte_report_speakers" ON culte_report_speakers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_culte_report_needs" ON culte_report_needs FOR ALL USING (true) WITH CHECK (true);
