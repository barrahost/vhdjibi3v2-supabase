import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { StorageService } from './storage.service';

export const TESTIMONY_CATEGORIES = [
  'Guérison',
  'Délivrance',
  'Famille',
  'Travail & études',
  'Finances',
  'Salut & conversion',
  'Prière exaucée',
  'Autre',
] as const;

export type TestimonyCategory = typeof TESTIMONY_CATEGORIES[number];

export const TESTIMONY_STATUSES = ['nouveau', 'a_partager', 'partage', 'archive'] as const;
export type TestimonyStatus = typeof TESTIMONY_STATUSES[number];

export const TESTIMONY_STATUS_LABELS: Record<TestimonyStatus, string> = {
  nouveau: 'Nouveau',
  a_partager: 'À partager',
  partage: 'Partagé',
  archive: 'Archivé',
};

export const TESTIMONY_CONTENT_MAX = 5000;

export interface Testimony {
  id: string;
  churchId: string;
  category: TestimonyCategory;
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  fullName?: string;
  phone?: string;
  shareConsent: boolean;
  /** Identifiée auprès des pasteurs, mais son nom ne doit jamais être cité en public. */
  publicAnonymous: boolean;
  status: TestimonyStatus;
  submittedAt: Date;
}

function mapTestimony(r: any): Testimony {
  return {
    id: r.id,
    churchId: r.church_id,
    category: r.category,
    content: r.content || undefined,
    audioUrl: r.audio_url || undefined,
    audioDuration: r.audio_duration ?? undefined,
    fullName: r.full_name || undefined,
    phone: r.phone || undefined,
    shareConsent: !!r.share_consent,
    publicAnonymous: !!r.public_anonymous,
    status: r.status || 'nouveau',
    submittedAt: new Date(r.submitted_at),
  };
}

/** « 1 min 05 s » */
export function formatDuration(seconds?: number): string {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

export const TestimonyService = {
  // ── Public (sans compte) ────────────────────────────────────────────────

  /**
   * Dépose un témoignage : l'audio éventuel part d'abord sur R2, puis le témoignage est enregistré avec son
   * adresse. Si l'enregistrement échoue ensuite, le fichier audio est retiré pour ne pas laisser d'orphelin.
   */
  async submit(input: {
    category: TestimonyCategory;
    content: string;
    audio?: { blob: Blob; duration: number } | null;
    contact: { fullName: string; phone: string };
    /** Le nom ne doit jamais être cité en public (les pasteurs le connaissent). */
    publicAnonymous: boolean;
    shareConsent: boolean;
    /** Progression de l'envoi de l'audio, en %. */
    onProgress?: (percent: number) => void;
  }): Promise<void> {
    let audioUrl: string | null = null;
    if (input.audio) audioUrl = await StorageService.uploadTestimonyAudio(input.audio.blob, input.onProgress);
    const { error } = await supabase.rpc('submit_testimony', {
      p_church_id: getChurchId(),
      p_category: input.category,
      p_content: input.content.trim() || null,
      p_audio_url: audioUrl,
      p_audio_duration: input.audio ? Math.round(input.audio.duration) : null,
      p_full_name: input.contact.fullName,
      p_phone: input.contact.phone,
      p_share_consent: input.shareConsent,
      p_public_anonymous: input.publicAnonymous,
    });
    if (error) {
      if (audioUrl) await StorageService.deleteAudioFile(audioUrl);
      // La base n'a pas encore la nouvelle version (script supabase_testimonies_identite.sql non exécuté)
      if (error.code === 'PGRST202') throw new Error('le site est en cours de mise à jour, réessaie dans quelques minutes');
      throw new Error(error.message);
    }
  },

  // ── Gestion (permission « Témoignages ») ───────────────────────────────

  async getAll(): Promise<Testimony[]> {
    const { data, error } = await supabase
      .from('testimonies')
      .select('*')
      .eq('church_id', getChurchId())
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapTestimony);
  },

  async updateStatus(id: string, status: TestimonyStatus): Promise<void> {
    const { data, error } = await supabase
      .from('testimonies')
      .update({ status })
      .eq('id', id)
      .eq('church_id', getChurchId())
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Modification refusée par la base de données');
  },

  /** Supprime le témoignage et son fichier audio sur R2. */
  async remove(testimony: Testimony): Promise<void> {
    const { data, error } = await supabase
      .from('testimonies')
      .delete()
      .eq('id', testimony.id)
      .eq('church_id', getChurchId())
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Suppression refusée par la base de données');
    if (testimony.audioUrl) await StorageService.deleteAudioFile(testimony.audioUrl);
  },
};
