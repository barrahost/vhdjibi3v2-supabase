import type { ServiceFamily, Soul } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export class FamilyLeaderService {
  /** Trouve la famille dont le user est responsable (via leader_id). */
  static async getFamilyByLeaderId(userId: string): Promise<ServiceFamily | null> {
    const { data, error } = await supabase
      .from('service_families')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('leader_id', userId)
      .limit(1)
      .single();
    if (error || !data) return null;
    return {
      ...data,
      id: data.id,
      leaderId: data.leader_id ?? undefined,
      shepherdIds: data.shepherd_ids ?? [],
    } as ServiceFamily;
  }

  /** Liste les âmes assignées à une famille. */
  static async getSoulsByFamilyId(familyId: string): Promise<Soul[]> {
    const { data, error } = await supabase
      .from('souls')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('service_family_id', familyId);
    if (error || !data) return [];
    return data.map((row: any) => ({
      ...row,
      fullName: row.fullName || row.full_name || '',
      phone: row.phone || '',
      location: row.location || '',
      gender: row.gender || 'male',
      nickname: row.nickname || '',
      isUndecided: row.isUndecided ?? row.is_undecided ?? false,
      shepherdId: row.shepherdId || row.shepherd_id || undefined,
      serviceFamilyId: row.serviceFamilyId || row.service_family_id || undefined,
      originSource: row.originSource || row.origin_source || undefined,
      status: row.status || 'active',
      photoURL: row.photoURL || row.photo_url || undefined,
      spiritualProfile: row.spiritualProfile || row.spiritual_profile || undefined,
      firstVisitDate: row.firstVisitDate
        ? new Date(row.firstVisitDate)
        : row.first_visit_date
        ? new Date(row.first_visit_date)
        : undefined,
    } as Soul));
  }

  /** Met à jour le berger assigné à une âme. */
  static async assignShepherdToSoul(soulId: string, shepherdId: string | null) {
    await supabase.from('souls').update({
      shepherd_id: shepherdId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', soulId);
  }

  /** Signale un membre comme indécis : il quitte la famille (et son berger) et
   *  retourne dans le circuit des âmes indécises, suivi par l'équipe ADN. */
  static async markSoulUndecided(soulId: string) {
    const { error } = await supabase.from('souls').update({
      is_undecided: true,
      shepherd_id: null,
      service_family_id: null,
      updated_at: new Date().toISOString(),
    }).eq('id', soulId);
    if (error) throw error;
  }

  /** Récupère les bergers de la famille.
   *  Priorité : shepherd_ids sur la famille. Fallback : bergers déduits des âmes assignées. */
  static async getShepherdsOfFamily(shepherdIds: string[] = [], familyId?: string): Promise<{ id: string; fullName: string; soulCount: number }[]> {
    let ids = [...shepherdIds];

    // Fallback : déduire depuis les âmes si shepherd_ids est vide
    if (ids.length === 0 && familyId) {
      const { data: souls } = await supabase
        .from('souls')
        .select('shepherd_id')
        .eq('church_id', getChurchId())
        .eq('service_family_id', familyId)
        .not('shepherd_id', 'is', null);
      if (souls) {
        ids = [...new Set(souls.map((s: any) => s.shepherd_id).filter(Boolean))];
      }
    }

    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('church_id', getChurchId())
      .in('id', ids);
    if (error || !data) return [];

    // Compter les âmes par berger (dans cette famille)
    const { data: souls } = familyId
      ? await supabase.from('souls').select('shepherd_id').eq('church_id', getChurchId()).eq('service_family_id', familyId).not('shepherd_id', 'is', null)
      : { data: [] };
    const counts: Record<string, number> = {};
    (souls || []).forEach((s: any) => { if (s.shepherd_id) counts[s.shepherd_id] = (counts[s.shepherd_id] || 0) + 1; });

    return data.map((row: any) => ({ id: row.id, fullName: row.full_name, soulCount: counts[row.id] || 0 }));
  }
}
