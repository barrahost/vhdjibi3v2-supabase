/*
  # Audio Teachings Setup

  1. Tables
    - Creates audio_teachings table for storing teaching metadata
    - Configures columns for title, description, speaker, etc.
  
  2. Security
    - Enables Row Level Security (RLS)
    - Creates policies for:
      - Public read access to active teachings
      - Service role full access
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
  created_by uuid,
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

-- Create service role write policy
CREATE POLICY "Service role can manage teachings"
ON public.audio_teachings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

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

-- Create service role write policy for audio files
CREATE POLICY "Service role can manage audio files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'audio-teachings')
WITH CHECK (bucket_id = 'audio-teachings');