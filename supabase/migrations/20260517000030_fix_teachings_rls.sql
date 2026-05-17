-- Fix RLS for teachings table
-- L'app utilise localStorage auth (pas Supabase native auth sessions),
-- donc on doit autoriser le rôle public (anon) à écrire dans teachings.

-- S'assurer que RLS est activé
ALTER TABLE public.teachings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public read access for active teachings" ON public.teachings;
DROP POLICY IF EXISTS "Allow public read access for active teachings" ON public.teachings;
DROP POLICY IF EXISTS "Allow service role full access to teachings" ON public.teachings;
DROP POLICY IF EXISTS "Service role can manage teachings" ON public.teachings;
DROP POLICY IF EXISTS "Allow all operations on teachings" ON public.teachings;

-- Politique unique : tout le monde peut tout faire sur teachings
-- (la sécurité est gérée au niveau applicatif via les rôles localStorage)
CREATE POLICY "teachings_all_operations"
ON public.teachings
FOR ALL
TO public
USING (true)
WITH CHECK (true);
