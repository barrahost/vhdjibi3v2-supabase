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
    return { id: data.id, ...data } as ServiceFamily;
  }

  /** Liste les âmes assignées à une famille. */
  static async getSoulsByFamilyId(familyId: string): Promise<Soul[]> {
    const { data, error } = await supabase
      .from('souls')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('service_family_id', familyId);
    if (error || !data) return [];
    return data as Soul[];
  }

  /** Met à jour le berger assigné à une âme. */
  static async assignShepherdToSoul(soulId: string, shepherdId: string | null) {
    await supabase.from('souls').update({
      shepherd_id: shepherdId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', soulId);
  }

  /** Récupère les bergers de la famille (depuis shepherdIds). */
  static async getShepherdsOfFamily(shepherdIds: string[] = []): Promise<{ id: string; fullName: string }[]> {
    if (shepherdIds.length === 0) return [];
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('church_id', getChurchId())
      .in('id', shepherdIds);
    if (error || !data) return [];
    return data.map((row: any) => ({ id: row.id, fullName: row.full_name }));
  }
}
