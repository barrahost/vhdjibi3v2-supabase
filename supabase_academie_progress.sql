-- ============================================================
-- Academie VH AGC : suivi de progression par etudiant
-- Exécuter dans Supabase SQL Editor, APRES supabase_academie.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS academie_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  session_id   UUID NOT NULL REFERENCES academie_sessions(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, session_id)
);

ALTER TABLE academie_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY academie_progress_all ON academie_progress FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_academie_progress_user ON academie_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_academie_progress_session ON academie_progress (session_id);
