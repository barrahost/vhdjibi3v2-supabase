/*
  # Unified Storage Configuration
  
  1. Storage Setup
    - Standardizes all storage to use a single bucket: public_storage
    - Maintains backward compatibility with old buckets
    - Configures appropriate file size limits
  
  2. Security
    - Disables RLS for simpler access
    - Allows public access to all files
*/

-- Create or update the public_storage bucket (main bucket)
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

-- Create storage-photo bucket if it doesn't exist (for backward compatibility)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'storage-photo',
  'Storage Photo (Deprecated)',
  true,
  5242880 -- 5MB limit
)
ON CONFLICT (id) DO NOTHING;

-- Create audio-teachings bucket if it doesn't exist (for backward compatibility)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'audio-teachings',
  'Audio Teachings (Deprecated)',
  true,
  104857600 -- 100MB limit
)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on storage.objects for simpler access
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;