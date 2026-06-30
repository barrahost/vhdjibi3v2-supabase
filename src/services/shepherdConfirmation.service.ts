import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export interface ConfirmationToken {
  id: string;
  churchId: string;
  shepherdId: string;
  shepherdName: string;
  token: string;
  status: 'pending' | 'used';
  expiresAt: Date;
  createdAt: Date;
}

export interface SoulForConfirmation {
  id: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  location?: string;
  photoUrl?: string;
}

function mapToken(r: any): ConfirmationToken {
  return {
    id: r.id,
    churchId: r.church_id,
    shepherdId: r.shepherd_id,
    shepherdName: r.shepherd_name,
    token: r.token,
    status: r.status,
    expiresAt: new Date(r.expires_at),
    createdAt: new Date(r.created_at),
  };
}

export const ShepherdConfirmationService = {
  async createToken(shepherdId: string, shepherdName: string): Promise<string> {
    const churchId = getChurchId();

    // Invalider les anciens tokens pending pour ce berger
    await supabase
      .from('shepherd_confirmation_tokens')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('church_id', churchId)
      .eq('shepherd_id', shepherdId)
      .eq('status', 'pending');

    const { data, error } = await supabase
      .from('shepherd_confirmation_tokens')
      .insert({ church_id: churchId, shepherd_id: shepherdId, shepherd_name: shepherdName })
      .select('token')
      .single();

    if (error) throw error;
    return data.token;
  },

  async getTokenInfo(token: string): Promise<ConfirmationToken> {
    const { data, error } = await supabase
      .from('shepherd_confirmation_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Token introuvable');
    return mapToken(data);
  },

  async getSoulsForToken(token: string): Promise<SoulForConfirmation[]> {
    const { data, error } = await supabase.rpc('get_souls_for_confirmation', { p_token: token });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      nickname: r.nickname ?? undefined,
      phone: r.phone ?? undefined,
      location: r.location ?? undefined,
      photoUrl: r.photo_url ?? undefined,
    }));
  },

  async submitConfirmation(
    token: string,
    confirmedSoulIds: string[]
  ): Promise<{ confirmed: number; removed: number }> {
    const { data, error } = await supabase.rpc('submit_shepherd_confirmation', {
      p_token: token,
      p_confirmed_soul_ids: confirmedSoulIds,
    });
    if (error) throw error;
    return data as { confirmed: number; removed: number };
  },

  async getExistingToken(shepherdId: string): Promise<ConfirmationToken | null> {
    const { data } = await supabase
      .from('shepherd_confirmation_tokens')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('shepherd_id', shepherdId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data ? mapToken(data) : null;
  },
};
