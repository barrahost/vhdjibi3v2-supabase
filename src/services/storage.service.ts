import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export class StorageService {
  private static readonly BUCKET_NAME = 'public_storage'; // Using existing Public Storage bucket
  private static readonly MAX_AUDIO_SIZE = 104857600; // 100MB (matches Supabase limit)
  private static readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024;   // 2MB

  static async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    try {
      // Vérifier que l'utilisateur est connecté via localStorage
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        throw new Error('Vous devez être connecté pour uploader une photo');
      }

      if (!userId || !file) {
        throw new Error('ID utilisateur et fichier sont requis');
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La taille de l\'image ne doit pas dépasser 5MB');
      }

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const filePath = `profiles/${userId}/photo-${timestamp}.${fileExt}`;

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Erreur lors du téléchargement de la photo');
      }

      // Générer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Impossible de générer l\'URL publique');
      }

      // Ajouter un paramètre de cache-busting
      const finalUrl = `${publicUrl}?t=${timestamp}`;
      
      console.log('Generated photo URL:', finalUrl);

      return finalUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement de la photo';
      toast.error(errorMessage);
      throw error instanceof Error ? error : new Error('Erreur lors du téléchargement de la photo');
    }
  }

  static async deleteProfilePhoto(photoPath: string): Promise<void> {
    try {
      console.log('Attempting to delete photo:', photoPath);
      
      if (!photoPath) {
        console.warn('No photo path provided for deletion');
        return;
      }

      try {
        // Extract the file path from the URL
        const url = new URL(photoPath);
        const pathname = url.pathname;
        
        // Extract path from URL, handling different path formats
        let filePath;
        
        // Try to match the public_storage pattern first
        let matches = pathname.match(/\/public_storage\/(.+?)(?:\?|$)/);
        
        if (!matches || !matches[1]) {
          // Try alternative pattern for older URLs
          matches = pathname.match(/\/storage\/v1\/object\/public\/(.+?)(?:\?|$)/);
          
          if (!matches || !matches[1]) {
            console.error('Could not extract file path from URL:', photoPath);
            throw new Error('Invalid file path format');
          }
          
          // For older URLs, the bucket name is included in the path
          const parts = matches[1].split('/');
          if (parts.length > 1) {
            // Remove bucket name from path
            parts.shift();
            filePath = parts.join('/');
          } else {
            filePath = matches[1];
          }
        } else {
          filePath = matches[1];
        }
        
        console.log('Extracted file path:', filePath);
        
        // Attempt to delete the file
        const { error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([filePath]);
        
        if (error) {
          console.error('Storage delete error:', error);
          throw error;
        }
        
        console.log('File deleted successfully');
      } catch (error) {
        console.error('Error processing photo URL:', error);
        throw new Error('Failed to process photo URL for deletion');
      }
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      throw new Error('Erreur lors de la suppression de la photo');
    }
  }

  static async uploadAudioFile(file: File): Promise<string> {
    try {
      // Vérifier que l'utilisateur est connecté via localStorage
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        throw new Error('Vous devez être connecté pour uploader un fichier');
      }

      if (!file) {
        throw new Error('Le fichier est requis');
      }

      // Check file size before attempting upload
      if (file.size > this.MAX_AUDIO_SIZE) {
        const sizeInMB = this.MAX_AUDIO_SIZE / (1024 * 1024);
        throw new Error(`Le fichier ne doit pas dépasser ${sizeInMB}MB`);
      }

      // Vérifier le type de fichier selon le type MIME ou l'extension
      const fileType = file.type.toLowerCase();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      const validAudioTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'audio/x-m4a',
        'audio/x-wav',
        'audio/mp3'
      ];
      
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      
      const isAudio = validAudioTypes.includes(fileType) || 
        (fileExtension && ['mp3', 'wav', 'm4a'].includes(fileExtension));
      
      const isImageFile = validImageTypes.includes(fileType) ||
        (fileExtension && ['jpg', 'jpeg', 'png'].includes(fileExtension));
      
      if (!isAudio && !isImageFile) {
        throw new Error('Format de fichier non supporté');
      }

      // Check file size based on type
      const maxSize = isImageFile ? this.MAX_IMAGE_SIZE : this.MAX_AUDIO_SIZE;
      if (file.size > maxSize) {
        const sizeInMB = maxSize / (1024 * 1024);
        throw new Error(`Le fichier ne doit pas dépasser ${sizeInMB}MB`);
      }

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop() || 'mp3';
      const timestamp = Date.now();
      const prefix = isImageFile ? 'audio/thumbnails/' : 'audio/files/';
      const filePath = `${prefix}${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Erreur lors du téléchargement du fichier audio');
      }

      // Générer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Impossible de générer l\'URL publique');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading audio file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement du fichier audio';
      toast.error(errorMessage);
      throw error instanceof Error ? error : new Error('Erreur lors du téléchargement du fichier audio');
    }
  }

  static async deleteAudioFile(filePath: string): Promise<void> {
    try {
      const url = new URL(filePath);
      // Extract path from URL
      const path = url.pathname.split('/public_storage/').pop();

      if (!path) {
        throw new Error('Chemin de fichier invalide');
      }

      console.log('Deleting file:', path);

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Storage delete error:', error);
        throw error;
      }

      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting audio file:', error);
      throw new Error('Erreur lors de la suppression du fichier audio');
    }
  }
}