/*
  # Audio Streaming Setup

  1. Tables
    - Creates audio_teachings table for storing teaching metadata
    - Stores title, description, speaker, category, tags, duration
    - Tracks file locations and thumbnails
    - Manages featured status and soft deletion
  
  2. Storage
    - Creates public bucket for audio files
    - Configures secure access policies
  
  3. Security
    - Enables RLS on all tables
    - Public read access for active teachings
    - Write access restricted to super admins
*/

-- Create audio_teachings table
CREATE TABLE IF NOT EXISTS public.audio_teachings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  speaker text NOT NULL,
  category text NOT NULL,
  tags text[],
  duration integer NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'))
);

-- Enable RLS
ALTER TABLE public.audio_teachings ENABLE ROW LEVEL SECURITY;

-- Create public read policy
CREATE POLICY "Public read access for active teachings"
ON public.audio_teachings
FOR SELECT
TO public
USING (status = 'active');

-- Create super admin write policy
CREATE POLICY "Super admins can manage teachings"
ON public.audio_teachings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'service_role'
  )
);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-teachings', 'Audio Teachings', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create public read policy for audio files
CREATE POLICY "Public read access for audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-teachings');

-- Create super admin write policy for audio files
CREATE POLICY "Super admins can manage audio files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'audio-teachings' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'service_role'
  )
)
WITH CHECK (
  bucket_id = 'audio-teachings' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'service_role'
  )
);