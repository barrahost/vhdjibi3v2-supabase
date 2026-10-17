-- ============================================================
-- Famille de service rattachée aux B.O.S.S (serviteurs)
-- Exécuter dans Supabase SQL Editor
-- ============================================================
-- Tout membre de l'église est rattaché à une famille de service, en plus
-- d'être dans un ou plusieurs départements s'il est B.O.S.S. Champ optionnel
-- à la création (pas de contrainte NOT NULL) pour ne pas bloquer la saisie
-- pendant que les B.O.S.S existants sont progressivement rattachés.

ALTER TABLE servants
  ADD COLUMN IF NOT EXISTS family_id TEXT REFERENCES service_families(id);

CREATE INDEX IF NOT EXISTS idx_servants_family_id ON servants (family_id);
