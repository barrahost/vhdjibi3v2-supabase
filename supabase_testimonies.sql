-- ============================================================
-- Témoignages (même principe que la chaîne de prière)
-- Exécuter dans Supabase SQL Editor — le script peut être relancé sans risque.
--
-- Dépôt public sur /temoignage : anonyme par défaut, nom + téléphone si la
-- personne souhaite être recontactée. Le témoignage est écrit, enregistré en
-- audio (fichier sur Cloudflare R2, seule son adresse est gardée ici), ou les deux.
-- ============================================================

CREATE TABLE IF NOT EXISTS testimonies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN (
                     'Guérison', 'Délivrance', 'Famille', 'Travail & études',
                     'Finances', 'Salut & conversion', 'Prière exaucée', 'Autre'
                   )),
  content          TEXT,
  audio_url        TEXT,
  audio_duration   INT,          -- secondes
  full_name        TEXT,
  phone            TEXT,
  -- La personne accepte que son témoignage soit partagé (lu au culte, publié)
  share_consent    BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'a_partager', 'partage', 'archive')),
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT testimonies_has_content CHECK (coalesce(trim(content), '') <> '' OR audio_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_testimonies_church_date ON testimonies (church_id, submitted_at DESC);

ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;

-- Même modèle que les autres tables : la sécurité réelle est appliquée par l'application
-- (permission « Témoignages »). Le dépôt public passe par la fonction ci-dessous.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonies' AND policyname = 'allow_select_testimonies') THEN
    CREATE POLICY "allow_select_testimonies" ON testimonies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonies' AND policyname = 'allow_update_testimonies') THEN
    CREATE POLICY "allow_update_testimonies" ON testimonies FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonies' AND policyname = 'allow_delete_testimonies') THEN
    CREATE POLICY "allow_delete_testimonies" ON testimonies FOR DELETE USING (true);
  END IF;
END $$;

GRANT SELECT, UPDATE, DELETE ON testimonies TO anon, authenticated;

-- ============================================================
-- RPC : dépôt public (sans compte), anonyme ou identifié
-- ============================================================
CREATE OR REPLACE FUNCTION submit_testimony(
  p_church_id      TEXT,
  p_category       TEXT,
  p_content        TEXT DEFAULT NULL,
  p_audio_url      TEXT DEFAULT NULL,
  p_audio_duration INT  DEFAULT NULL,
  p_full_name      TEXT DEFAULT NULL,
  p_phone          TEXT DEFAULT NULL,
  p_share_consent  BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content TEXT := NULLIF(trim(coalesce(p_content, '')), '');
  v_audio   TEXT := NULLIF(trim(coalesce(p_audio_url, '')), '');
BEGIN
  IF v_content IS NULL AND v_audio IS NULL THEN
    RAISE EXCEPTION 'Écris ton témoignage ou enregistre-le en audio';
  END IF;
  IF length(coalesce(v_content, '')) > 5000 THEN
    RAISE EXCEPTION 'Le témoignage est trop long (5000 caractères au maximum)';
  END IF;
  -- Seuls les fichiers déposés sur le stockage audio de l'église sont acceptés
  IF v_audio IS NOT NULL AND (v_audio !~ '^https://[a-z0-9.-]+\.r2\.dev/temoignages/' OR length(v_audio) > 500) THEN
    RAISE EXCEPTION 'Adresse audio invalide';
  END IF;
  IF p_category NOT IN (
    'Guérison', 'Délivrance', 'Famille', 'Travail & études',
    'Finances', 'Salut & conversion', 'Prière exaucée', 'Autre'
  ) THEN
    RAISE EXCEPTION 'Catégorie invalide';
  END IF;

  INSERT INTO testimonies (church_id, category, content, audio_url, audio_duration, full_name, phone, share_consent)
  VALUES (
    p_church_id,
    p_category,
    v_content,
    v_audio,
    CASE WHEN v_audio IS NULL THEN NULL ELSE greatest(0, least(coalesce(p_audio_duration, 0), 3600)) END,
    NULLIF(trim(coalesce(p_full_name, '')), ''),
    NULLIF(trim(coalesce(p_phone, '')), ''),
    coalesce(p_share_consent, false)
  );

  RETURN jsonb_build_object('submitted', true);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_testimony(TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- Mises à jour en direct de la page de gestion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'testimonies') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE testimonies;
  END IF;
END $$;
