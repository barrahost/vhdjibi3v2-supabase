-- ============================================================
-- Intégration WhatsApp (Meta Cloud API)
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_leave_requests.sql,
-- supabase_shepherd_confirmation.sql et supabase_notifications.sql
--
-- AVANT d'exécuter : remplacer les deux valeurs ci-dessous par les vraies
-- (URL de la fonction Edge déployée + secret partagé), puis exécuter les
-- deux commandes ALTER DATABASE séparément (elles ne peuvent pas être dans
-- une transaction avec le reste).
--
--   ALTER DATABASE postgres SET app.whatsapp_webhook_url =
--     'https://<TON_PROJECT_REF>.supabase.co/functions/v1/send-whatsapp-event';
--   ALTER DATABASE postgres SET app.whatsapp_webhook_secret = '<TON_WEBHOOK_SECRET>';
--
-- Tant que ces deux réglages ne sont pas faits, dispatch_whatsapp_event()
-- ne fait rien (no-op silencieux) — le reste de l'app continue de fonctionner.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- Helper : envoie l'événement à la Edge Function (no-op si non configuré)
-- ============================================================
CREATE OR REPLACE FUNCTION dispatch_whatsapp_event(p_payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url    TEXT := current_setting('app.whatsapp_webhook_url', true);
  v_secret TEXT := current_setting('app.whatsapp_webhook_secret', true);
BEGIN
  IF v_url IS NULL OR v_url = '' THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    body := p_payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    timeout_milliseconds := 8000
  );
END;
$$;

-- ============================================================
-- submit_leave_requests : ajoute p_phone (collecté sur le formulaire public)
-- ============================================================
CREATE OR REPLACE FUNCTION submit_leave_requests(
  p_user_id   TEXT,
  p_user_name TEXT,
  p_user_role TEXT,
  p_church_id TEXT,
  p_periods   JSONB,
  p_phone     TEXT DEFAULT NULL
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
  SELECT jsonb_agg(elem ORDER BY (elem->>'start_date'))
  INTO v_sorted
  FROM jsonb_array_elements(p_periods) AS elem;

  IF v_sorted IS NULL OR jsonb_array_length(v_sorted) = 0 THEN
    RAISE EXCEPTION 'Aucune période sélectionnée';
  END IF;

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

  DELETE FROM leave_requests
  WHERE church_id = p_church_id
    AND user_id   = p_user_id
    AND status    = 'pending';

  FOR v_period IN SELECT * FROM jsonb_array_elements(v_sorted)
  LOOP
    INSERT INTO leave_requests (church_id, user_id, user_name, user_role, start_date, end_date, phone)
    VALUES (
      p_church_id,
      p_user_id,
      p_user_name,
      p_user_role,
      (v_period->>'start_date')::DATE,
      (v_period->>'end_date')::DATE,
      p_phone
    );
  END LOOP;

  RETURN jsonb_build_object('submitted', v_count);
END;
$$;

-- ============================================================
-- notify_leave_request_submitted : ajoute le dispatch WhatsApp
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

    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'type', 'leave_request_submitted',
      'church_id', NEW.church_id,
      'user_name', NEW.user_name,
      'start_date', to_char(NEW.start_date, 'DD/MM/YYYY'),
      'end_date', to_char(NEW.end_date, 'DD/MM/YYYY')
    ));
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- notify_shepherd_confirmation_submitted : ajoute le dispatch WhatsApp
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

    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'type', 'shepherd_confirmation_submitted',
      'church_id', NEW.church_id,
      'shepherd_name', NEW.shepherd_name
    ));
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER : décision de congé (approuvé/refusé) → WhatsApp au demandeur
-- Pas de ligne dans `notifications` : le demandeur n'est pas un utilisateur
-- connecté de l'app, uniquement un numéro WhatsApp fourni sur le formulaire.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_leave_request_decided()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending'
     AND NEW.status IN ('approved', 'rejected')
     AND NEW.phone IS NOT NULL AND NEW.phone <> ''
  THEN
    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'type', 'leave_request_decided',
      'church_id', NEW.church_id,
      'phone', NEW.phone,
      'start_date', to_char(NEW.start_date, 'DD/MM/YYYY'),
      'end_date', to_char(NEW.end_date, 'DD/MM/YYYY'),
      'decision_label', CASE
        WHEN NEW.status = 'approved' THEN 'approuvée'
        ELSE 'refusée' || COALESCE(' (motif : ' || NEW.rejection_reason || ')', '')
      END
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_leave_request_decided ON leave_requests;
CREATE TRIGGER trg_notify_leave_request_decided
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_leave_request_decided();

-- ============================================================
-- check_interaction_reminders : ajoute le dispatch WhatsApp (opt-in uniquement)
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
  v_opt_in BOOLEAN;
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

      IF v_row_count > 0 THEN
        SELECT whatsapp_opt_in INTO v_opt_in FROM users WHERE id = v_soul.shepherd_id;

        IF v_opt_in IS TRUE THEN
          PERFORM dispatch_whatsapp_event(jsonb_build_object(
            'type', 'interaction_reminder',
            'church_id', p_church_id,
            'target_user_id', v_soul.shepherd_id,
            'soul_name', v_soul.full_name,
            'days', v_days
          ));
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN v_inserted;
END;
$$;
