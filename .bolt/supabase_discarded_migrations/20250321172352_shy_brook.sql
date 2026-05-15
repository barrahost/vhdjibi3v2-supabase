/*
  # Storage Configuration for User Profile Photos

  1. Storage Setup
    - Creates a bucket named 'storage-photo' for storing user profile photos
    - Configures public access for the bucket
  
  2. Security
    - Enables Row Level Security (RLS) on storage objects
    - Creates policies for:
      - Authenticated users to manage their own photos
      - Public read access for all photos
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('storage-photo', 'User Profile Photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow users to manage their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create policy for users to manage their own photos
CREATE POLICY "Allow users to manage their own files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'storage-photo' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'storage-photo' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for public read access
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'storage-photo');