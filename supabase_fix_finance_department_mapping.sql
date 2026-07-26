-- Fix: le departement "Finance" des rapports de culte correspond en realite au
-- departement "EMMERAUDE" existant, pas a un departement "FINANCE" separe
-- (cree par erreur pendant la migration initiale, ce departement n'existe pas
-- dans l'organisation reelle).
UPDATE culte_reports
SET department_id = 'pWBzYN3XwzeeOrWhuGIe', department_name = 'EMMERAUDE'
WHERE report_type = 'finance';
