-- Supprimer toutes les politiques RLS existantes pour le bucket public_storage
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on audio files" ON storage.objects;

-- Créer une politique unique qui autorise TOUTES les opérations sur le bucket public_storage
CREATE POLICY "Allow all operations on public storage"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'public_storage')
WITH CHECK (bucket_id = 'public_storage');