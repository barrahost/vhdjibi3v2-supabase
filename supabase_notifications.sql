-- ============================================================
-- Notifications (flux d'événements persisté)
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_leave_requests.sql
-- et supabase_shepherd_confirmation.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id      TEXT NOT NULL,
  type           TEXT NOT NULL,          -- 'leave_request_submitted', 'shepherd_confirmation_submitted', 'interaction_reminder'
  title          TEXT NOT NULL,
  body           TEXT,
  navigate_to    TEXT,
  target_user_id TEXT,                   -- destinataire précis (users.id), NULL si ciblage par rôle
  target_role    TEXT,                   -- ex: 'admin' — résolu côté lecture via p_roles
  metadata       JSONB DEFAULT '{}'::jsonb,
  dedupe_key     TEXT,                   -- ex: 'interaction_reminder:{soul_id}:{date}'
  created_at     TIMESTAMPTZ DEFAULT now(),

  CHECK (target_user_id IS NOT NULL OR target_role IS NOT NULL)
);

-- Suivi de lecture par destinataire. Absence de ligne = non lu.
-- Évite le fan-out d'insertions pour les notifications ciblées par rôle.
CREATE TABLE IF NOT EXISTS notification_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  read_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key_idx
  ON notifications (church_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_church_created_idx ON notifications (church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_target_user_idx ON notifications (target_user_id);
CREATE INDEX IF NOT EXISTS notifications_target_role_idx ON notifications (target_role);
CREATE INDEX IF NOT EXISTS notification_reads_user_idx ON notification_reads (user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Cette app n'utilise pas de session Supabase Auth : la sécurité réelle est
-- appliquée côté app (permissions React), pas côté RLS — même pattern que
-- toutes les autres tables (souls, users, birthdays, interactions...).
CREATE POLICY "allow_select_notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "allow_insert_notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_notifications" ON notifications FOR DELETE USING (true);

CREATE POLICY "Auth select reads" ON notification_reads FOR SELECT USING (true);
CREATE POLICY "Auth insert reads" ON notification_reads FOR INSERT WITH CHECK (true);

-- ============================================================
-- RPC : notifications d'un utilisateur (directes + par rôle) avec statut lu/non lu
-- ============================================================
CREATE OR REPLACE FUNCTION get_notifications_for_user(
  p_church_id TEXT,
  p_user_id   TEXT,
  p_roles     TEXT[],
  p_limit     INT DEFAULT 50
)
RETURNS TABLE (
  id          UUID,
  type        TEXT,
  title       TEXT,
  body        TEXT,
  navigate_to TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ,
  is_read     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.type, n.title, n.body, n.navigate_to, n.metadata, n.created_at,
         (nr.id IS NOT NULL) AS is_read
  FROM notifications n
  LEFT JOIN notification_reads nr
    ON nr.notification_id = n.id AND nr.user_id = p_user_id
  WHERE n.church_id = p_church_id
    AND (n.target_user_id = p_user_id OR n.target_role = ANY(p_roles))
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- RPC : compteur non lu seul (badge cloche)
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_church_id TEXT,
  p_user_id   TEXT,
  p_roles     TEXT[]
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM notifications n
  LEFT JOIN notification_reads nr
    ON nr.notification_id = n.id AND nr.user_id = p_user_id
  WHERE n.church_id = p_church_id
    AND (n.target_user_id = p_user_id OR n.target_role = ANY(p_roles))
    AND nr.id IS NULL;

  RETURN v_count;
END;
$$;

-- ============================================================
-- RPC : marquer une notification comme lue
-- ============================================================
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id          TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id)
  VALUES (p_notification_id, p_user_id)
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$;

-- ============================================================
-- RPC : marquer toutes les notifications d'un utilisateur comme lues
-- ============================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_church_id TEXT,
  p_user_id   TEXT,
  p_roles     TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id)
  SELECT n.id, p_user_id
  FROM notifications n
  WHERE n.church_id = p_church_id
    AND (n.target_user_id = p_user_id OR n.target_role = ANY(p_roles))
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$;

-- ============================================================
-- TRIGGER 1 : nouvelle demande de congé (status = 'pending') → notifie les admins
-- ============================================================
CREATE OR REPLACE FUNCTION notify_leave_request_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (church_id, type, title, body, navigate_to, target_role, metadata)
    VALUES (
      NEW.church_id,
      'leave_request_submitted',
      'Nouvelle demande de congé',
      NEW.user_name || ' a demandé un congé du ' || to_char(NEW.start_date, 'DD/MM') ||
        ' au ' || to_char(NEW.end_date, 'DD/MM'),
      '/conges',
      'admin',
      jsonb_build_object('leave_request_id', NEW.id, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_leave_request_submitted ON leave_requests;
CREATE TRIGGER trg_notify_leave_request_submitted
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_leave_request_submitted();

-- ============================================================
-- TRIGGER 2 : confirmation berger soumise (status → 'used') → notifie les admins
-- ============================================================
CREATE OR REPLACE FUNCTION notify_shepherd_confirmation_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'used' AND (OLD.status IS DISTINCT FROM 'used') THEN
    INSERT INTO notifications (church_id, type, title, body, navigate_to, target_role, metadata)
    VALUES (
      NEW.church_id,
      'shepherd_confirmation_submitted',
      'Confirmation de suivi reçue',
      NEW.shepherd_name || ' a confirmé la liste de ses âmes suivies',
      '/users',
      'admin',
      jsonb_build_object('shepherd_id', NEW.shepherd_id, 'token_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_shepherd_confirmation_submitted ON shepherd_confirmation_tokens;
CREATE TRIGGER trg_notify_shepherd_confirmation_submitted
  AFTER UPDATE ON shepherd_confirmation_tokens
  FOR EACH ROW
  EXECUTE FUNCTION notify_shepherd_confirmation_submitted();

-- ============================================================
-- RPC : vérification "N+ jours sans interaction", appelée côté client une fois
-- par session (dédupliquée via dedupe_key, donc sans risque en cas de double appel)
-- ============================================================
CREATE OR REPLACE FUNCTION check_interaction_reminders(
  p_church_id      TEXT,
  p_threshold_days INT DEFAULT 5
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INT := 0;
  v_row_count INT;
  v_soul RECORD;
  v_last_date DATE;
  v_days INT;
  v_key TEXT;
BEGIN
  FOR v_soul IN
    SELECT s.id, s.full_name, s.shepherd_id
    FROM souls s
    WHERE s.church_id = p_church_id
      AND s.status = 'active'
      AND s.shepherd_id IS NOT NULL
      AND s.shepherd_id <> ''
  LOOP
    SELECT MAX(i.date) INTO v_last_date
    FROM interactions i
    WHERE i.church_id = p_church_id
      AND i.soul_id = v_soul.id;

    v_days := CASE WHEN v_last_date IS NULL THEN 9999
                   ELSE (CURRENT_DATE - v_last_date) END;

    IF v_days >= p_threshold_days THEN
      v_key := 'interaction_reminder:' || v_soul.id || ':' || CURRENT_DATE;

      INSERT INTO notifications (church_id, type, title, body, navigate_to, target_user_id, dedupe_key, metadata)
      VALUES (
        p_church_id,
        'interaction_reminder',
        'Rappel de suivi',
        v_soul.full_name || ' n''a pas eu d''interaction depuis ' ||
          (CASE WHEN v_last_date IS NULL THEN 'longtemps' ELSE v_days || ' jours' END),
        '/interactions',
        v_soul.shepherd_id,
        v_key,
        jsonb_build_object('soul_id', v_soul.id, 'days', v_days)
      )
      ON CONFLICT (church_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_inserted := v_inserted + v_row_count;
    END IF;
  END LOOP;

  RETURN v_inserted;
END;
$$;
