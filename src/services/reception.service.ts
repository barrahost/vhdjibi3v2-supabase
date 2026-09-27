import { supabase } from '../lib/supabase';
import type { PlannedService, GaveLifeToJesus, WillJoinVH } from '../types/evangelized.types';

// Accueil ADN par QR code (page publique /accueil) — RPC dédiées, volontairement plus
// restreintes que le reste de l'admin : la recherche ne renvoie jamais le téléphone.

export interface CheckinSearchResult {
  id: string;
  fullName: string;
  location: string;
}

export const ReceptionService = {
  async search(churchId: string, query: string): Promise<CheckinSearchResult[]> {
    const { data, error } = await supabase.rpc('search_evangelized_souls_for_checkin', {
      p_church_id: churchId,
      p_query: query,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      location: r.location,
    }));
  },

  async confirmArrival(id: string, churchId: string, plannedService: PlannedService | ''): Promise<void> {
    const { error } = await supabase.rpc('confirm_evangelized_soul_checkin', {
      p_id: id,
      p_church_id: churchId,
      p_planned_service: plannedService,
    });
    if (error) throw new Error(error.message);
  },

  async submitNewVisitor(
    churchId: string,
    fullName: string,
    gender: 'male' | 'female',
    phone: string,
    location: string,
    plannedService: PlannedService | '',
    gaveLifeToJesus: GaveLifeToJesus | '',
    willJoinVH: WillJoinVH | '',
    attendedCommunity: string,
    prayerTopics: string
  ): Promise<void> {
    const { error } = await supabase.rpc('submit_reception_checkin', {
      p_church_id: churchId,
      p_full_name: fullName,
      p_gender: gender,
      p_phone: phone,
      p_location: location,
      p_planned_service: plannedService,
      p_gave_life_to_jesus: gaveLifeToJesus,
      p_will_join_vh: willJoinVH,
      p_attended_community: attendedCommunity,
      p_prayer_topics: prayerTopics,
    });
    if (error) throw new Error(error.message);
  },
};
