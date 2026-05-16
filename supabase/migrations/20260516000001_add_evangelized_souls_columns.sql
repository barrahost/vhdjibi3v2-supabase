-- Add missing columns to evangelized_souls table
-- These columns are used by EvangelizedSoulForm.tsx

ALTER TABLE public.evangelized_souls
  ADD COLUMN IF NOT EXISTS attended_community    text,
  ADD COLUMN IF NOT EXISTS gave_life_to_jesus    text CHECK (gave_life_to_jesus IN ('yes', 'no', 'not_yet')),
  ADD COLUMN IF NOT EXISTS planned_service       text,
  ADD COLUMN IF NOT EXISTS prayer_topics         text,
  ADD COLUMN IF NOT EXISTS interviewer_name      text,
  ADD COLUMN IF NOT EXISTS evangelization_location text;

-- Also ensure other expected columns exist
ALTER TABLE public.evangelized_souls
  ADD COLUMN IF NOT EXISTS nickname              text,
  ADD COLUMN IF NOT EXISTS notes                 text,
  ADD COLUMN IF NOT EXISTS source_type           text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id             text,
  ADD COLUMN IF NOT EXISTS original_soul_id      uuid REFERENCES public.souls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS imported_to_soul_id   uuid REFERENCES public.souls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS imported_from_evangelized_id uuid,
  ADD COLUMN IF NOT EXISTS imported_from_evangelist_id  uuid,
  ADD COLUMN IF NOT EXISTS imported_at           timestamptz,
  ADD COLUMN IF NOT EXISTS imported_by           uuid;
