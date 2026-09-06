-- ============================================================
-- Academie VH AGC : fiche etudiant complete (matricule + infos)
-- Exécuter dans Supabase SQL Editor, APRES supabase_academie.sql
-- ============================================================
-- Une fiche par etudiant (user_id), independante des autres roles que
-- cette personne peut avoir dans l'eglise (servant, ame, etc.).

CREATE TABLE IF NOT EXISTS academie_students (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id            TEXT NOT NULL,
  user_id              TEXT NOT NULL,
  seq_number           BIGSERIAL,
  matricule            TEXT GENERATED ALWAYS AS ('ACAD-' || lpad(seq_number::text, 4, '0')) STORED,
  birth_date           DATE,
  gender               TEXT CHECK (gender IN ('male','female')),
  marital_status       TEXT,
  tshirt_size          TEXT,
  conversion_year      INTEGER,
  baptism_date         DATE,
  holy_spirit_baptized BOOLEAN,
  department_id        TEXT,  -- reference logique vers departments.id (departement de service)
  service_family_id    TEXT,  -- reference logique vers service_families.id (famille de service)
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE academie_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY academie_students_all ON academie_students FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_academie_students_user ON academie_students (user_id);
