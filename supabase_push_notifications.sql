-- ============================================================
-- Notifications push (Web Push) — abonnements des appareils
-- Exécuter dans Supabase SQL Editor
-- ============================================================
-- Stocke les abonnements PushManager (un par appareil/navigateur) pour
-- chaque utilisateur. L'envoi effectif se fait depuis l'Edge Function
-- "send-push" (clé privée VAPID, jamais exposée côté client).

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_church_idx ON push_subscriptions (church_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cette app n'utilise pas de session Supabase Auth : la sécurité réelle est
-- appliquée côté app (permissions React), pas côté RLS — même pattern que
-- toutes les autres tables (souls, users, notifications...).
CREATE POLICY "allow_select_push_subscriptions" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "allow_insert_push_subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_push_subscriptions" ON push_subscriptions FOR UPDATE USING (true);
CREATE POLICY "allow_delete_push_subscriptions" ON push_subscriptions FOR DELETE USING (true);

-- ============================================================
-- RPC : enregistrer/mettre à jour un abonnement (upsert sur endpoint)
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_push_subscription(
  p_church_id  TEXT,
  p_user_id    TEXT,
  p_endpoint   TEXT,
  p_p256dh     TEXT,
  p_auth       TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO push_subscriptions (church_id, user_id, endpoint, p256dh, auth, user_agent)
  VALUES (p_church_id, p_user_id, p_endpoint, p_p256dh, p_auth, p_user_agent)
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id    = EXCLUDED.user_id,
    p256dh     = EXCLUDED.p256dh,
    auth       = EXCLUDED.auth,
    user_agent = EXCLUDED.user_agent,
    updated_at = now();
END;
$$;

-- ============================================================
-- RPC : retirer un abonnement (désactivation depuis le profil, ou
-- nettoyage automatique par l'Edge Function si l'endpoint a expiré)
-- ============================================================
CREATE OR REPLACE FUNCTION remove_push_subscription(p_endpoint TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM push_subscriptions WHERE endpoint = p_endpoint;
END;
$$;
