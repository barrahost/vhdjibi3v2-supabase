-- ============================================================
-- Correctif RLS — leave_requests, prayer_requests, notifications
-- Exécuter dans Supabase SQL Editor (à faire une fois, immédiatement)
--
-- Bug : ces 3 tables ont été créées avec des policies restrictives
-- (church_id = current_setting('app.church_id', true)), mais cette app
-- ne définit jamais ce paramètre de session — donc aucune requête
-- authentifiée ne pouvait jamais lire ces tables. Toutes les autres
-- tables de l'app (souls, users, birthdays, interactions...) utilisent
-- des policies ouvertes (USING (true)), la sécurité réelle étant
-- appliquée côté app (permissions React). On aligne ces 3 tables sur
-- le même modèle.
-- ============================================================

-- leave_requests
DROP POLICY IF EXISTS "Auth select" ON leave_requests;
DROP POLICY IF EXISTS "Auth insert" ON leave_requests;
DROP POLICY IF EXISTS "Auth update" ON leave_requests;
DROP POLICY IF EXISTS "Auth delete" ON leave_requests;

CREATE POLICY "allow_select_leave_requests" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "allow_insert_leave_requests" ON leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_leave_requests" ON leave_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_leave_requests" ON leave_requests FOR DELETE USING (true);

-- prayer_requests
DROP POLICY IF EXISTS "Auth select" ON prayer_requests;
DROP POLICY IF EXISTS "Auth delete" ON prayer_requests;

CREATE POLICY "allow_select_prayer_requests" ON prayer_requests FOR SELECT USING (true);
CREATE POLICY "allow_delete_prayer_requests" ON prayer_requests FOR DELETE USING (true);

-- notifications
DROP POLICY IF EXISTS "Auth select" ON notifications;
DROP POLICY IF EXISTS "Auth insert" ON notifications;
DROP POLICY IF EXISTS "Auth delete" ON notifications;

CREATE POLICY "allow_select_notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "allow_insert_notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_notifications" ON notifications FOR DELETE USING (true);
