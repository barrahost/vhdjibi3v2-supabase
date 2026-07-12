-- ============================================================
-- Demandes d'absence (Voyage, Repos, Maladie, Professionnel, Autre)
-- Exécuter dans Supabase SQL Editor
--
-- Distinct des demandes de congé : pas de plafond de 14 jours, pas
-- d'écart minimum de 7 jours entre deux périodes — une absence est
-- ponctuelle (souvent 1 seul jour).
-- ============================================================

CREATE TABLE IF NOT EXISTS absence_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        TEXT NOT NULL,
  user_id          TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_role        TEXT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  reason           TEXT NOT NULL CHECK (reason IN ('Voyage', 'Repos', 'Maladie', 'Professionnel', 'Autre')),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at      TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;

-- Cette app n'utilise pas de session Supabase Auth : la sécurité réelle est
-- appliquée côté app (permissions React), pas côté RLS — même pattern que
-- toutes les autres tables (souls, users, leave_requests...).
CREATE POLICY "allow_select_absence_requests" ON absence_requests FOR SELECT USING (true);
CREATE POLICY "allow_insert_absence_requests" ON absence_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_absence_requests" ON absence_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_absence_requests" ON absence_requests FOR DELETE USING (true);

-- ============================================================
-- RPC : demandes d'absence existantes d'un utilisateur (pour affichage)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_absence_requests(
  p_user_id   TEXT,
  p_church_id TEXT
)
RETURNS TABLE (
  id           UUID,
  start_date   DATE,
  end_date     DATE,
  reason       TEXT,
  status       TEXT,
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ar.id, ar.start_date, ar.end_date, ar.reason, ar.status, ar.submitted_at
  FROM absence_requests ar
  WHERE ar.church_id = p_church_id
    AND ar.user_id   = p_user_id
  ORDER BY ar.start_date;
END;
$$;

-- ============================================================
-- RPC : soumettre des demandes d'absence (bypass RLS)
-- Remplace les demandes 'pending' existantes de l'utilisateur.
-- Pas de plafond de durée ni d'écart minimum entre périodes.
-- ============================================================
CREATE OR REPLACE FUNCTION submit_absence_requests(
  p_user_id   TEXT,
  p_user_name TEXT,
  p_user_role TEXT,
  p_church_id TEXT,
  p_periods   JSONB  -- [{start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD', reason: '...'}, ...]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period JSONB;
  v_start  DATE;
  v_end    DATE;
  v_reason TEXT;
  v_count  INT := 0;
  v_today  DATE := CURRENT_DATE;
BEGIN
  IF p_periods IS NULL OR jsonb_array_length(p_periods) = 0 THEN
    RAISE EXCEPTION 'Aucune période sélectionnée';
  END IF;

  FOR v_period IN SELECT * FROM jsonb_array_elements(p_periods)
  LOOP
    v_start  := (v_period->>'start_date')::DATE;
    v_end    := (v_period->>'end_date')::DATE;
    v_reason := v_period->>'reason';

    IF v_start < v_today THEN
      RAISE EXCEPTION 'La date de début doit être aujourd''hui ou dans le futur';
    END IF;

    IF v_end < v_start THEN
      RAISE EXCEPTION 'La date de fin doit être égale ou postérieure à la date de début';
    END IF;

    IF v_reason IS NULL OR v_reason NOT IN ('Voyage', 'Repos', 'Maladie', 'Professionnel', 'Autre') THEN
      RAISE EXCEPTION 'Motif invalide pour une période';
    END IF;

    v_count := v_count + 1;
  END LOOP;

  DELETE FROM absence_requests
  WHERE church_id = p_church_id
    AND user_id   = p_user_id
    AND status    = 'pending';

  FOR v_period IN SELECT * FROM jsonb_array_elements(p_periods)
  LOOP
    INSERT INTO absence_requests (church_id, user_id, user_name, user_role, start_date, end_date, reason)
    VALUES (
      p_church_id,
      p_user_id,
      p_user_name,
      p_user_role,
      (v_period->>'start_date')::DATE,
      (v_period->>'end_date')::DATE,
      v_period->>'reason'
    );
  END LOOP;

  RETURN jsonb_build_object('submitted', v_count);
END;
$$;
