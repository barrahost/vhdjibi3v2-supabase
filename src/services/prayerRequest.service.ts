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

export const PRAYER_STATUSES = ['nouveau', 'en_cours', 'exauce'] as const;
export type PrayerStatus = typeof PRAYER_STATUSES[number];

export interface PrayerRequest {
  id: string;
  churchId: string;
  category: PrayerCategory;
  subject: string;
  status: PrayerStatus;
  fullName?: string;
  phone?: string;
  submittedAt: Date;
}

function mapRequest(r: any): PrayerRequest {
  return {
    id: r.id,
    churchId: r.church_id,
    category: r.category,
    subject: r.subject,
    status: r.status || 'nouveau',
    fullName: r.full_name || undefined,
    phone: r.phone || undefined,
    submittedAt: new Date(r.submitted_at),
  };
}

export const PrayerRequestService = {
  // ── Public (SECURITY DEFINER — sans auth, anonyme) ──────────────────────

  async submitPrayerRequest(
    churchId: string,
    category: PrayerCategory,
    subject: string,
    contact?: { fullName: string; phone: string }
  ): Promise<void> {
    const { error } = await supabase.rpc('submit_prayer_request', {
      p_church_id: churchId,
      p_category: category,
      p_subject: subject,
      p_full_name: contact?.fullName ?? null,
      p_phone: contact?.phone ?? null,
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

  async updateStatus(id: string, status: PrayerStatus): Promise<void> {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ status })
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
  },
};
