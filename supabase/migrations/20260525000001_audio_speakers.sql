-- ============================================================
-- MIGRATION : Orateurs (audio_speakers) — liste déroulante configurable
-- À coller dans Supabase > SQL Editor > New query > Run (F5)
-- ============================================================

-- 1. Table audio_speakers (calquée sur audio_categories)
CREATE TABLE IF NOT EXISTS public.audio_speakers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   text DEFAULT 'bergerie' REFERENCES public.churches(id),
  name        text NOT NULL,
  description text,
  status      text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Unicité du nom par église, insensible à la casse (empêche les doublons d'orthographe)
CREATE UNIQUE INDEX IF NOT EXISTS audio_speakers_church_name_key
  ON public.audio_speakers (church_id, lower(name));

-- 2. RLS — politique permissive (comme les autres tables du projet)
ALTER TABLE public.audio_speakers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audio_speakers_all_operations" ON public.audio_speakers;
CREATE POLICY "audio_speakers_all_operations"
  ON public.audio_speakers FOR ALL TO public
  USING (true) WITH CHECK (true);

-- 3. Importer les orateurs déjà saisis dans les audios existants
--    (les variantes de casse d'un même nom sont fusionnées via ON CONFLICT)
INSERT INTO public.audio_speakers (church_id, name, status)
SELECT DISTINCT COALESCE(church_id, 'bergerie'), trim(speaker), 'active'
FROM public.teachings
WHERE speaker IS NOT NULL AND trim(speaker) <> ''
ON CONFLICT (church_id, lower(name)) DO NOTHING;
