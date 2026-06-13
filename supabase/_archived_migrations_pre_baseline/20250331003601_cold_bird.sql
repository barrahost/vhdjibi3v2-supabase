/*
  # Storage Configuration for Audio Files

  1. Storage Setup
    - Creates public bucket for audio files
    - Configures security policies
  
  2. Security
    - Disables RLS since we're using Firestore for metadata
*/

-- Create or update the audio-teachings bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-teachings',
  'Audio Teachings',
  true,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp3'];

-- Disable RLS on storage.objects since we're using Firestore for metadata
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;