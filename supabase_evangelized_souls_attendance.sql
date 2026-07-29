-- ============================================================
-- Suivi (informatif) de presence au culte attendu, pour la
-- page "Attendus au culte" du profil Evangeliste.
-- N'affecte pas la reception officielle (bouton "Recevoir" ADN).
-- ============================================================

ALTER TABLE evangelized_souls ADD COLUMN IF NOT EXISTS service_attendance TEXT
  CHECK (service_attendance IN ('pending', 'came', 'no_show'));
