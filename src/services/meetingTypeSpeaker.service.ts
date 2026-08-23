import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CulteReportMeetingType, CulteReportSpeaker, CulteReportType } from '../types/culteReport.types';

function mapMeetingType(row: any): CulteReportMeetingType {
  return {
    id: row.id,
    churchId: row.church_id,
    name: row.name,
    description: row.description ?? undefined,
    eligibleReportTypes: Array.isArray(row.eligible_report_types) && row.eligible_report_types.length > 0
      ? row.eligible_report_types
      : null,
  };
}

function mapSpeaker(row: any): CulteReportSpeaker {
  return { id: row.id, churchId: row.church_id, name: row.name, description: row.description ?? undefined };
}

export const MeetingTypeService = {
  async list(): Promise<CulteReportMeetingType[]> {
    const { data, error } = await supabase
      .from('culte_report_meeting_types')
      .select('*')
      .eq('church_id', getChurchId())
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapMeetingType);
  },

  async create(name: string, description?: string, eligibleReportTypes?: CulteReportType[]): Promise<CulteReportMeetingType> {
    const { data, error } = await supabase
      .from('culte_report_meeting_types')
      .insert({
        church_id: getChurchId(),
        name: name.trim(),
        description: description?.trim() || null,
        eligible_report_types: eligibleReportTypes?.length ? eligibleReportTypes : null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMeetingType(data);
  },

  async update(id: string, name: string, description?: string, eligibleReportTypes?: CulteReportType[]): Promise<void> {
    const { error } = await supabase
      .from('culte_report_meeting_types')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        eligible_report_types: eligibleReportTypes?.length ? eligibleReportTypes : null,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('culte_report_meeting_types').delete().eq('id', id);
    if (error) throw error;
  },
};

export const SpeakerService = {
  async list(): Promise<CulteReportSpeaker[]> {
    const { data, error } = await supabase
      .from('culte_report_speakers')
      .select('*')
      .eq('church_id', getChurchId())
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapSpeaker);
  },

  async create(name: string, description?: string): Promise<CulteReportSpeaker> {
    const { data, error } = await supabase
      .from('culte_report_speakers')
      .insert({ church_id: getChurchId(), name: name.trim(), description: description?.trim() || null })
      .select()
      .single();
    if (error) throw error;
    return mapSpeaker(data);
  },

  async update(id: string, name: string, description?: string): Promise<void> {
    const { error } = await supabase
      .from('culte_report_speakers')
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('culte_report_speakers').delete().eq('id', id);
    if (error) throw error;
  },
};
