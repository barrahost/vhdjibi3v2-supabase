import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

const R2_PUBLIC_URL  = 'https://pub-7b4d7eb30b5447a68ce0dc7d83ca47c5.r2.dev';
const CF_ACCOUNT_ID  = 'c082969c724cd3bcda269a40664dea26';
const R2_BUCKET      = 'bergerie-audio-archive';
// Token R2 avec permission Object Read & Write
const R2_TOKEN       = '000acbb87017b4457c3a5a51f2283839';
const R2_SECRET      = '10658197022d88ed6eb15241655eaf87d2f7325ca497e5d0e5bf5d04769e726f';

export class StorageService {
  private static readonly BUCKET_NAME = 'public_storage';
  private static readonly MAX_AUDIO_SIZE = 104857600; // 100MB
  private static readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  // â”€â”€ Upload vers R2 via AWS S3 Signature V4 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private static async uploadToR2(file: File, filePath: string): Promise<string> {
    const endpoint = `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${R2_BUCKET}/${filePath}`;

    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const region = 'auto';
    const service = 's3';

    const arrayBuffer = await file.arrayBuffer();

    // Hash du body
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const bodyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const contentType = file.type || 'application/octet-stream';

    // Headers canoniques
    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${CF_ACCOUNT_ID}.r2.cloudflarestorage.com\n` +
      `x-amz-content-sha256:${bodyHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      `/${R2_BUCKET}/${filePath}`,
      '',
      canonicalHeaders,
      signedHeaders,
      bodyHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const crHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
    const crHashHex = Array.from(new Uint8Array(crHash)).map(b => b.toString(16).padStart(2, '0')).join('');

    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, crHashHex].join('\n');

    // HMAC helper
    const hmac = async (key: ArrayBuffer, data: string): Promise<ArrayBuffer> => {
      const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
    };

    const kDate    = await hmac(new TextEncoder().encode('AWS4' + R2_SECRET), dateStamp);
    const kRegion  = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, 'aws4_request');
    const sigBytes = await hmac(kSigning, stringToSign);
    const signature = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_TOKEN}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const resp = await fetch(`${endpoint}/${R2_BUCKET}/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': authorization,
        'Content-Type': contentType,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': bodyHash,
      },
      body: arrayBuffer,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`R2 upload failed (${resp.status}): ${err}`);
    }

    return `${R2_PUBLIC_URL}/${filePath}`;
  }

  // â”€â”€ Supprimer depuis R2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private static async deleteFromR2(filePath: string): Promise<void> {
    const endpoint = `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const region = 'auto';
    const service = 's3';
    const bodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // hash vide

    const canonicalHeaders =
      `host:${CF_ACCOUNT_ID}.r2.cloudflarestorage.com\n` +
      `x-amz-content-sha256:${bodyHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = ['DELETE', `/${R2_BUCKET}/${filePath}`, '', canonicalHeaders, signedHeaders, bodyHash].join('\n');
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const crHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
    const crHashHex = Array.from(new Uint8Array(crHash)).map(b => b.toString(16).padStart(2, '0')).join('');
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, crHashHex].join('\n');

    const hmac = async (key: ArrayBuffer, data: string): Promise<ArrayBuffer> => {
      const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
    };
    const kDate    = await hmac(new TextEncoder().encode('AWS4' + R2_SECRET), dateStamp);
    const kRegion  = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, 'aws4_request');
    const sigBytes = await hmac(kSigning, stringToSign);
    const signature = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_TOKEN}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    await fetch(`${endpoint}/${R2_BUCKET}/${filePath}`, {
      method: 'DELETE',
      headers: { 'Authorization': authorization, 'x-amz-date': amzDate, 'x-amz-content-sha256': bodyHash },
    });
  }

  // â”€â”€ Photo de profil (Supabase Storage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    try {
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
        if (matches?.[1]) { const parts = matches[1].split('/'); parts.shift(); filePath = parts.join('/'); }
      } else { filePath = matches[1]; }
      if (!filePath) return;
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
    } catch { /* ignore */ }
  }

  // â”€â”€ Audio + Thumbnails â†’ R2 direct â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async uploadAudioFile(file: File): Promise<string> {
    try {
      if (!file) throw new Error('Le fichier est requis');
      const fileType = file.type.toLowerCase();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const isAudio = ['audio/mpeg','audio/wav','audio/mp4','audio/x-m4a','audio/x-wav','audio/mp3'].includes(fileType) || ['mp3','wav','m4a'].includes(fileExt);
      const isImage = ['image/jpeg','image/png','image/jpg'].includes(fileType) || ['jpg','jpeg','png'].includes(fileExt);
      if (!isAudio && !isImage) throw new Error('Format de fichier non supportÃ©');
      const maxSize = isImage ? this.MAX_IMAGE_SIZE : this.MAX_AUDIO_SIZE;
      if (file.size > maxSize) throw new Error(`Le fichier ne doit pas dÃ©passer ${maxSize / 1024 / 1024}MB`);
      const timestamp = Date.now();
      const churchId = getChurchId();
      const prefix = isImage ? `audio/${churchId}/thumbnails/` : `audio/${churchId}/files/`;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${prefix}${timestamp}-${safeName}`;
      return await this.uploadToR2(file, filePath);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Erreur lors du tÃ©lÃ©chargement du fichier audio');
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