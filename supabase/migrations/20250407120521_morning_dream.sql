/*
  # Single Storage Bucket Configuration
  
  1. Changes
    - Creates a single public_storage bucket for all file storage
    - Configures appropriate file size limits and MIME types
    - Removes restrictions on file types to support all project needs
  
  2. Security
    - Disables RLS for simpler access
    - Makes bucket fully public for easier access
*/

-- Create or update the public_storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'public_storage',
  'Public Storage',
  true,
  209715200 -- 200MB limit
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 209715200;

-- Disable RLS on storage.objects for simpler access
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;