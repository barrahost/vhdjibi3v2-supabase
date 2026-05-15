/*
  # Ajout du stockage des photos de profil

  1. Modifications
    - Ajout de la colonne photo_url à la table users
    - Ajout de la politique de stockage pour les photos de profil

  2. Sécurité
    - Ajout des politiques RLS pour l'accès aux photos
    - Seuls les utilisateurs authentifiés peuvent accéder à leurs propres photos
*/

-- Ajout de la colonne photo_url à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url text;

-- Créer un bucket pour les photos de profil s'il n'existe pas
INSERT INTO storage.buckets (id, name)
VALUES ('profile_photos', 'Profile Photos')
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs de télécharger leurs photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de voir leurs photos
CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de supprimer leurs photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de mettre à jour leur photo_url
CREATE POLICY "Users can update their own photo_url"
ON users
FOR UPDATE
TO authenticated
USING (id::text = auth.uid())
WITH CHECK (id::text = auth.uid());