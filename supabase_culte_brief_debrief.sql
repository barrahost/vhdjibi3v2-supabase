-- ============================================================
-- Brief & Débrief des cultes (guide du Centre Kodesh, adapté à AGC)
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_culte_events.sql
-- et supabase_souls_culte_link.sql. Idempotent : peut être ré-exécuté.
-- ============================================================
-- Boucle hebdomadaire autour de chaque culte :
--   brief (avant) → contrôle de préparation (avant/pendant) → débrief (après)
--   → plan d'actions suivi d'une semaine sur l'autre.
-- L'appli reste inchangée tant que ce script n'est pas exécuté : le module
-- « Cultes » ne s'affiche qu'une fois ces tables créées.

-- ------------------------------------------------------------
-- 1. Programme récurrent : heure de fin + activation du brief
-- ------------------------------------------------------------
ALTER TABLE culte_recurring_schedules ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE culte_recurring_schedules ADD COLUMN IF NOT EXISTS brief_enabled BOOLEAN NOT NULL DEFAULT false;

-- Les 2 cultes du dimanche : 7h30–9h30 et 10h–12h, avec brief & contrôle.
-- (Modifiable ensuite dans Configuration > Programme récurrent. Ne s'applique
-- qu'une fois : tant que l'heure de fin n'est pas renseignée.)
UPDATE culte_recurring_schedules
   SET start_time = COALESCE(start_time, '07:30'), end_time = '09:30', brief_enabled = true
 WHERE meeting_type_name = '1er Culte de Célébration & Contemplation'
   AND day_of_week = 0 AND end_time IS NULL;

UPDATE culte_recurring_schedules
   SET start_time = COALESCE(start_time, '10:00'), end_time = '12:00', brief_enabled = true
 WHERE meeting_type_name = '2e Culte de Célébration & Contemplation'
   AND day_of_week = 0 AND end_time IS NULL;

-- ------------------------------------------------------------
-- 2. Plan d'actions : extension de culte_report_needs
--    (les « besoins signalés » existants deviennent des actions)
-- ------------------------------------------------------------
ALTER TABLE culte_report_needs
  ADD COLUMN IF NOT EXISTS event_id          UUID REFERENCES culte_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source            TEXT NOT NULL DEFAULT 'rapport',
  ADD COLUMN IF NOT EXISTS cause             TEXT,
  ADD COLUMN IF NOT EXISTS decision          TEXT,
  ADD COLUMN IF NOT EXISTS indicator         TEXT,
  ADD COLUMN IF NOT EXISTS responsible_id    TEXT,
  ADD COLUMN IF NOT EXISTS responsible_name  TEXT,
  ADD COLUMN IF NOT EXISTS due_date          DATE,
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS needs_arbitration BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by        TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name   TEXT,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'culte_report_needs_status_check') THEN
    ALTER TABLE culte_report_needs
      ADD CONSTRAINT culte_report_needs_status_check
      CHECK (status IN ('todo', 'in_progress', 'done', 'dropped'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'culte_report_needs_source_check') THEN
    ALTER TABLE culte_report_needs
      ADD CONSTRAINT culte_report_needs_source_check
      CHECK (source IN ('rapport', 'controle', 'debrief', 'brief', 'manuel'));
  END IF;
END $$;

-- Besoins déjà traités avant cette migration → statut « terminé »
UPDATE culte_report_needs SET status = 'done' WHERE is_addressed = true AND status = 'todo';

CREATE INDEX IF NOT EXISTS idx_culte_report_needs_event ON culte_report_needs (event_id);
CREATE INDEX IF NOT EXISTS idx_culte_report_needs_open  ON culte_report_needs (church_id, status, due_date);

-- Garde « is_addressed » (utilisé par les anciens écrans/tableaux de bord) et « status »
-- cohérents, quel que soit l'écran qui écrit : fermer l'un ferme l'autre.
CREATE OR REPLACE FUNCTION culte_report_needs_sync_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_addressed IS DISTINCT FROM OLD.is_addressed THEN
      IF NEW.is_addressed THEN
        IF NEW.status NOT IN ('done', 'dropped') THEN NEW.status := 'done'; END IF;
        NEW.addressed_at := COALESCE(NEW.addressed_at, now());
      ELSE
        IF NEW.status NOT IN ('todo', 'in_progress') THEN NEW.status := 'todo'; END IF;
        NEW.addressed_at := NULL;
      END IF;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.is_addressed := NEW.status IN ('done', 'dropped');
      NEW.addressed_at := CASE WHEN NEW.is_addressed THEN COALESCE(NEW.addressed_at, now()) ELSE NULL END;
    END IF;
  ELSIF NEW.status IN ('done', 'dropped') THEN
    NEW.is_addressed := true;
    NEW.addressed_at := COALESCE(NEW.addressed_at, now());
  ELSIF NEW.is_addressed THEN
    NEW.status := 'done';
    NEW.addressed_at := COALESCE(NEW.addressed_at, now());
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_culte_report_needs_sync_status ON culte_report_needs;
CREATE TRIGGER trg_culte_report_needs_sync_status
  BEFORE INSERT OR UPDATE ON culte_report_needs
  FOR EACH ROW EXECUTE FUNCTION culte_report_needs_sync_status();

-- ------------------------------------------------------------
-- 3. Brief / débrief général d'un culte (un document par culte)
--    kind = 'brief'   : thème, vision, vigilance… (content JSONB)
--    kind = 'debrief' : les 6 questions, arbitrages, conclusion
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS culte_meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       TEXT NOT NULL,
  event_id        UUID NOT NULL REFERENCES culte_events(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('brief', 'debrief')),
  content         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'done')),
  ready_at        TIMESTAMPTZ,
  updated_by      TEXT,
  updated_by_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_culte_meetings_church ON culte_meetings (church_id, kind);

-- ------------------------------------------------------------
-- 4. Conducteur : déroulé minuté du culte (séquences ordonnées)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS culte_run_sheet_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        TEXT NOT NULL,
  event_id         UUID NOT NULL REFERENCES culte_events(id) ON DELETE CASCADE,
  position         INT NOT NULL DEFAULT 0,
  start_time       TIME,
  title            TEXT NOT NULL,
  department_name  TEXT,
  responsible_name TEXT,
  support          TEXT,
  needs_regie      BOOLEAN NOT NULL DEFAULT false,
  duration_min     INT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_culte_run_sheet_event ON culte_run_sheet_items (event_id, position);

-- ------------------------------------------------------------
-- 5. Consignes du brief par département (« qui fait quoi »)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS culte_brief_instructions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       TEXT NOT NULL,
  event_id        UUID NOT NULL REFERENCES culte_events(id) ON DELETE CASCADE,
  department_id   TEXT,
  department_name TEXT NOT NULL,
  instructions    TEXT NOT NULL DEFAULT '',
  updated_by_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, department_name)
);

-- ------------------------------------------------------------
-- 6. Contrôle de préparation : modèles (par département) et instances (par culte)
--    scope = 'service' : à vérifier avant chaque culte
--    scope = 'day'     : une seule fois par jour (repris au 2e culte du dimanche)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS culte_checklist_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       TEXT NOT NULL,
  department_id   TEXT,
  department_name TEXT NOT NULL,
  position        INT NOT NULL DEFAULT 0,
  task            TEXT NOT NULL,
  indicator       TEXT,
  scope           TEXT NOT NULL DEFAULT 'service' CHECK (scope IN ('service', 'day')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_culte_checklist_templates_church ON culte_checklist_templates (church_id, department_name, position);

CREATE TABLE IF NOT EXISTS culte_checklist_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        TEXT NOT NULL,
  event_id         UUID NOT NULL REFERENCES culte_events(id) ON DELETE CASCADE,
  template_id      UUID REFERENCES culte_checklist_templates(id) ON DELETE SET NULL,
  department_id    TEXT,
  department_name  TEXT NOT NULL,
  position         INT NOT NULL DEFAULT 0,
  task             TEXT NOT NULL,
  indicator        TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'nok')),
  responsible_name TEXT,
  observation      TEXT,
  inherited        BOOLEAN NOT NULL DEFAULT false,
  checked_by       TEXT,
  checked_by_name  TEXT,
  checked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_culte_checklist_items_event ON culte_checklist_items (event_id, department_name, position);

-- ------------------------------------------------------------
-- 7. Fiche de débrief d'un département pour un culte
--    (les décisions prises, avec responsable et échéance, sont des lignes du
--    plan d'actions : culte_report_needs avec source = 'debrief')
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS culte_debriefs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id         TEXT NOT NULL,
  event_id          UUID NOT NULL REFERENCES culte_events(id) ON DELETE CASCADE,
  department_id     TEXT,
  department_name   TEXT NOT NULL,
  positives         TEXT,
  difficulties      TEXT,
  causes            TEXT,
  needs             TEXT,
  solutions         TEXT,
  submitted_by      TEXT,
  submitted_by_name TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, department_name)
);
CREATE INDEX IF NOT EXISTS idx_culte_debriefs_church ON culte_debriefs (church_id, event_id);

-- ------------------------------------------------------------
-- 8. Sécurité : même modèle que les autres tables (pas de session Supabase Auth,
--    permissions appliquées côté appli)
-- ------------------------------------------------------------
ALTER TABLE culte_meetings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_run_sheet_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_brief_instructions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_checklist_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE culte_debriefs            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_culte_meetings ON culte_meetings;
CREATE POLICY allow_all_culte_meetings ON culte_meetings FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS allow_all_culte_run_sheet_items ON culte_run_sheet_items;
CREATE POLICY allow_all_culte_run_sheet_items ON culte_run_sheet_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS allow_all_culte_brief_instructions ON culte_brief_instructions;
CREATE POLICY allow_all_culte_brief_instructions ON culte_brief_instructions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS allow_all_culte_checklist_templates ON culte_checklist_templates;
CREATE POLICY allow_all_culte_checklist_templates ON culte_checklist_templates FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS allow_all_culte_checklist_items ON culte_checklist_items;
CREATE POLICY allow_all_culte_checklist_items ON culte_checklist_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS allow_all_culte_debriefs ON culte_debriefs;
CREATE POLICY allow_all_culte_debriefs ON culte_debriefs FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 9. Temps réel : le contrôle de préparation se met à jour en direct chez le pasteur
--    pendant que les responsables cochent leurs points.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE culte_checklist_items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
