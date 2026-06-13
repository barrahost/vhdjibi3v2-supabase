/*
  # Audio Storage Configuration

  1. Storage Setup
    - Creates public storage bucket for audio files
    - Configures bucket access and security policies
  
  2. Security Policies
    - Drops existing policies to avoid conflicts
    - Creates new policies for:
      - Public read access for audio files
      - Service role full access to manage files
*/

-- Create storage bucket for audio files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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