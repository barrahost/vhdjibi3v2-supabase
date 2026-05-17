-- Créer le bucket public_storage s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public_storage',
  'public_storage',
  true,
  209715200,  -- 200MB max
  ARRAY[
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/mp4', 'audio/x-m4a', 'audio/ogg',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 209715200;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all operations on public storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on audio files" ON storage.objects;

-- Politique unique : tout le monde peut lire et écrire dans public_storage
-- (l'app gère sa propre auth via JWT / localStorage)
CREATE POLICY "public_storage_all_operations"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'public_storage')
WITH CHECK (bucket_id = 'public_storage');
