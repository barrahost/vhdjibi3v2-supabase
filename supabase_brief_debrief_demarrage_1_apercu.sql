-- ============================================================
-- Brief & Débrief : APERÇU du nettoyage avant le démarrage du 15/11/2026
-- Lecture seule : ne modifie rien. A exécuter AVANT 2026-11-08_brief_debrief_2_nettoyage.sql
-- ============================================================
-- Est supprimé (essais avant le démarrage) : tout ce qui concerne les cultes d'avant le 15/11/2026
--   briefs et débriefs généraux, conducteurs, consignes par département, contrôles de préparation,
--   fiches de débrief des départements SANS rapport de culte, actions du plan créées par le module.
-- Est conservé : les rapports de culte des départements (Emmeraude, ADN, Finances…), leurs fiches de
--   débrief et leurs besoins, les cultes eux-mêmes, le programme récurrent et les modèles de contrôle,
--   et tout ce qui concerne les cultes du 15/11/2026 et après.

WITH old_events AS (
  SELECT id FROM culte_events WHERE church_id = 'bergerie' AND service_date < DATE '2026-11-15'
),
report_sheets AS (   -- fiches de débrief rattachées à un vrai rapport de culte : conservées
  SELECT d.id FROM culte_debriefs d
  JOIN culte_reports r ON r.event_id = d.event_id
   AND (r.department_name = d.department_name OR (d.department_id IS NOT NULL AND r.department_id = d.department_id))
)
SELECT 'Briefs / débriefs généraux' AS element, count(*) AS a_supprimer
  FROM culte_meetings WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Conducteurs (séquences)', count(*)
  FROM culte_run_sheet_items WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Consignes par département', count(*)
  FROM culte_brief_instructions WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Points de contrôle cochés', count(*)
  FROM culte_checklist_items WHERE event_id IN (SELECT id FROM old_events)
UNION ALL SELECT 'Fiches de débrief (sans rapport)', count(*)
  FROM culte_debriefs WHERE event_id IN (SELECT id FROM old_events) AND id NOT IN (SELECT id FROM report_sheets)
UNION ALL SELECT 'Actions du plan (brief, contrôle, débrief, manuelles)', count(*)
  FROM culte_report_needs
 WHERE church_id = 'bergerie' AND culte_report_id IS NULL AND source <> 'rapport'
   AND (event_id IS NULL OR event_id IN (SELECT id FROM old_events))
UNION ALL SELECT '— conservé : fiches de débrief des rapports', count(*)
  FROM culte_debriefs WHERE event_id IN (SELECT id FROM old_events) AND id IN (SELECT id FROM report_sheets)
UNION ALL SELECT '— conservé : besoins des rapports de culte', count(*)
  FROM culte_report_needs WHERE church_id = 'bergerie' AND (culte_report_id IS NOT NULL OR source = 'rapport');
