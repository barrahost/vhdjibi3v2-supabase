/*
  # Fix Audio RLS Policies

  1. Changes
    - Fixes RLS policies for audio_teachings table
    - Adds proper policies for storage bucket
    - Ensures service role has full access
    - Allows public read access for active teachings

  2. Security
    - Enables RLS on both tables
    - Configures granular access control
    - Prevents unauthorized modifications
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for active teachings" ON public.audio_teachings;
DROP POLICY IF EXISTS "Service role can manage teachings" ON public.audio_teachings;
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage audio files" ON storage.objects;

-- Enable RLS
ALTER TABLE public.audio_teachings ENABLE ROW LEVEL SECURITY;

-- Create policies for audio_teachings table
CREATE POLICY "Allow public read access for active teachings"
ON public.audio_teachings
FOR SELECT
TO public
USING (status = 'active');

CREATE POLICY "Allow service role full access to teachings"
ON public.audio_teachings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for storage.objects
CREATE POLICY "Allow public read access to audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-teachings');

CREATE POLICY "Allow service role full access to audio files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'audio-teachings')
WITH CHECK (bucket_id = 'audio-teachings');