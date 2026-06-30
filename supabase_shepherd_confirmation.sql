-- ============================================================
-- Shepherd Confirmation Tokens
-- Exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS shepherd_confirmation_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    TEXT NOT NULL,
  shepherd_id  TEXT NOT NULL,
  shepherd_name TEXT NOT NULL,
  token        UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shepherd_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Lecture publique par token (sécurisé par UUID non-devinable)
CREATE POLICY "Public read"   ON shepherd_confirmation_tokens FOR SELECT USING (true);
CREATE POLICY "Auth insert"   ON shepherd_confirmation_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update"   ON shepherd_confirmation_tokens FOR UPDATE USING (true);

-- ============================================================
-- RPC : récupérer les âmes d'un berger via token (bypass RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION get_souls_for_confirmation(p_token TEXT)
RETURNS TABLE (
  id        TEXT,
  full_name TEXT,
  nickname  TEXT,
  phone     TEXT,
  location  TEXT,
  photo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shepherd_id TEXT;
  v_church_id   TEXT;
BEGIN
  SELECT shepherd_id, church_id
    INTO v_shepherd_id, v_church_id
    FROM shepherd_confirmation_tokens
   WHERE token = p_token::UUID
     AND status = 'pending'
     AND expires_at > now();

  IF v_shepherd_id IS NULL THEN
    RAISE EXCEPTION 'Token invalide ou expiré';
  END IF;

  RETURN QUERY
  SELECT s.id, s.full_name, s.nickname, s.phone, s.location, s.photo_url
    FROM souls s
   WHERE s.church_id    = v_church_id
     AND s.shepherd_id  = v_shepherd_id
     AND s.status       = 'active'
   ORDER BY s.full_name;
END;
$$;

-- ============================================================
-- RPC : soumettre la confirmation (bypass RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION submit_shepherd_confirmation(
  p_token             TEXT,
  p_confirmed_soul_ids TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shepherd_id TEXT;
  v_church_id   TEXT;
  v_removed     INT;
BEGIN
  SELECT shepherd_id, church_id
    INTO v_shepherd_id, v_church_id
    FROM shepherd_confirmation_tokens
   WHERE token = p_token::UUID
     AND status = 'pending'
     AND expires_at > now();

  IF v_shepherd_id IS NULL THEN
    RAISE EXCEPTION 'Token invalide ou expiré';
  END IF;

  -- Retirer le berger des âmes non confirmées
  UPDATE souls
     SET shepherd_id = NULL,
         updated_at  = now()
   WHERE church_id   = v_church_id
     AND shepherd_id = v_shepherd_id
     AND status      = 'active'
     AND id != ALL(p_confirmed_soul_ids);

  GET DIAGNOSTICS v_removed = ROW_COUNT;

  -- Marquer le token comme utilisé
  UPDATE shepherd_confirmation_tokens
     SET status  = 'used',
         used_at = now()
   WHERE token = p_token::UUID;

  RETURN jsonb_build_object(
    'confirmed', COALESCE(array_length(p_confirmed_soul_ids, 1), 0),
    'removed',   v_removed
  );
END;
$$;
