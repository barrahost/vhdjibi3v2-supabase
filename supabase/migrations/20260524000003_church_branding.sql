-- Champs de branding pour la page de login de chaque église
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS copyright_name TEXT;

-- Valeurs par défaut pour l'AGC
UPDATE churches SET
  short_name = 'AGC Bergerie',
  copyright_name = 'Vases d''Honneur Assemblée Grâce Confondante'
WHERE slug = 'bergerie';
