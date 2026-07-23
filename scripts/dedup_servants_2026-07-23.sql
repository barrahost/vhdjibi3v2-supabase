-- ============================================================
-- Suppression des doublons de serviteurs créés lors du dernier import
-- (dédoublonnage par source_id au lieu de téléphone, corrigé dans
-- servant.service.ts). Vérifié au préalable : aucune âme ne référence
-- ces IDs via servant_id, et les département_ids sont identiques dans
-- chaque paire.
-- ============================================================

DELETE FROM servants WHERE id IN (
  '231d2dc5-3d9b-43cf-bfcb-037bec57af04',  -- KOUAME AYA GRACE (doublon)
  'ac6248d3-d720-42f7-93a0-c5f75fd3d099',  -- SALAMY YANNICK (doublon)
  'eb0e11b0-0738-453e-8161-4ea1de63843d',  -- VIDEME MONTCHO (doublon)
  'd416994b-5fb5-4679-b1b0-dddaa571c39e'   -- ZAGBAYOU ESTHER ANNE-BERENICE (doublon)
);
