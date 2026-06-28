-- Migration : Suivi des activités de département
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des activités organisées par un département
CREATE TABLE IF NOT EXISTS department_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('prayer','youth','agape','meeting','other')),
  date        DATE NOT NULL,
  notes       TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Table des participations (un enregistrement par serviteur par activité)
CREATE TABLE IF NOT EXISTS department_activity_participations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  activity_id UUID NOT NULL REFERENCES department_activities(id) ON DELETE CASCADE,
  servant_id  UUID NOT NULL REFERENCES servants(id) ON DELETE CASCADE,
  present     BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (activity_id, servant_id)
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_dept_activities_church_dept
  ON department_activities (church_id, department_id);

CREATE INDEX IF NOT EXISTS idx_dept_participations_activity
  ON department_activity_participations (activity_id);

CREATE INDEX IF NOT EXISTS idx_dept_participations_servant
  ON department_activity_participations (servant_id);

-- RLS
ALTER TABLE department_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_activity_participations ENABLE ROW LEVEL SECURITY;

-- Politiques : accès limité à la même église
CREATE POLICY "dept_activities_church_access"
  ON department_activities FOR ALL
  USING (church_id = current_setting('app.church_id', true));

CREATE POLICY "dept_participations_church_access"
  ON department_activity_participations FOR ALL
  USING (church_id = current_setting('app.church_id', true));
