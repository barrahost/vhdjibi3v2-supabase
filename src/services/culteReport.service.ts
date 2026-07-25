import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import {
  CulteReport,
  CulteReportType,
  CulteReportData,
  CulteReportMeetingType,
  CulteReportSpeaker,
  CulteNeed,
  CulteNeedPriority,
} from '../types/culteReport.types';

function mapReport(row: any): CulteReport {
  return {
    id: row.id,
    churchId: row.church_id,
    reportType: row.report_type,
    departmentId: row.department_id,
    departmentName: row.department_name,
    worshipReportId: row.worship_report_id,
    serviceDate: row.service_date,
    meetingTypeId: row.meeting_type_id,
    meetingTypeName: row.meeting_type_name,
    submittedBy: row.submitted_by,
    submittedByName: row.submitted_by_name,
    data: row.data ?? {},
    notes: row.notes,
    needsNotes: row.needs_notes,
    legacyFirestoreId: row.legacy_firestore_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMeetingType(row: any): CulteReportMeetingType {
  return { id: row.id, churchId: row.church_id, name: row.name, description: row.description ?? undefined };
}

function mapSpeaker(row: any): CulteReportSpeaker {
  return { id: row.id, churchId: row.church_id, name: row.name, description: row.description ?? undefined };
}

function mapNeed(row: any): CulteNeed {
  return {
    id: row.id,
    churchId: row.church_id,
    culteReportId: row.culte_report_id,
    departmentName: row.department_name,
    description: row.description,
    priority: row.priority,
    isAddressed: row.is_addressed,
    addressedBy: row.addressed_by,
    addressedAt: row.addressed_at,
    createdAt: row.created_at,
  };
}

export interface SubmitCulteReportInput {
  reportType: CulteReportType;
  departmentId: string | null;
  departmentName: string;
  worshipReportId: string | null;
  serviceDate: string;
  meetingTypeId: string | null;
  meetingTypeName: string | null;
  submittedBy: string | null;
  submittedByName: string;
  data: CulteReportData;
  notes?: string;
  needsNotes?: string;
}

export const CulteReportService = {
  async submitReport(input: SubmitCulteReportInput): Promise<CulteReport> {
    const { data, error } = await supabase
      .from('culte_reports')
      .insert({
        church_id: getChurchId(),
        report_type: input.reportType,
        department_id: input.departmentId,
        department_name: input.departmentName,
        worship_report_id: input.worshipReportId,
        service_date: input.serviceDate,
        meeting_type_id: input.meetingTypeId,
        meeting_type_name: input.meetingTypeName,
        submitted_by: input.submittedBy,
        submitted_by_name: input.submittedByName,
        data: input.data,
        notes: input.notes || null,
        needs_notes: input.needsNotes || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (input.needsNotes && input.needsNotes.trim()) {
      const lines = input.needsNotes.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const needRows = lines.map((description) => ({
          church_id: getChurchId(),
          culte_report_id: data.id,
          department_name: input.departmentName,
          description,
          priority: 'medium' as CulteNeedPriority,
        }));
        const { error: needsErr } = await supabase.from('culte_report_needs').insert(needRows);
        if (needsErr) throw needsErr;
      }
    }

    return mapReport(data);
  },

  async getWorshipReportsForDay(serviceDate: string): Promise<CulteReport[]> {
    const { data, error } = await supabase
      .from('culte_reports')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('report_type', 'worship')
      .eq('service_date', serviceDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapReport);
  },

  async getHistory(filters: {
    departmentId?: string;
    reportType?: CulteReportType;
    startDate?: string;
    endDate?: string;
  }): Promise<CulteReport[]> {
    let query = supabase
      .from('culte_reports')
      .select('*')
      .eq('church_id', getChurchId())
      .order('service_date', { ascending: false });

    if (filters.departmentId) query = query.eq('department_id', filters.departmentId);
    if (filters.reportType) query = query.eq('report_type', filters.reportType);
    if (filters.startDate) query = query.gte('service_date', filters.startDate);
    if (filters.endDate) query = query.lte('service_date', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapReport);
  },

  async listMeetingTypes(): Promise<CulteReportMeetingType[]> {
    const { data, error } = await supabase
      .from('culte_report_meeting_types')
      .select('*')
      .eq('church_id', getChurchId())
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapMeetingType);
  },

  async listSpeakers(): Promise<CulteReportSpeaker[]> {
    const { data, error } = await supabase
      .from('culte_report_speakers')
      .select('*')
      .eq('church_id', getChurchId())
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapSpeaker);
  },

  async getNeeds(filters: { isAddressed?: boolean } = {}): Promise<CulteNeed[]> {
    let query = supabase
      .from('culte_report_needs')
      .select('*')
      .eq('church_id', getChurchId())
      .order('created_at', { ascending: false });

    if (filters.isAddressed !== undefined) query = query.eq('is_addressed', filters.isAddressed);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapNeed);
  },

  async markNeedAddressed(needId: string, addressedBy: string): Promise<void> {
    const { error } = await supabase
      .from('culte_report_needs')
      .update({ is_addressed: true, addressed_by: addressedBy, addressed_at: new Date().toISOString() })
      .eq('id', needId);
    if (error) throw error;
  },
};
