-- ============================================================
-- Brief & Débrief : NETTOYAGE avant le démarrage du 15/11/2026
-- A exécuter APRES avoir lu le résultat de 2026-11-08_brief_debrief_1_apercu.sql
-- Tout ce qui est supprimé est d'abord copié dans des tables d'archive (archive_brief_20261108_*),
-- non lisibles par l'application : on peut donc revenir en arrière si besoin.
-- ============================================================
BEGIN;

CREATE TEMP TABLE old_events ON COMMIT DROP AS
  SELECT id FROM culte_events WHERE church_id = 'bergerie' AND service_date < DATE '2026-11-15';

CREATE TEMP TABLE report_sheets ON COMMIT DROP AS
  SELECT d.id FROM culte_debriefs d
  JOIN culte_reports r ON r.event_id = d.event_id
   AND (r.department_name = d.department_name OR (d.department_id IS NOT NULL AND r.department_id = d.department_id));

-- 1. Archives
CREATE TABLE IF NOT EXISTS archive_brief_20261108_meetings AS
  SELECT * FROM culte_meetings WHERE event_id IN (SELECT id FROM old_events);
CREATE TABLE IF NOT EXISTS archive_brief_20261108_run_sheet AS
  SELECT * FROM culte_run_sheet_items WHERE event_id IN (SELECT id FROM old_events);
CREATE TABLE IF NOT EXISTS archive_brief_20261108_instructions AS
  SELECT * FROM culte_brief_instructions WHERE event_id IN (SELECT id FROM old_events);
CREATE TABLE IF NOT EXISTS archive_brief_20261108_checklist AS
  SELECT * FROM culte_checklist_items WHERE event_id IN (SELECT id FROM old_events);
CREATE TABLE IF NOT EXISTS archive_brief_20261108_debriefs AS
  SELECT * FROM culte_debriefs WHERE event_id IN (SELECT id FROM old_events) AND id NOT IN (SELECT id FROM report_sheets);
CREATE TABLE IF NOT EXISTS archive_brief_20261108_actions AS
  SELECT * FROM culte_report_needs
   WHERE church_id = 'bergerie' AND culte_report_id IS NULL AND source <> 'rapport'
     AND (event_id IS NULL OR event_id IN (SELECT id FROM old_events));

ALTER TABLE archive_brief_20261108_meetings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_brief_20261108_run_sheet    ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_brief_20261108_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_brief_20261108_checklist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_brief_20261108_debriefs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_brief_20261108_actions      ENABLE ROW LEVEL SECURITY;

-- 2. Suppression (uniquement ce qui a été archivé)
DELETE FROM culte_meetings           WHERE id IN (SELECT id FROM archive_brief_20261108_meetings);
DELETE FROM culte_run_sheet_items    WHERE id IN (SELECT id FROM archive_brief_20261108_run_sheet);
DELETE FROM culte_brief_instructions WHERE id IN (SELECT id FROM archive_brief_20261108_instructions);
DELETE FROM culte_checklist_items    WHERE id IN (SELECT id FROM archive_brief_20261108_checklist);
DELETE FROM culte_debriefs           WHERE id IN (SELECT id FROM archive_brief_20261108_debriefs);
DELETE FROM culte_report_needs       WHERE id IN (SELECT id FROM archive_brief_20261108_actions);

COMMIT;

-- 3. Vérification : tout doit être à 0, sauf les deux lignes « conservé »
WITH old_events AS (
  SELECT id FROM culte_events WHERE church_id = 'bergerie' AND service_date < DATE '2026-11-15'
)
SELECT 'Briefs / débriefs généraux' AS element, count(*) AS restant FROM culte_meetings WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Conducteurs', count(*) FROM culte_run_sheet_items WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Consignes', count(*) FROM culte_brief_instructions WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Contrôles', count(*) FROM culte_checklist_items WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Actions du module', count(*) FROM culte_report_needs
  WHERE church_id = 'bergerie' AND culte_report_id IS NULL AND source <> 'rapport' AND (event_id IS NULL OR event_id IN (SELECT id FROM old_events))
UNION ALL SELECT '— conservé : fiches de débrief des rapports', count(*) FROM culte_debriefs WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT '— archivé (total des lignes)', (SELECT count(*) FROM archive_brief_20261108_meetings) + (SELECT count(*) FROM archive_brief_20261108_run_sheet)
  + (SELECT count(*) FROM archive_brief_20261108_instructions) + (SELECT count(*) FROM archive_brief_20261108_checklist)
  + (SELECT count(*) FROM archive_brief_20261108_debriefs) + (SELECT count(*) FROM archive_brief_20261108_actions);
