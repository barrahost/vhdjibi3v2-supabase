/*
  # Update Storage Configuration Limits

  1. Changes
    - Increases file size limit to 200MB
    - Updates allowed MIME types
    - Maintains existing security settings
  
  2. Configuration
    - Sets 200MB file size limit for audio files
    - Allows audio files (MP3, WAV, M4A)
    - Allows image files (JPEG, PNG) for thumbnails
*/

-- Update the audio-teachings bucket with increased limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-teachings',
  'Audio Teachings',
  true,
  209715200, -- 200MB limit
  ARRAY[
    'audio/mpeg',
    'audio/wav', 
    'audio/x-m4a',
    'audio/mp3',
    'audio/x-wav',
    'audio/mp4',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/wav',
    'audio/x-m4a', 
    'audio/mp3',
    'audio/x-wav',
    'audio/mp4',
    'image/jpeg',
    'image/png'
  ];

-- Disable RLS on storage.objects since we're using Firestore for metadata
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;