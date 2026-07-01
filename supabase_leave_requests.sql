-- ============================================================
-- Leave Requests (Demandes de congé)
-- Exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        TEXT NOT NULL,
  user_id          TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_role        TEXT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at      TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Auth users (admins) can manage all requests for their church
CREATE POLICY "Auth select" ON leave_requests FOR SELECT
  USING (church_id = current_setting('app.church_id', true));

CREATE POLICY "Auth insert" ON leave_requests FOR INSERT
  WITH CHECK (church_id = current_setting('app.church_id', true));

CREATE POLICY "Auth update" ON leave_requests FOR UPDATE
  USING (church_id = current_setting('app.church_id', true));

CREATE POLICY "Auth delete" ON leave_requests FOR DELETE
  USING (church_id = current_setting('app.church_id', true));

-- ============================================================
-- RPC : liste des utilisateurs actifs pour le formulaire public
-- ============================================================
CREATE OR REPLACE FUNCTION get_users_for_leave_form(p_church_id TEXT)
RETURNS TABLE (
  id        TEXT,
  full_name TEXT,
  roles     JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.roles::JSONB
  FROM users u
  WHERE u.church_id = p_church_id
    AND u.status    = 'active'
  ORDER BY u.full_name;
END;
$$;

-- ============================================================
-- RPC : demandes existantes d'un utilisateur (pour affichage)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_leave_requests(
  p_user_id   TEXT,
  p_church_id TEXT
)
RETURNS TABLE (
  id          UUID,
  start_date  DATE,
  end_date    DATE,
  status      TEXT,
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT lr.id, lr.start_date, lr.end_date, lr.status, lr.submitted_at
  FROM leave_requests lr
  WHERE lr.church_id = p_church_id
    AND lr.user_id   = p_user_id
  ORDER BY lr.start_date;
END;
$$;

-- ============================================================
-- RPC : soumettre des demandes de congé (bypass RLS)
-- Remplace les demandes 'pending' existantes de l'utilisateur.
-- ============================================================
CREATE OR REPLACE FUNCTION submit_leave_requests(
  p_user_id   TEXT,
  p_user_name TEXT,
  p_user_role TEXT,
  p_church_id TEXT,
  p_periods   JSONB  -- [{start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD'}, ...]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period   JSONB;
  v_start    DATE;
  v_end      DATE;
  v_prev_end DATE := NULL;
  v_count    INT  := 0;
  v_today    DATE := CURRENT_DATE;
  v_sorted   JSONB;
BEGIN
  -- Sort periods by start_date for gap validation
  SELECT jsonb_agg(elem ORDER BY (elem->>'start_date'))
  INTO v_sorted
  FROM jsonb_array_elements(p_periods) AS elem;

  IF v_sorted IS NULL OR jsonb_array_length(v_sorted) = 0 THEN
    RAISE EXCEPTION 'Aucune période sélectionnée';
  END IF;

  -- Validate each period in order
  FOR v_period IN SELECT * FROM jsonb_array_elements(v_sorted)
  LOOP
    v_start := (v_period->>'start_date')::DATE;
    v_end   := (v_period->>'end_date')::DATE;

    IF v_start < v_today THEN
      RAISE EXCEPTION 'La date de début doit être aujourd''hui ou dans le futur';
    END IF;

    IF v_end <= v_start THEN
      RAISE EXCEPTION 'La date de fin doit être après la date de début';
    END IF;

    IF (v_end - v_start) > 13 THEN
      RAISE EXCEPTION 'Une période ne peut pas dépasser 14 jours (% jours détectés)', (v_end - v_start + 1);
    END IF;

    IF v_prev_end IS NOT NULL AND (v_start - v_prev_end) < 7 THEN
      RAISE EXCEPTION 'Il faut au moins 7 jours entre deux périodes (% jours détectés)', (v_start - v_prev_end);
    END IF;

    v_prev_end := v_end;
    v_count    := v_count + 1;
  END LOOP;

  -- Replace existing pending requests for this user
  DELETE FROM leave_requests
  WHERE church_id = p_church_id
    AND user_id   = p_user_id
    AND status    = 'pending';

  -- Insert new requests
  FOR v_period IN SELECT * FROM jsonb_array_elements(v_sorted)
  LOOP
    INSERT INTO leave_requests (church_id, user_id, user_name, user_role, start_date, end_date)
    VALUES (
      p_church_id,
      p_user_id,
      p_user_name,
      p_user_role,
      (v_period->>'start_date')::DATE,
      (v_period->>'end_date')::DATE
    );
  END LOOP;

  RETURN jsonb_build_object('submitted', v_count);
END;
$$;
