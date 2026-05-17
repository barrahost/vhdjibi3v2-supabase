-- Ajoute les colonnes de snapshot pour conserver les noms même après suppression
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS soul_snapshot_name TEXT,
  ADD COLUMN IF NOT EXISTS actor_snapshot_name TEXT;

-- Backfill depuis souls
UPDATE public.interactions i
SET soul_snapshot_name = s.full_name
FROM public.souls s
WHERE i.soul_id = s.id AND i.soul_snapshot_name IS NULL;

-- Backfill depuis evangelized_souls
UPDATE public.interactions i
SET soul_snapshot_name = es.full_name
FROM public.evangelized_souls es
WHERE i.soul_id = es.id AND i.soul_snapshot_name IS NULL;

-- Backfill actor depuis users
UPDATE public.interactions i
SET actor_snapshot_name = u.full_name
FROM public.users u
WHERE i.shepherd_id = u.id AND i.actor_snapshot_name IS NULL;
