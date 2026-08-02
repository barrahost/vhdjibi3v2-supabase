-- Alignement departements/responsables sur l'organigramme officiel (02/08/2026)
-- 1. Creation du departement INTENDANCE + compte de son responsable Michael
WITH dept AS (
  INSERT INTO departments (id, name, status, church_id, created_at)
  SELECT gen_random_uuid()::text, 'INTENDANCE', 'active', 'bergerie', now()
  WHERE NOT EXISTS (SELECT 1 FROM departments WHERE church_id='bergerie' AND name='INTENDANCE')
  RETURNING id
)
INSERT INTO users (id, full_name, phone, password, role, business_profiles, status, church_id, created_at, updated_at)
SELECT 'user_' || (extract(epoch from now())*1000)::bigint || '_intdce',
  'MICHAEL (Intendance)', '+2250178605678', '123456', 'department_leader',
  jsonb_build_array(
    jsonb_build_object('type','department_leader','isActive',true,'isPrimary',true,'departmentIds', jsonb_build_array(dept.id)),
    jsonb_build_object('type','evangelist','isActive',true)
  ),
  'active', 'bergerie', now(), now()
FROM dept
WHERE NOT EXISTS (SELECT 1 FROM users WHERE church_id='bergerie' AND phone='+2250178605678');

-- 2. Rattachements des responsables sans departement

UPDATE users SET business_profiles = (
  SELECT jsonb_agg(CASE WHEN p->>'type' = 'department_leader'
    THEN (p - 'departmentId') || jsonb_build_object('departmentIds', '["EfvLsuysWDXZtPL8LEzF"]'::jsonb)
    ELSE p END)
  FROM jsonb_array_elements(business_profiles) p
), updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'ÉLISÉE KOFFI';
UPDATE users SET business_profiles = (
  SELECT jsonb_agg(CASE WHEN p->>'type' = 'department_leader'
    THEN (p - 'departmentId') || jsonb_build_object('departmentIds', '["nQt1xiyCKOgIBvEsddTB"]'::jsonb)
    ELSE p END)
  FROM jsonb_array_elements(business_profiles) p
), updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'KOUAKOU TANOH JEAN MARC';
UPDATE users SET business_profiles = (
  SELECT jsonb_agg(CASE WHEN p->>'type' = 'department_leader'
    THEN (p - 'departmentId') || jsonb_build_object('departmentIds', '["FB2hOsWDKJ2QF8cWUgqW", "GXTy4cvbJgZS9Gh8fH1I"]'::jsonb)
    ELSE p END)
  FROM jsonb_array_elements(business_profiles) p
), updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'TUEHI REGINA';
UPDATE users SET business_profiles = (
  SELECT jsonb_agg(CASE WHEN p->>'type' = 'department_leader'
    THEN (p - 'departmentId') || jsonb_build_object('departmentIds', '["fOOSUOaPf4gA1GPWgX2A"]'::jsonb)
    ELSE p END)
  FROM jsonb_array_elements(business_profiles) p
), updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'YEBOUA Grâce';
-- 3. Edwige Sery : + Decoration ; Sery Christian : + GEM, - ADN (Marie Claire en est responsable)
UPDATE users SET business_profiles = (
  SELECT jsonb_agg(CASE WHEN p->>'type' = 'department_leader'
    THEN (p - 'departmentId') || jsonb_build_object('departmentIds', '["hk9iz8aMWPvWTtrCBhHU", "xtsas4Cy5GGLFVSkG4Dc", "ARZ3Rl6K3ykdPE71W3CD", "Zo8ooJJkqewuwIQPS7kd"]'::jsonb)
    ELSE p END)
  FROM jsonb_array_elements(business_profiles) p
), updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'EDWIGE SERY';
UPDATE users SET business_profiles = (
  SELECT jsonb_agg(CASE WHEN p->>'type' = 'department_leader'
    THEN (p - 'departmentId') || jsonb_build_object('departmentIds', '["9TOZo9Ba2W2vU4NLTugd", "a927e0b6-3df9-4564-903a-39b3940bc0e1", "1HLcIsnqCzOzG2iwdHyM", "heA3uQW7BJBzmRcnfH3n"]'::jsonb)
    ELSE p END)
  FROM jsonb_array_elements(business_profiles) p
), updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'AP SERY CHRISTIAN';
-- 4. Nouveaux profils responsable : PA Rachelle (Famille+Leaman), Pasteur Sezan (Dirigeants)
UPDATE users SET business_profiles = business_profiles || '[{"type": "department_leader", "isActive": true, "departmentIds": ["4C6evegTQnMrMniwRr4R", "miWhd3VovHSiwKF3TLIK"]}]'::jsonb, updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'PA RACHELLE SEZAN'
  AND NOT business_profiles @> '[{"type": "department_leader"}]'::jsonb;
UPDATE users SET business_profiles = business_profiles || '[{"type": "department_leader", "isActive": true, "departmentIds": ["eWlO4EB3KD06lkGzIo90"]}]'::jsonb, updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'PASTEUR SEZAN'
  AND NOT business_profiles @> '[{"type": "department_leader"}]'::jsonb;
