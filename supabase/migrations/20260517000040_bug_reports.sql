-- Table pour les signalements de bugs
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url    TEXT,
  user_id     TEXT,
  user_name   TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Politique : tout le monde peut insérer (signaler un bug)
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bug_reports_insert"
ON public.bug_reports FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "bug_reports_select"
ON public.bug_reports FOR SELECT TO public USING (true);

CREATE POLICY "bug_reports_update"
ON public.bug_reports FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "bug_reports_delete"
ON public.bug_reports FOR DELETE TO public USING (true);
