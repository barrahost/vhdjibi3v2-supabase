-- ============================================================
-- Statut de suivi des sujets de prière (Nouveau / En cours / Exaucé)
-- Exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE prayer_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'nouveau'
    CHECK (status IN ('nouveau', 'en_cours', 'exauce'));

-- Manquait : policy UPDATE (seules SELECT et DELETE existaient jusqu'ici)
CREATE POLICY "allow_update_prayer_requests" ON prayer_requests FOR UPDATE USING (true) WITH CHECK (true);
