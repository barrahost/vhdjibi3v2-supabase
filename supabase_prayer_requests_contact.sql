-- ============================================================
-- Identité optionnelle sur les sujets de prière (anonyme par défaut)
-- Exécuter dans Supabase SQL Editor
--
-- La personne peut choisir de se faire connaître (nom + téléphone) si elle
-- souhaite être recontactée (suivi, échange avec le pasteur, infos, etc.).
-- Reste facultatif : aucune valeur ne remplace l'anonymat par défaut.
-- ============================================================

ALTER TABLE prayer_requests
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Changer la liste de paramètres via CREATE OR REPLACE crée un overload au
-- lieu de remplacer la fonction existante (déjà rencontré avec
-- submit_leave_requests) — on supprime explicitement l'ancienne version.
DROP FUNCTION IF EXISTS submit_prayer_request(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION submit_prayer_request(
  p_church_id TEXT,
  p_category  TEXT,
  p_subject   TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone     TEXT DEFAULT NULL
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

  INSERT INTO prayer_requests (church_id, category, subject, full_name, phone)
  VALUES (
    p_church_id,
    p_category,
    trim(p_subject),
    NULLIF(trim(coalesce(p_full_name, '')), ''),
    NULLIF(trim(coalesce(p_phone, '')), '')
  );

  RETURN jsonb_build_object('submitted', true);
END;
$$;
