/*
  # Configure storage for profile photos
  
  1. Storage Configuration
    - Create storage bucket for profile photos
    - Enable RLS on storage objects
  
  2. Security Policies
    - Allow users to manage their own photos
    - Allow public read access to profile photos
*/

-- Create policy to allow users to manage their own photos
CREATE POLICY "Users can manage their own photos"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policy to allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');