import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

const R2_WORKER_URL = import.meta.env.VITE_R2_WORKER_URL as string;
const R2_WORKER_SECRET = import.meta.env.VITE_R2_WORKER_SECRET as string;

export class StorageService {
  private static readonly BUCKET_NAME = 'public_storage';
  private static readonly MAX_AUDIO_SIZE = 104857600; // 100MB
  private static readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  private static workerHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${R2_WORKER_SECRET}`,
      ...extra,
    };
  }

  // Upload via Cloudflare Worker (binding R2 natif, sans credentials dans le client)
  private static async uploadToR2(file: File, filePath: string): Promise<string> {
    const contentType = file.type || 'application/octet-stream';
    const resp = await fetch(R2_WORKER_URL, {
      method: 'PUT',
      headers: this.workerHeaders({ 'Content-Type': contentType, 'x-file-path': filePath }),
      body: await file.arrayBuffer(),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`R2 upload failed (${resp.status}): ${err}`);
    }
    const { url } = await resp.json() as { url: string };
    return url;
  }

  // Suppression via Cloudflare Worker
  private static async deleteFromR2(filePath: string): Promise<void> {
    const resp = await fetch(R2_WORKER_URL, {
      method: 'DELETE',
      headers: this.workerHeaders({ 'x-file-path': filePath }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`R2 delete failed (${resp.status}): ${err}`);
    }
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

  // -- Témoignage audio (enregistré depuis la page publique) -> R2 --
  /**
   * Envoi avec progression (pour l'afficher à la personne) et délai maximal : sur une connexion mobile lente,
   * on ne doit jamais rester bloqué sur « Envoi… » sans savoir ce qui se passe.
   */
  static uploadTestimonyAudio(audio: Blob, onProgress?: (percent: number) => void): Promise<string> {
    if (!audio || audio.size === 0) return Promise.reject(new Error("L'enregistrement est vide"));
    if (audio.size > 50 * 1024 * 1024) return Promise.reject(new Error("L'enregistrement ne doit pas dépasser 50 Mo"));
    if (!R2_WORKER_URL) return Promise.reject(new Error("le stockage audio n'est pas configuré sur le site (VITE_R2_WORKER_URL)"));
    const type = (audio.type || 'audio/webm').split(';')[0];
    const ext = type.includes('mp4') || type.includes('m4a') || type.includes('aac') ? 'm4a'
      : type.includes('mpeg') || type.includes('mp3') ? 'mp3'
      : type.includes('ogg') ? 'ogg'
      : type.includes('wav') ? 'wav'
      : 'webm';
    // Nom imprévisible : l'adresse du fichier ne se devine pas
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const filePath = `temoignages/${getChurchId()}/${new Date().toISOString().slice(0, 10)}-${id}.${ext}`;
    // 2 minutes, plus 1 minute par Mo : large pour une connexion lente, mais jamais infini
    const timeoutMs = 120_000 + Math.ceil(audio.size / (1024 * 1024)) * 60_000;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', R2_WORKER_URL);
      Object.entries(this.workerHeaders({ 'Content-Type': type, 'x-file-path': filePath })).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.timeout = timeoutMs;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`envoi de l'audio refusé (${xhr.status}) ${String(xhr.responseText || '').slice(0, 120)}`.trim()));
          return;
        }
        try {
          const { url } = JSON.parse(xhr.responseText) as { url: string };
          onProgress?.(100);
          resolve(url);
        } catch {
          reject(new Error("réponse inattendue du stockage audio"));
        }
      };
      xhr.onerror = () => reject(new Error("connexion au stockage audio impossible (réseau coupé ou service injoignable)"));
      xhr.ontimeout = () => reject(new Error("l'envoi de l'audio a pris trop de temps (connexion trop lente)"));
      xhr.send(audio);
    });
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
