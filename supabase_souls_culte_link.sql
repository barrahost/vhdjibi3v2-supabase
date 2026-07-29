-- ============================================================
-- Rattachement des ames a un culte precis (liens de reception ADN)
-- ============================================================

ALTER TABLE culte_recurring_schedules ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES culte_events(id);
CREATE INDEX IF NOT EXISTS idx_souls_event ON souls (event_id);

-- Heures de debut des 2 cultes du dimanche (a ajuster dans Parametres > Programme
-- recurrent si les horaires reels sont differents)
UPDATE culte_recurring_schedules SET start_time = '07:30'
WHERE meeting_type_name = '1er Culte de Célébration & Contemplation' AND day_of_week = 0;

UPDATE culte_recurring_schedules SET start_time = '10:00'
WHERE meeting_type_name = '2e Culte de Célébration & Contemplation' AND day_of_week = 0;
