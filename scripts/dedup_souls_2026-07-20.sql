-- ============================================================
-- Suppression des doublons d'âmes identifiés le 2026-07-20
-- Exécuter dans Supabase SQL Editor (ou via Management API après confirmation)
--
-- 10 doublons confirmés (même nom+téléphone, ou variante d'orthographe
-- validée par Patrice). Les interactions des fiches supprimées sont
-- réaffectées à la fiche gardée avant suppression, pour ne perdre aucun
-- historique. Vérifié au préalable : aucune référence dans
-- evangelized_souls/servants pour ces IDs, et 0 attendance/birthday.
-- ============================================================

BEGIN;

-- Réaffecter les interactions des fiches à supprimer vers la fiche gardée
UPDATE interactions SET soul_id = 'mWXT8ODbXKnQELfgR3jN' WHERE soul_id = 'fK0wwhUDJVALeM0IXzJq';   -- Konan Ali
UPDATE interactions SET soul_id = 'QALU2OK41lELQGl2kzsG' WHERE soul_id = 'gYsTOwphihmZZJe0Kxd5';   -- Mathey-Apossan Godwin Eric Junior
UPDATE interactions SET soul_id = '0Yby6NDxVqUUV3FVitxk' WHERE soul_id = 'x4q5xnCdS8EHafwOlzN5';   -- Thedoué Désiré
UPDATE interactions SET soul_id = 'vRu3Kquks9AqECYoMzTj' WHERE soul_id = 'oQM1K9kX24EXLbkGoDZT';   -- Kambou Ester
UPDATE interactions SET soul_id = 'p20QRpB88FSddxq33ecd' WHERE soul_id = 'dgpvJG515SmCUhpdkCRB';   -- Hestia Siminin

-- Supprimer les 10 fiches en doublon
DELETE FROM souls WHERE id IN (
  'soul_1784006268666_ugs0zt9',   -- GLOU Daniel (doublon)
  'soul_1784006533466_243od9k',   -- GLOU Donatienne (doublon)
  'soul_1784467278677_20b5nfs',   -- Goulien Médecin R.K (doublon)
  'fK0wwhUDJVALeM0IXzJq',         -- Konan Ali (doublon)
  'soul_1783870415540_gxmokjw',   -- KOUADIO Affoué (doublon)
  'gYsTOwphihmZZJe0Kxd5',         -- Mathey-Apossan Godwin Eric Junior (doublon)
  'x4q5xnCdS8EHafwOlzN5',         -- DOUE DESIRE (doublon de Thedoué Désiré)
  'oQM1K9kX24EXLbkGoDZT',         -- Kanbou Esther (doublon de Kambou Ester)
  'dgpvJG515SmCUhpdkCRB',         -- Siminin (doublon de Hestia Siminin)
  'soul_1779618292171_9tbazi5'    -- Kone Saki Eric (doublon de Lago Saki Eric)
);

COMMIT;
