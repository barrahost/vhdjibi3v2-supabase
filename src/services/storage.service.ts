import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export class StorageService {
  private static readonly BUCKET_NAME = 'public_storage';
  private static readonly MAX_AUDIO_SIZE = 104857600; // 100MB
  private static readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  // Upload vers R2 : obtient une presigned URL depuis l'edge function, puis PUT direct vers R2
  private static async uploadToR2(file: File, filePath: string): Promise<string> {
    const contentType = file.type || 'application/octet-stream';

    const { data, error } = await supabase.functions.invoke('r2-storage', {
      body: { action: 'presign', filePath, contentType },
    });
    if (error) throw new Error(`r2-storage presign error: ${error.message}`);

    const { uploadUrl, publicUrl } = data as { uploadUrl: string; publicUrl: string };

    const resp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: await file.arrayBuffer(),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`R2 upload failed (${resp.status}): ${err}`);
    }

    return publicUrl;
  }

  // Suppression via l'edge function (signature cote serveur)
  private static async deleteFromR2(filePath: string): Promise<void> {
    const { error } = await supabase.functions.invoke('r2-storage', {
      body: { action: 'delete', filePath },
    });
    if (error) throw new Error(`r2-storage delete error: ${error.message}`);
  }

  // -- Photo de profil (Supabase Storage) --
  static async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    try {
      if (!userId || !file) throw new Error('ID utilisateur et fichier sont requis');
      if (!file.type.startsWith('image/')) throw new Error('Le fichier doit etre une image');
      if (file.size > 5 * 1024 * 1024) throw new Error("La taille de l'image ne doit pas depasser 5MB");
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const churchId = getChurchId();
      const filePath = `profiles/${churchId}/${userId}/photo-${timestamp}.${fileExt}`;
      const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) throw new Error('Erreur lors du telechargement de la photo');
      const { data: { publicUrl } } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);
      return `${publicUrl}?t=${timestamp}`;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Erreur lors du telechargement de la photo');
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
        if (matches?.[1]) { const parts = matches[1].split('/'); parts.shift(); filePath = parts.join('/'); }
      } else { filePath = matches[1]; }
      if (!filePath) return;
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
    } catch { /* ignore */ }
  }

  // -- Audio + Thumbnails -> R2 --
  static async uploadAudioFile(file: File): Promise<string> {
    try {
      if (!file) throw new Error('Le fichier est requis');
      const fileType = file.type.toLowerCase();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const isAudio = ['audio/mpeg','audio/wav','audio/mp4','audio/x-m4a','audio/x-wav','audio/mp3'].includes(fileType) || ['mp3','wav','m4a'].includes(fileExt);
      const isImage = ['image/jpeg','image/png','image/jpg'].includes(fileType) || ['jpg','jpeg','png'].includes(fileExt);
      if (!isAudio && !isImage) throw new Error('Format de fichier non supporte');
      const maxSize = isImage ? this.MAX_IMAGE_SIZE : this.MAX_AUDIO_SIZE;
      if (file.size > maxSize) throw new Error(`Le fichier ne doit pas depasser ${maxSize / 1024 / 1024}MB`);
      const timestamp = Date.now();
      const churchId = getChurchId();
      const prefix = isImage ? `audio/${churchId}/thumbnails/` : `audio/${churchId}/files/`;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${prefix}${timestamp}-${safeName}`;
      return await this.uploadToR2(file, filePath);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Erreur lors du telechargement du fichier audio');
    }
  }

  static async deleteAudioFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) return;
      if (fileUrl.includes('r2.dev')) {
        const url = new URL(fileUrl);
        const filePath = url.pathname.replace(/^\//, '');
        await this.deleteFromR2(filePath);
      } else if (fileUrl.includes('supabase.co')) {
        const url = new URL(fileUrl);
        const path = url.pathname.split('/public_storage/').pop();
        if (path) await supabase.storage.from(this.BUCKET_NAME).remove([path]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
