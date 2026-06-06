import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

const R2_BASE_URL = 'https://pub-7b4d7eb30b5447a68ce0dc7d83ca47c5.r2.dev';
const SUPABASE_URL = 'https://mowsaahfkkygveqhkvup.supabase.co';

export class StorageService {
  private static readonly BUCKET_NAME = 'public_storage';
  private static readonly MAX_AUDIO_SIZE = 104857600; // 100MB
  private static readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  // â”€â”€ Upload vers R2 via Edge Function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private static async uploadToR2(file: File, filePath: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', filePath);

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/upload-to-r2`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Erreur upload R2: ${err}`);
    }

    const { url } = await resp.json();
    return url;
  }

  // â”€â”€ Supprimer depuis R2 via Edge Function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private static async deleteFromR2(filePath: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    await fetch(`${SUPABASE_URL}/functions/v1/upload-to-r2`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path: filePath }),
    });
  }

  // â”€â”€ Photo de profil (reste sur Supabase Storage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) throw new Error('Vous devez Ãªtre connectÃ© pour uploader une photo');
      if (!userId || !file) throw new Error('ID utilisateur et fichier sont requis');
      if (!file.type.startsWith('image/')) throw new Error('Le fichier doit Ãªtre une image');
      if (file.size > 5 * 1024 * 1024) throw new Error("La taille de l'image ne doit pas dÃ©passer 5MB");

      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const churchId = getChurchId();
      const filePath = `profiles/${churchId}/${userId}/photo-${timestamp}.${fileExt}`;

      const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) throw new Error('Erreur lors du tÃ©lÃ©chargement de la photo');

      const { data: { publicUrl } } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);
      return `${publicUrl}?t=${timestamp}`;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Erreur lors du tÃ©lÃ©chargement de la photo');
    }
  }

  static async deleteProfilePhoto(photoPath: string): Promise<void> {
    try {
      if (!photoPath) return;
      const url = new URL(photoPath);
      const pathname = url.pathname;
      let filePath: string | undefined;
      let matches = pathname.match(/\/public_storage\/(.+?)(?:\?|$)/);
      if (!matches?.[1]) {
        matches = pathname.match(/\/storage\/v1\/object\/public\/(.+?)(?:\?|$)/);
        if (matches?.[1]) {
          const parts = matches[1].split('/');
          parts.shift();
          filePath = parts.join('/');
        }
      } else {
        filePath = matches[1];
      }
      if (!filePath) return;
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
    } catch (error) {
      throw new Error('Erreur lors de la suppression de la photo');
    }
  }

  // â”€â”€ Audio + Thumbnails â†’ R2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async uploadAudioFile(file: File): Promise<string> {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) throw new Error('Vous devez Ãªtre connectÃ© pour uploader un fichier');
      if (!file) throw new Error('Le fichier est requis');

      const fileType = file.type.toLowerCase();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';

      const isAudio = ['audio/mpeg','audio/wav','audio/mp4','audio/x-m4a','audio/x-wav','audio/mp3'].includes(fileType)
        || ['mp3','wav','m4a'].includes(fileExt);
      const isImage = ['image/jpeg','image/png','image/jpg'].includes(fileType)
        || ['jpg','jpeg','png'].includes(fileExt);

      if (!isAudio && !isImage) throw new Error('Format de fichier non supportÃ©');

      const maxSize = isImage ? this.MAX_IMAGE_SIZE : this.MAX_AUDIO_SIZE;
      if (file.size > maxSize) throw new Error(`Le fichier ne doit pas dÃ©passer ${maxSize / 1024 / 1024}MB`);

      const timestamp = Date.now();
      const churchId = getChurchId();
      const prefix = isImage ? `audio/${churchId}/thumbnails/` : `audio/${churchId}/files/`;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${prefix}${timestamp}-${safeName}`;

      // Upload vers R2
      const url = await this.uploadToR2(file, filePath);
      return url;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Erreur lors du tÃ©lÃ©chargement du fichier audio');
    }
  }

  static async deleteAudioFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) return;

      // Extraire le chemin depuis l'URL (R2 ou Supabase)
      let filePath: string | null = null;

      if (fileUrl.includes('r2.dev')) {
        // URL R2: https://pub-xxx.r2.dev/audio/bergerie/files/NOM.mp3
        const url = new URL(fileUrl);
        filePath = url.pathname.replace(/^\//, ''); // retirer le / initial
        await this.deleteFromR2(filePath);
      } else if (fileUrl.includes('supabase.co')) {
        // Ancienne URL Supabase (ne devrait plus arriver)
        const url = new URL(fileUrl);
        const path = url.pathname.split('/public_storage/').pop();
        if (path) await supabase.storage.from(this.BUCKET_NAME).remove([path]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Ne pas throw - la suppression du fichier ne doit pas bloquer la suppression en DB
    }
  }
}