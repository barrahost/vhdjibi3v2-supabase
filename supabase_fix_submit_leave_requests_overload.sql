-- ============================================================
-- Corrige l'ambiguïté de fonction sur submit_leave_requests
-- Exécuter dans Supabase SQL Editor
--
-- Bug : supabase_whatsapp.sql avait ajouté un paramètre p_phone à
-- submit_leave_requests via CREATE OR REPLACE — mais en PL/pgSQL, changer
-- la liste de paramètres ne remplace pas la fonction existante, ça crée
-- une DEUXIÈME fonction surchargée (overload). Avec le retrait de WhatsApp,
-- le frontend appelle de nouveau la fonction avec 5 arguments (sans
-- p_phone), mais Postgres ne peut plus choisir entre les deux versions
-- existantes (5 et 6 paramètres) → erreur "Could not choose the best
-- candidate function".
--
-- Ce script supprime la version à 6 paramètres (avec p_phone), devenue
-- inutile, pour ne garder que la version originale à 5 paramètres.
-- ============================================================

DROP FUNCTION IF EXISTS submit_leave_requests(
  p_user_id   TEXT,
  p_user_name TEXT,
  p_user_role TEXT,
  p_church_id TEXT,
  p_periods   JSONB,
  p_phone     TEXT
);
