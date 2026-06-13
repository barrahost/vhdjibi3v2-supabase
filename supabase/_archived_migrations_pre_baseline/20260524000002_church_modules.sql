-- ============================================================
-- Migration : colonne modules sur la table churches
-- ============================================================
-- Ajoute une colonne JSONB qui stocke les modules actifs/inactifs
-- pour chaque église. Par défaut tous les modules sont activés.
-- ============================================================

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{
    "souls": true,
    "evangelization": true,
    "interactions": true,
    "attendance": true,
    "spiritual_progression": true,
    "soul_map": true,
    "birthdays": true,
    "users": true,
    "servants": true,
    "departments": true,
    "sms": true,
    "audio": true,
    "statistics": true
  }'::jsonb;

-- Mettre à jour les églises existantes qui ont modules = null
UPDATE churches
SET modules = '{
    "souls": true,
    "evangelization": true,
    "interactions": true,
    "attendance": true,
    "spiritual_progression": true,
    "soul_map": true,
    "birthdays": true,
    "users": true,
    "servants": true,
    "departments": true,
    "sms": true,
    "audio": true,
    "statistics": true
  }'::jsonb
WHERE modules IS NULL;
