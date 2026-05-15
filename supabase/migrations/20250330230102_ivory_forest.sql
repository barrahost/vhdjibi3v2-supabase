/*
  # Remove RLS from Audio Storage

  1. Storage Configuration
    - Updates the audio-teachings bucket to be fully public
    - Disables RLS for this bucket
    - Removes all existing policies
    - Creates a single policy allowing all operations
*/

-- Update the audio-teachings bucket to be public
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;

-- Create a single policy allowing all operations
CREATE POLICY "Allow all operations on audio files"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'audio-teachings')
WITH CHECK (bucket_id = 'audio-teachings');