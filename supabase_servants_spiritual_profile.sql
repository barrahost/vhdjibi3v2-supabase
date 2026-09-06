-- ============================================================
-- Corrige l'inconsistance ame/B.O.S.S : au moment de la promotion,
-- la fiche servant (B.O.S.S) ne recuperait ni le profil spirituel
-- (ne de nouveau, bapteme) ni la famille de service de la soul source.
-- Ce champ permet desormais de les recopier.
-- ============================================================
-- Deja execute en production le 2026-09-06.

ALTER TABLE servants ADD COLUMN IF NOT EXISTS spiritual_profile JSONB;

-- Note : la colonne family_id existait deja sur servants mais n'etait
-- jamais renseignee lors d'une promotion depuis une soul. Corrige dans
-- soulPromotion.service.ts et servant.service.ts (importFromSouls).
