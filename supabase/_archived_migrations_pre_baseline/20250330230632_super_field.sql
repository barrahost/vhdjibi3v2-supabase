/*
  # Storage Access Configuration Fix
  
  1. Updates
    - Disables RLS on storage.objects
    - Makes storage bucket public
    - Removes all existing policies
    - Allows unrestricted access
*/

-- Drop any existing policies
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their own files" ON storage.objects;

-- Update the storage bucket to be public
INSERT INTO storage.buckets (id, name, public)
VALUES ('public_storage', 'Public Storage', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;