/*
  # Add photo_url column to souls table

  1. Schema Changes
    - Add `photo_url` column to `souls` table
    - Column type: TEXT (nullable)
    - Allows storing profile photo URLs for souls

  2. Purpose
    - Enable profile photo functionality for souls
    - Store URLs of uploaded photos in cloud storage
    - Improve visual identification of souls in the application
*/

-- Add photo_url column to souls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'souls' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.souls ADD COLUMN photo_url TEXT;
  END IF;
END $$;