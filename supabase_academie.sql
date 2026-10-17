-- ============================================================
-- Academie VH AGC : classes, seances, ressources, devoirs, inscriptions
-- Exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS academie_classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  name        TEXT NOT NULL,          -- 'Classe 1', 'Classe 2', 'Classe 3'
  description TEXT,
  start_date  DATE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academie_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       TEXT NOT NULL,
  class_id        UUID NOT NULL REFERENCES academie_classes(id) ON DELETE CASCADE,
  week_number     INTEGER NOT NULL,
  section         TEXT,
  theme           TEXT NOT NULL,
  objectives      TEXT,
  duration        TEXT,
  moderator_name  TEXT,
  session_date    DATE,
  is_published    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academie_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  session_id  UUID NOT NULL REFERENCES academie_sessions(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('video','audio','pdf','link')),
  title       TEXT NOT NULL,
  r2_key      TEXT,          -- clé objet R2 (audio/video/pdf heberges)
  url         TEXT,          -- lien externe (type 'link')
  "order"     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academie_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  session_id  UUID NOT NULL REFERENCES academie_sessions(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academie_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  class_id    UUID NOT NULL REFERENCES academie_classes(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, class_id)
);

-- RLS permissive, coherent avec le reste de l'app (securite reelle cote React)
ALTER TABLE academie_classes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE academie_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE academie_resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE academie_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academie_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY academie_classes_all     ON academie_classes     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY academie_sessions_all    ON academie_sessions    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY academie_resources_all   ON academie_resources   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY academie_assignments_all ON academie_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY academie_enrollments_all ON academie_enrollments FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_academie_sessions_class ON academie_sessions (class_id, week_number);
CREATE INDEX IF NOT EXISTS idx_academie_resources_session ON academie_resources (session_id);
CREATE INDEX IF NOT EXISTS idx_academie_assignments_session ON academie_assignments (session_id);
CREATE INDEX IF NOT EXISTS idx_academie_enrollments_user ON academie_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_academie_enrollments_class ON academie_enrollments (class_id);
