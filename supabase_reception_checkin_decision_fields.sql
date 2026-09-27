-- ============================================================
-- Accueil ADN par QR code — ajout des champs décision + compléments
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_reception_checkin.sql
-- ============================================================
-- Le mini-formulaire "première fois" (/accueil) permet désormais au visiteur
-- de répondre lui-même à : a-t-il donné sa vie à Jésus, veut-il rejoindre
-- l'église, quelle communauté fréquente-t-il, et ses sujets de prière.
-- Tous facultatifs (comme dans la fiche d'évangélisation existante) : ADN
-- peut toujours compléter/corriger ces réponses à la réception officielle.

DROP FUNCTION IF EXISTS submit_reception_checkin(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION submit_reception_checkin(
  p_church_id          TEXT,
  p_full_name          TEXT,
  p_gender             TEXT,
  p_phone              TEXT,
  p_location           TEXT,
  p_planned_service    TEXT,
  p_gave_life_to_jesus TEXT DEFAULT NULL,
  p_will_join_vh       TEXT DEFAULT NULL,
  p_attended_community TEXT DEFAULT NULL,
  p_prayer_topics      TEXT DEFAULT NULL
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

  IF p_planned_service IS NOT NULL AND p_planned_service <> ''
     AND p_planned_service NOT IN ('wednesday_evening', 'sunday_first', 'sunday_second', 'undecided') THEN
    RAISE EXCEPTION 'Culte invalide';
  END IF;

  IF p_gave_life_to_jesus IS NOT NULL AND p_gave_life_to_jesus <> ''
     AND p_gave_life_to_jesus NOT IN ('yes', 'no', 'not_yet') THEN
    RAISE EXCEPTION 'Valeur invalide pour "a donné sa vie à Jésus"';
  END IF;

  IF p_will_join_vh IS NOT NULL AND p_will_join_vh <> ''
     AND p_will_join_vh NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Valeur invalide pour "rejoindra une église VH"';
  END IF;

  INSERT INTO evangelized_souls (
    id, church_id, full_name, gender, phone, location,
    evangelization_date, planned_service, service_attendance,
    gave_life_to_jesus, will_join_vh, attended_community, prayer_topics,
    source_type, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text, p_church_id, trim(p_full_name), p_gender,
    NULLIF(trim(coalesce(p_phone, '')), ''),
    trim(p_location),
    now(),
    NULLIF(p_planned_service, ''),
    'came',
    NULLIF(p_gave_life_to_jesus, ''),
    NULLIF(p_will_join_vh, ''),
    NULLIF(trim(coalesce(p_attended_community, '')), ''),
    NULLIF(trim(coalesce(p_prayer_topics, '')), ''),
    'reception_qr',
    'active', now(), now()
  );

  RETURN jsonb_build_object('submitted', true);
END;
$$;
