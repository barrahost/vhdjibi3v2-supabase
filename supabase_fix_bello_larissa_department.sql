-- Fix: BELLO LARISSA (department_leader) n'avait pas de departmentId dans business_profiles,
-- ce qui bloquait l'accès à /rapport-culte ("Aucun département de responsable n'est associé...").
-- Département assigné : GESTION DES CULTES (confirmé par Patrice).
UPDATE users
SET business_profiles = '[{"type":"department_leader","isActive":true,"departmentId":"x3y3uiYTigvXbikv3UId"}]'::jsonb
WHERE id = 'user_1785020879841_h3r2npq';
