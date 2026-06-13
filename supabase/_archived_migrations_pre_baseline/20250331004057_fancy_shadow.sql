/*
  # Storage Configuration for Audio Teachings

  1. Storage Setup
    - Creates public storage bucket for audio files
    - Configures allowed file types and size limits
  
  2. Configuration
    - Sets 100MB file size limit
    - Allows audio files (MP3, WAV, M4A)
    - Allows image files (JPEG, PNG) for thumbnails
*/

-- Create or update the audio-teachings bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-teachings',
  'Audio Teachings',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'audio/mpeg',
    'audio/wav', 
    'audio/x-m4a',
    'audio/mp3',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/wav',
    'audio/x-m4a', 
    'audio/mp3',
    'image/jpeg',
    'image/png'
  ];

-- Disable RLS on storage.objects since we're using Firestore for metadata
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;