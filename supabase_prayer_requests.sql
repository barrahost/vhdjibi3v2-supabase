-- ============================================================
-- Sujets de la chaîne de prière (remplace le Google Form)
-- Exécuter dans Supabase SQL Editor
-- Soumission anonyme : aucune identité collectée.
-- ============================================================

CREATE TABLE IF NOT EXISTS prayer_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN (
                 'Déblocage Spirituel', 'Déblocage Familial', 'Déblocage Professionnel',
                 'Déblocage Financier', 'Déblocage Santé', 'Autre'
               )),
  subject      TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Auth (admin) : lecture et suppression scopées à l'église
CREATE POLICY "Auth select" ON prayer_requests FOR SELECT
  USING (church_id = current_setting('app.church_id', true));

CREATE POLICY "Auth delete" ON prayer_requests FOR DELETE
  USING (church_id = current_setting('app.church_id', true));

-- ============================================================
-- RPC : soumission publique et anonyme (bypass RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION submit_prayer_request(
  p_church_id TEXT,
  p_category  TEXT,
  p_subject   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_subject IS NULL OR trim(p_subject) = '' THEN
    RAISE EXCEPTION 'Le sujet ne peut pas être vide';
  END IF;

  IF p_category NOT IN (
    'Déblocage Spirituel', 'Déblocage Familial', 'Déblocage Professionnel',
    'Déblocage Financier', 'Déblocage Santé', 'Autre'
  ) THEN
    RAISE EXCEPTION 'Catégorie invalide';
  END IF;

  INSERT INTO prayer_requests (church_id, category, subject)
  VALUES (p_church_id, p_category, trim(p_subject));

  RETURN jsonb_build_object('submitted', true);
END;
$$;
