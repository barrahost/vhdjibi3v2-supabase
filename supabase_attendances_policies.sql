-- Présences (pointage des bergers) : autoriser l'enregistrement, la correction et la suppression.
--
-- Le schéma de référence n'accorde que la LECTURE sur la table attendances (politiques anon_select_attendances
-- et auth_select_attendances). Si la base de production est dans cet état, l'ajout d'une présence est refusé
-- (« new row violates row-level security policy ») : c'est ce que voient les bergers depuis que l'application
-- affiche les erreurs au lieu d'un faux « Présences enregistrées ».
--
-- Ce script est sans risque et peut être relancé : il n'ajoute une règle que si elle manque, ne touche pas aux
-- données, et suit la règle des autres tables de l'application (accès décidé par l'application, comme pour
-- birthdays, teachings ou les tables des cultes).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendances' AND policyname = 'attendances_insert') THEN
    CREATE POLICY attendances_insert ON public.attendances FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendances' AND policyname = 'attendances_update') THEN
    CREATE POLICY attendances_update ON public.attendances FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendances' AND policyname = 'attendances_delete') THEN
    CREATE POLICY attendances_delete ON public.attendances FOR DELETE USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendances TO anon, authenticated;

-- Retrouver vite le pointage d'une âme pour un jour donné (formulaire de pointage)
CREATE INDEX IF NOT EXISTS idx_attendances_soul_date ON public.attendances (soul_id, date);

-- Contrôle : les règles de la table (on doit voir SELECT, INSERT, UPDATE et DELETE)
SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendances' ORDER BY cmd, policyname;
