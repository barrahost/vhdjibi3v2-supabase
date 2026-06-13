/*
  # Fix Audio Storage Policies

  1. Storage Configuration
    - Configures the audio-teachings bucket for public access
    - Sets up appropriate RLS policies for file management
  
  2. Security Policies
    - Allows authenticated users to upload files
    - Provides public read access to all audio files
    - Enables service role to manage all files
*/

-- Create or update the audio-teachings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;

-- Create policy for public read access
CREATE POLICY "Public read access for audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-teachings');

-- Create policy for authenticated users to upload files
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-teachings'
  AND (storage.extension(name) = 'mp3' OR storage.extension(name) = 'wav' OR storage.extension(name) = 'm4a')
);

-- Create policy for service role to manage all files
CREATE POLICY "Service role can manage audio files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'audio-teachings')
WITH CHECK (bucket_id = 'audio-teachings');