-- Assigne les responsables de departement pour les 4 types de rapport restants
-- (confirme par Patrice).

-- FOFANA-KONIN Marie Claire -> AMIS DES NOUVEAUX (ADN)
UPDATE users
SET business_profiles = '[{"type":"department_leader","isActive":true,"departmentId":"43RfvwVIY8INqang0vKp"}]'::jsonb
WHERE id = 'user_1784963143144_mu1d2vz';

-- BLANCHE AKOUBET -> SAINTE CENE (remplace ADMINISTRATION)
UPDATE users
SET business_profiles = '[{"type":"department_leader","isActive":false,"departmentId":"lAdLXujrJNKr8PDy5DEH"},{"type":"shepherd","isActive":true}]'::jsonb
WHERE id = '1njzfrTDWeQY7ZoT6SMG';

-- AP TANO PATRICE -> SONORISATION (remplace COMMUNICATION)
UPDATE users
SET business_profiles = '[{"type":"department_leader","isActive":false,"departmentId":"QpFTn6behEIrHByDMCPP"},{"type":"shepherd","isActive":true}]'::jsonb
WHERE id = 'Xwcy3L2rhYEtjBSFFgWn';

-- AP SERY CHRISTIAN -> ACADEMIE D'HONNEUR (remplace SUIVI DES AMES)
UPDATE users
SET business_profiles = '[{"type":"department_leader","isActive":false,"departmentId":"9TOZo9Ba2W2vU4NLTugd"},{"type":"shepherd","isActive":true}]'::jsonb
WHERE id = 'BwBtFuIsuCy5SOerjk8x';
