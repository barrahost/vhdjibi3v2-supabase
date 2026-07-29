-- ============================================================
-- Decision aujourd'hui : 2 questions independantes au lieu
-- d'un choix unique (donner sa vie / devenir membre)
-- ============================================================

ALTER TABLE souls ADD COLUMN IF NOT EXISTS wants_to_give_life BOOLEAN;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS wants_to_become_member BOOLEAN;

-- Retro-compatibilite : deduit les 2 booleens depuis l'ancien champ "decision"
-- (un seul choix historique) pour que les ames existantes s'affichent correctement.
UPDATE souls SET wants_to_give_life = true WHERE decision = 'give_life' AND wants_to_give_life IS NULL;
UPDATE souls SET wants_to_become_member = true WHERE decision = 'member' AND wants_to_become_member IS NULL;
