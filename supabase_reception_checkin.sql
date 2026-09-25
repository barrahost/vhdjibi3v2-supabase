-- ============================================================
-- Accueil ADN par QR code (auto-enregistrement des nouveaux venus)
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_evangelized_souls_public.sql
-- et supabase_evangelized_souls_attendance.sql
-- ============================================================
-- Objectif : sur la page publique /accueil (lien scanné via QR code posé sur
-- la table de réception ADN), un nouveau venu peut :
--  1. chercher son nom parmi les âmes déjà évangélisées pas encore reçues,
--     et confirmer sa présence en un clic (pas de ressaisie) ;
--  2. sinon, s'enregistrer lui-même avec un mini-formulaire.
-- Aucune connexion ADN requise. Même pattern que submit_evangelized_soul
-- (public, SECURITY DEFINER) mais volontairement plus restreint : la
-- recherche ne renvoie jamais le téléphone, et rien n'est écrit
-- directement dans la table officielle "souls" -- ADN finalise la
-- réception (berger, SMS de bienvenue) via l'écran existant.

-- ============================================================
-- RPC 1 : recherche restreinte (nom + lieu uniquement, jamais le téléphone)
-- ============================================================
CREATE OR REPLACE FUNCTION search_evangelized_souls_for_checkin(
  p_church_id TEXT,
  p_query     TEXT
)
RETURNS TABLE (
  id        TEXT,
  full_name TEXT,
  location  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT es.id, es.full_name, es.location
  FROM evangelized_souls es
  WHERE es.church_id = p_church_id
    AND es.status = 'active'
    AND es.imported_to_soul_id IS NULL
    AND es.full_name ILIKE '%' || trim(p_query) || '%'
  ORDER BY es.full_name
  LIMIT 8;
END;
$$;

-- ============================================================
-- RPC 2 : confirmer l'arrivée d'une âme déjà évangélisée ("C'est moi")
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_evangelized_soul_checkin(
  p_id             TEXT,
  p_church_id      TEXT,
  p_planned_service TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE evangelized_souls
  SET service_attendance = 'came',
      planned_service    = COALESCE(NULLIF(p_planned_service, ''), planned_service),
      updated_at         = now()
  WHERE id = p_id
    AND church_id = p_church_id
    AND status = 'active'
    AND imported_to_soul_id IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN jsonb_build_object('confirmed', v_updated > 0);
END;
$$;

-- ============================================================
-- RPC 3 : auto-enregistrement d'un nouveau venu jamais évangélisé
-- ============================================================
CREATE OR REPLACE FUNCTION submit_reception_checkin(
  p_church_id      TEXT,
  p_full_name      TEXT,
  p_gender         TEXT,
  p_phone          TEXT,
  p_location       TEXT,
  p_planned_service TEXT
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

  INSERT INTO evangelized_souls (
    id, church_id, full_name, gender, phone, location,
    evangelization_date, planned_service, service_attendance,
    source_type, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text, p_church_id, trim(p_full_name), p_gender,
    NULLIF(trim(coalesce(p_phone, '')), ''),
    trim(p_location),
    now(),
    NULLIF(p_planned_service, ''),
    'came',
    'reception_qr',
    'active', now(), now()
  );

  RETURN jsonb_build_object('submitted', true);
END;
$$;
