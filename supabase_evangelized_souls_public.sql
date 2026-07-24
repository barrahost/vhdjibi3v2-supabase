-- ============================================================
-- Formulaire public d'évangélisation (fiche d'entretien)
-- Exécuter dans Supabase SQL Editor
--
-- Ajoute "L'âme rejoindra une église VH" (Oui/Non), distinct du culte
-- envisagé, et une fonction SECURITY DEFINER pour la soumission publique
-- (sans authentification), même pattern que /absence et /priere.
-- L'évangéliste reste non attribué (evangelist_id NULL) — l'admin
-- répartit ensuite via le bouton "Répartir" déjà existant.
-- ============================================================

ALTER TABLE evangelized_souls
  ADD COLUMN IF NOT EXISTS will_join_vh TEXT CHECK (will_join_vh IN ('yes', 'no'));

CREATE OR REPLACE FUNCTION submit_evangelized_soul(
  p_church_id           TEXT,
  p_full_name           TEXT,
  p_gender               TEXT,
  p_phone                TEXT,
  p_location              TEXT,
  p_attended_community    TEXT,
  p_gave_life_to_jesus    TEXT,
  p_will_join_vh          TEXT,
  p_planned_service       TEXT,
  p_prayer_topics         TEXT,
  p_interviewer_name      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Le nom est obligatoire';
  END IF;

  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Genre invalide';
  END IF;

  IF p_location IS NULL OR trim(p_location) = '' THEN
    RAISE EXCEPTION 'Le lieu de résidence est obligatoire';
  END IF;

  IF p_gave_life_to_jesus IS NOT NULL AND p_gave_life_to_jesus <> ''
     AND p_gave_life_to_jesus NOT IN ('yes', 'no', 'not_yet') THEN
    RAISE EXCEPTION 'Valeur invalide pour "a donné sa vie à Jésus"';
  END IF;

  IF p_will_join_vh IS NOT NULL AND p_will_join_vh <> ''
     AND p_will_join_vh NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Valeur invalide pour "rejoindra une église VH"';
  END IF;

  IF p_planned_service IS NOT NULL AND p_planned_service <> ''
     AND p_planned_service NOT IN ('wednesday_evening', 'sunday_first', 'sunday_second', 'undecided') THEN
    RAISE EXCEPTION 'Culte envisagé invalide';
  END IF;

  INSERT INTO evangelized_souls (
    id, church_id, full_name, gender, phone, location,
    evangelization_date, attended_community, gave_life_to_jesus, will_join_vh,
    planned_service, prayer_topics, interviewer_name,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text, p_church_id, trim(p_full_name), p_gender,
    NULLIF(trim(coalesce(p_phone, '')), ''),
    trim(p_location),
    now(),
    NULLIF(trim(coalesce(p_attended_community, '')), ''),
    NULLIF(p_gave_life_to_jesus, ''),
    NULLIF(p_will_join_vh, ''),
    NULLIF(p_planned_service, ''),
    NULLIF(trim(coalesce(p_prayer_topics, '')), ''),
    NULLIF(trim(coalesce(p_interviewer_name, '')), ''),
    'active', now(), now()
  );

  RETURN jsonb_build_object('submitted', true);
END;
$$;
