-- Add source_collection column to interactions table
-- This column tracks whether the interaction is with a soul from 'souls' or 'evangelized_souls'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interactions' AND column_name = 'source_collection'
  ) THEN
    ALTER TABLE public.interactions
      ADD COLUMN source_collection TEXT DEFAULT 'souls'
        CHECK (source_collection IN ('souls', 'evangelized_souls'));
  END IF;
END $$;
