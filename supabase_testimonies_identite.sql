-- ============================================================
-- Témoignages : identification obligatoire (demande du pasteur)
-- Exécuter dans Supabase SQL Editor APRÈS supabase_testimonies.sql — relançable sans risque.
--
-- Pour écarter les envois fantaisistes, toute personne donne son nom et son téléphone avant de
-- témoigner. Elle peut ensuite demander que son témoignage reste anonyme EN PUBLIC : les pasteurs
-- connaissent son identité, mais son nom n'est jamais cité au culte ni publié.
-- Au plus 3 témoignages par numéro de téléphone sur 24 heures.
-- Les témoignages déjà reçus sans nom restent tels quels.
-- ============================================================

ALTER TABLE testimonies ADD COLUMN IF NOT EXISTS public_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Pour compter vite les envois récents d'un même numéro
CREATE INDEX IF NOT EXISTS idx_testimonies_phone_digits
  ON testimonies (church_id, (regexp_replace(coalesce(phone, ''), '\D', '', 'g')), submitted_at DESC);

-- Nouvelle liste de paramètres : on retire l'ancienne version (sinon les deux coexisteraient)
DROP FUNCTION IF EXISTS submit_testimony(TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION submit_testimony(
  p_church_id        TEXT,
  p_category         TEXT,
  p_content          TEXT DEFAULT NULL,
  p_audio_url        TEXT DEFAULT NULL,
  p_audio_duration   INT  DEFAULT NULL,
  p_full_name        TEXT DEFAULT NULL,
  p_phone            TEXT DEFAULT NULL,
  p_share_consent    BOOLEAN DEFAULT false,
  p_public_anonymous BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content TEXT := NULLIF(trim(coalesce(p_content, '')), '');
  v_audio   TEXT := NULLIF(trim(coalesce(p_audio_url, '')), '');
  v_name    TEXT := NULLIF(trim(coalesce(p_full_name, '')), '');
  v_phone   TEXT := NULLIF(trim(coalesce(p_phone, '')), '');
  v_digits  TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_recent  INT;
BEGIN
  IF v_name IS NULL OR length(v_name) < 2 THEN
    RAISE EXCEPTION 'Indique ton nom et prénoms';
  END IF;
  IF v_phone IS NULL OR length(v_digits) < 8 OR length(v_digits) > 15 THEN
    RAISE EXCEPTION 'Indique un numéro de téléphone valide';
  END IF;
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

  SELECT count(*) INTO v_recent
  FROM testimonies
  WHERE church_id = p_church_id
    AND regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_digits
    AND submitted_at > now() - interval '24 hours';
  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Tu as déjà envoyé 3 témoignages aujourd''hui. Merci ! Tu pourras en partager un autre demain.';
  END IF;

  INSERT INTO testimonies (church_id, category, content, audio_url, audio_duration, full_name, phone, share_consent, public_anonymous)
  VALUES (
    p_church_id,
    p_category,
    v_content,
    v_audio,
    CASE WHEN v_audio IS NULL THEN NULL ELSE greatest(0, least(coalesce(p_audio_duration, 0), 3600)) END,
    v_name,
    v_phone,
    coalesce(p_share_consent, false),
    coalesce(p_public_anonymous, false)
  );

  RETURN jsonb_build_object('submitted', true);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_testimony(TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;

-- Contrôle : la colonne et la fonction sont en place (doit afficher 1 ligne)
SELECT proname, pronargs FROM pg_proc WHERE proname = 'submit_testimony';
