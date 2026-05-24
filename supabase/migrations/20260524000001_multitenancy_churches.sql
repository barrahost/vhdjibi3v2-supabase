-- ============================================================
-- MIGRATION : Multi-tenancy — Table churches + church_id
-- ============================================================

-- 1. Table churches
CREATE TABLE IF NOT EXISTS public.churches (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#00665C',
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "churches_all_operations"
  ON public.churches FOR ALL TO public
  USING (true) WITH CHECK (true);

-- 2. Insérer AGC comme première église
INSERT INTO public.churches (id, name, slug, status)
VALUES ('agc', 'Assemblée Grâce Confondante', 'agc', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Ajouter church_id à toutes les tables existantes
--    DEFAULT 'agc' pour que les données existantes soient correctement rattachées

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.souls
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.evangelized_souls
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.servants
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.service_families
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.teachings
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.audio_categories
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc'
  REFERENCES public.churches(id);

-- Gérer les tables qui peuvent ne pas exister encore
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN
    ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc' REFERENCES public.churches(id);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sms_templates') THEN
    ALTER TABLE public.sms_templates ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc' REFERENCES public.churches(id);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sms_categories') THEN
    ALTER TABLE public.sms_categories ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc' REFERENCES public.churches(id);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'birthdays') THEN
    ALTER TABLE public.birthdays ADD COLUMN IF NOT EXISTS church_id TEXT DEFAULT 'agc' REFERENCES public.churches(id);
  END IF;
END $$;

-- 4. Mettre à jour les données existantes (NULL → 'agc')
UPDATE public.admins SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.users SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.souls SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.evangelized_souls SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.servants SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.departments SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.service_families SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.interactions SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.attendances SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.teachings SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.audio_categories SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.bug_reports SET church_id = 'agc' WHERE church_id IS NULL;
UPDATE public.app_settings SET church_id = 'agc' WHERE church_id IS NULL;

