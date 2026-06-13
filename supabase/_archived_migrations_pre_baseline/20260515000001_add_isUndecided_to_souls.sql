-- Add "isUndecided" column to souls table
-- This boolean column tracks whether a soul is still undecided (not yet committed)
-- Uses quoted camelCase to match the existing TypeScript query pattern

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'souls'
      AND column_name = 'isUndecided'
  ) THEN
    ALTER TABLE public.souls ADD COLUMN "isUndecided" boolean NOT NULL DEFAULT false;
  END IF;
END;
$$;
