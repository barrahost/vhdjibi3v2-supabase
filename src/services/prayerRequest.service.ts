import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export const PRAYER_CATEGORIES = [
  'Déblocage Spirituel',
  'Déblocage Familial',
  'Déblocage Professionnel',
  'Déblocage Financier',
  'Déblocage Santé',
  'Autre',
] as const;

export type PrayerCategory = typeof PRAYER_CATEGORIES[number];

export interface PrayerRequest {
  id: string;
  churchId: string;
  category: PrayerCategory;
  subject: string;
  submittedAt: Date;
}

function mapRequest(r: any): PrayerRequest {
  return {
    id: r.id,
    churchId: r.church_id,
    category: r.category,
    subject: r.subject,
    submittedAt: new Date(r.submitted_at),
  };
}

export const PrayerRequestService = {
  // ── Public (SECURITY DEFINER — sans auth, anonyme) ──────────────────────

  async submitPrayerRequest(churchId: string, category: PrayerCategory, subject: string): Promise<void> {
    const { error } = await supabase.rpc('submit_prayer_request', {
      p_church_id: churchId,
      p_category: category,
      p_subject: subject,
    });
    if (error) throw new Error(error.message);
  },

  // ── Admin (auth requise) ────────────────────────────────────────────────

  async getAllRequests(): Promise<PrayerRequest[]> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('church_id', getChurchId())
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRequest);
  },

  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
  },
};
