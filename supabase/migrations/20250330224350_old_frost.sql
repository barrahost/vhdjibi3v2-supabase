/*
  # Storage Configuration Update
  
  1. Changes
    - Removes audio_teachings table since we're using Firestore
    - Keeps storage bucket configuration for audio files
    - Maintains storage policies for secure access

  2. Storage Setup
    - Maintains 'audio-teachings' bucket for storing audio files
    - Keeps public read access for audio files
    - Preserves service role access for file management
*/

-- Drop the audio_teachings table and its policies
DROP TABLE IF EXISTS public.audio_teachings;

-- Keep storage bucket configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Recreate storage policies
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage audio files" ON storage.objects;

-- Create public read policy for audio files
CREATE POLICY "Public read access for audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-teachings');

-- Create service role write policy for audio files
CREATE POLICY "Service role can manage audio files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'audio-teachings')
WITH CHECK (bucket_id = 'audio-teachings');