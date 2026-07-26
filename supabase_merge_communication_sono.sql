-- Fusion des departements COMMUNICATION et SONORISATION en un seul "COM & SONO",
-- demande par Patrice. Garde l'id de SONORISATION (QpFTn6behEIrHByDMCPP) comme
-- id canonique car deja reference par les rapports Sono et le profil de TANO PATRICE.

-- 1. Renommer SONORISATION -> COM & SONO
UPDATE departments
SET name = 'COM & SONO', updated_at = now()
WHERE id = 'QpFTn6behEIrHByDMCPP';

-- 2. Reassigner les serviteurs qui etaient uniquement dans COMMUNICATION
UPDATE servants
SET department_ids = array_append(
  array_remove(department_ids, 'JLq9hJVvwGOX2pTnUL9w'),
  'QpFTn6behEIrHByDMCPP'
)
WHERE 'JLq9hJVvwGOX2pTnUL9w' = ANY(department_ids)
  AND NOT ('QpFTn6behEIrHByDMCPP' = ANY(department_ids));

-- 3. Retirer la reference COMMUNICATION pour TANO PATRICE (garde SONORISATION/COM & SONO)
UPDATE servants
SET department_ids = array_remove(department_ids, 'JLq9hJVvwGOX2pTnUL9w')
WHERE 'JLq9hJVvwGOX2pTnUL9w' = ANY(department_ids)
  AND 'QpFTn6behEIrHByDMCPP' = ANY(department_ids);

-- 4. Supprimer le departement COMMUNICATION (aucune reference restante)
DELETE FROM departments WHERE id = 'JLq9hJVvwGOX2pTnUL9w';

-- 5. Mettre a jour le nom de departement sur les rapports Sono existants
UPDATE culte_reports
SET department_name = 'COM & SONO'
WHERE report_type = 'sono';
