-- Fix RLS for birthdays table
-- L'app utilise localStorage auth (pas Supabase native auth sessions),
-- donc on doit autoriser le rôle public (anon) à écrire dans birthdays.

ALTER TABLE public.birthdays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "birthdays_all_operations" ON public.birthdays;
DROP POLICY IF EXISTS "Allow all operations on birthdays" ON public.birthdays;
DROP POLICY IF EXISTS "Public read access for birthdays" ON public.birthdays;
DROP POLICY IF EXISTS "Service role can manage birthdays" ON public.birthdays;

-- Politique unique : tout le monde peut tout faire sur birthdays
-- (la sécurité est gérée au niveau applicatif via les rôles localStorage)
CREATE POLICY "birthdays_all_operations"
ON public.birthdays
FOR ALL
TO public
USING (true)
WITH CHECK (true);
