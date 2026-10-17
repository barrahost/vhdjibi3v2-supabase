-- ============================================================
-- Types de rencontre : départements éligibles à faire un rapport
-- Exécuter dans Supabase SQL Editor, APRÈS supabase_culte_reports.sql
-- ============================================================
-- NULL ou tableau vide = tous les départements peuvent rapporter ce type
-- de rencontre (comportement historique, rien ne change tant que
-- l'éligibilité n'est pas configurée dans Types de rencontre).
-- Valeurs possibles : 'worship', 'adn', 'finance', 'sainte_cene', 'sono', 'academie'.

ALTER TABLE culte_report_meeting_types
  ADD COLUMN IF NOT EXISTS eligible_report_types TEXT[];
