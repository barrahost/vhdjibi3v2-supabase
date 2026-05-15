/*
  # Audio Storage Configuration
  
  1. Storage Setup
    - Updates audio-teachings bucket to be public
    - Disables RLS for simpler access
*/

-- Update the audio-teachings bucket to be public
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;