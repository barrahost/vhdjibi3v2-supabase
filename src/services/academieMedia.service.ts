const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/academie-media`;

export interface AcademieMediaObject {
  key: string;
  size: number;
  url: string;
}

async function callFunction(body: Record<string, unknown>): Promise<any> {
  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || 'Erreur du service de fichiers');
  return data;
}

/** Convertit un nom de classe ("Classe 1") en prefixe de dossier R2 ("audio/classe-1/"). */
export function classNameToPrefix(className: string): string {
  const slug = className
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '-');
  return `audio/${slug}/`;
}

export class AcademieMediaService {
  static async listFiles(prefix: string): Promise<AcademieMediaObject[]> {
    const data = await callFunction({ action: 'list', prefix });
    return data.objects || [];
  }

  /** Upload direct depuis le navigateur vers R2, avec suivi de progression (0-100). */
  static async uploadFile(file: File, r2Key: string, onProgress?: (pct: number) => void): Promise<{ r2Key: string; publicUrl: string }> {
    const { uploadUrl, publicUrl } = await callFunction({
      action: 'presign', filePath: r2Key, contentType: file.type || 'application/octet-stream',
    });

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Échec de l'upload (${xhr.status})`));
      xhr.onerror = () => reject(new Error('Échec de l\'upload — vérifiez votre connexion'));
      xhr.send(file);
    });

    return { r2Key, publicUrl };
  }
}

/** Nettoie un nom de fichier pour en faire une cle R2 sure (garde les accents, remplace les caracteres a risque). */
export function sanitizeFileName(name: string): string {
  return name.replace(/[?#%]/g, '_');
}

/** Extrait un nom lisible depuis une cle R2 (dernier segment, sans extension). */
export function friendlyNameFromKey(key: string): string {
  const base = key.split('/').pop() || key;
  return base.replace(/\.[a-zA-Z0-9]+$/, '');
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Lit la duree d'un fichier audio/video a partir de son URL (metadata seule, pas de telechargement complet). */
export function readMediaDuration(url: string, kind: 'audio' | 'video'): Promise<string | null> {
  return new Promise((resolve) => {
    const el = document.createElement(kind);
    el.preload = 'metadata';
    el.src = url;
    const cleanup = () => { el.src = ''; };
    el.onloadedmetadata = () => {
      const seconds = el.duration;
      cleanup();
      resolve(Number.isFinite(seconds) ? formatDuration(seconds) : null);
    };
    el.onerror = () => { cleanup(); resolve(null); };
    // Securite : ne pas bloquer indefiniment si le navigateur ne charge jamais les metadonnees
    setTimeout(() => resolve(null), 8000);
  });
}
