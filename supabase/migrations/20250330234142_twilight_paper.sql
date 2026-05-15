/*
  # Audio Storage Configuration
  
  1. Storage Setup
    - Creates public bucket for audio files
    - Disables RLS for simpler access
*/

-- Create or update the audio-teachings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;