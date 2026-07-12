-- ============================================================
-- Retrait de l'intégration WhatsApp — on garde uniquement le SMS
-- Exécuter dans Supabase SQL Editor
--
-- Remet notify_leave_request_submitted(), notify_shepherd_confirmation_submitted()
-- et check_interaction_reminders() à leur version d'origine (sans l'appel
-- à dispatch_whatsapp_event), supprime le trigger de décision de congé et
-- la fonction de dispatch elle-même.
--
-- Les colonnes leave_requests.phone et users.whatsapp_opt_in sont
-- volontairement CONSERVÉES (pas de perte de données déjà soumises) —
-- elles ne sont simplement plus utilisées par le code. Supprime-les
-- toi-même plus tard si tu veux vraiment les retirer :
--   ALTER TABLE leave_requests DROP COLUMN IF EXISTS phone;
--   ALTER TABLE users DROP COLUMN IF EXISTS whatsapp_opt_in;
-- ============================================================

-- 1. Supprime le trigger + la fonction de décision de congé (WhatsApp uniquement)
DROP TRIGGER IF EXISTS trg_notify_leave_request_decided ON leave_requests;
DROP FUNCTION IF EXISTS notify_leave_request_decided();

-- 2. Supprime la fonction de dispatch WhatsApp
DROP FUNCTION IF EXISTS dispatch_whatsapp_event(JSONB);

-- 3. Restaure notify_leave_request_submitted() sans l'appel WhatsApp
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

-- 4. Restaure notify_shepherd_confirmation_submitted() sans l'appel WhatsApp
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

-- 5. Restaure check_interaction_reminders() sans l'appel WhatsApp
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

-- Note : les réglages ALTER DATABASE (webhook url/secret) n'ont probablement
-- jamais été configurés (l'intégration n'a jamais été activée) et le rôle
-- utilisé par l'éditeur SQL Supabase n'a pas le droit de les modifier de
-- toute façon (ALTER DATABASE nécessite un rôle superuser). Rien à nettoyer
-- ici — dispatch_whatsapp_event() est de toute façon supprimée à l'étape 2.
