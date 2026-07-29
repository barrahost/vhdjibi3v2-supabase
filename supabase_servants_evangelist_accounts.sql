-- ============================================================
-- Comptes utilisateur pour tous les serviteurs + profil Evangeliste
-- ============================================================

-- Etape 1 : relier les serviteurs a un compte utilisateur existant
-- partageant le meme numero de telephone (compte deja cree mais pas encore lie).
UPDATE servants s
SET source_type = 'user', source_id = u.id
FROM users u
WHERE s.church_id = 'bergerie' AND s.status = 'active'
  AND (s.source_type IS DISTINCT FROM 'user' OR s.source_id IS NULL)
  AND u.church_id = s.church_id AND u.phone = s.phone;

-- Etape 2 : creer un nouveau compte pour les serviteurs restants (aucun compte trouve).
WITH to_create AS (
  SELECT s.id AS servant_id, s.full_name, s.phone,
         'user_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text || s.id), 1, 7) AS new_user_id
  FROM servants s
  WHERE s.church_id = 'bergerie' AND s.status = 'active'
    AND (s.source_type IS DISTINCT FROM 'user' OR s.source_id IS NULL)
),
inserted AS (
  INSERT INTO users (id, church_id, full_name, phone, password, role, business_profiles, status, created_at, updated_at)
  SELECT new_user_id, 'bergerie', full_name, phone, '123456', 'evangelist',
         jsonb_build_array(jsonb_build_object('type', 'evangelist', 'isActive', true, 'isPrimary', true)),
         'active', now(), now()
  FROM to_create
  RETURNING id, phone
)
UPDATE servants s
SET source_type = 'user', source_id = i.id
FROM inserted i
WHERE s.phone = i.phone AND s.church_id = 'bergerie' AND s.status = 'active'
  AND (s.source_type IS DISTINCT FROM 'user' OR s.source_id IS NULL);

-- Etape 3 : garantir le profil Evangeliste sur tous les comptes lies a un serviteur
-- (couvre les comptes deja lies avant ce script + ceux relies/crees a l'instant),
-- sans toucher aux autres profils deja presents sur ces comptes.
UPDATE users u
SET business_profiles = COALESCE(u.business_profiles, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('type', 'evangelist', 'isActive', true))
FROM servants s
WHERE s.church_id = 'bergerie' AND s.status = 'active' AND s.source_type = 'user' AND s.source_id = u.id
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(u.business_profiles, '[]'::jsonb)) p WHERE p->>'type' = 'evangelist'
  );
