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
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  SonoReportData,
  AcademieReportData,
  CULTE_REPORT_TYPE_LABELS,
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
    meetingTypeName?: string;
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
    if (filters.meetingTypeName) query = query.eq('meeting_type_name', filters.meetingTypeName);

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

  async updateReport(id: string, updates: { data?: CulteReportData; notes?: string; serviceDate?: string }): Promise<CulteReport> {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.data !== undefined) patch.data = updates.data;
    if (updates.notes !== undefined) patch.notes = updates.notes || null;
    if (updates.serviceDate !== undefined) patch.service_date = updates.serviceDate;

    const { data, error } = await supabase
      .from('culte_reports')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapReport(data);
  },

  async deleteReport(id: string): Promise<void> {
    const { error } = await supabase.from('culte_reports').delete().eq('id', id);
    if (error) throw error;
  },

  async getDashboardStats(startDate: string, endDate: string, meetingTypeName?: string): Promise<DashboardStats> {
    const [worshipReports, financeReports] = await Promise.all([
      this.getHistory({ reportType: 'worship', startDate, endDate, meetingTypeName }),
      this.getHistory({ reportType: 'finance', startDate, endDate, meetingTypeName }),
    ]);

    const totalParticipants = worshipReports.reduce(
      (sum, r) => sum + ((r.data as WorshipReportData).totalParticipants || 0),
      0
    );
    const totalNewMembers = worshipReports.reduce(
      (sum, r) => sum + ((r.data as WorshipReportData).totalNewMembers || 0),
      0
    );
    const totalFinances = financeReports.reduce(
      (sum, r) => sum + ((r.data as FinanceReportData).totalFinances || 0),
      0
    );
    const averageAttendance = worshipReports.length > 0 ? Math.round(totalParticipants / worshipReports.length) : 0;

    return {
      totalParticipants,
      totalNewMembers,
      totalFinances,
      averageAttendance,
      worshipReports,
    };
  },

  async getConsolidatedByDepartment(startDate: string, endDate: string): Promise<ConsolidatedDepartment[]> {
    const types: CulteReportType[] = ['worship', 'adn', 'finance', 'sainte_cene', 'sono', 'academie'];
    const results = await Promise.all(types.map((t) => this.getHistory({ reportType: t, startDate, endDate })));

    return types.map((reportType, i) => {
      const reports = results[i];
      const lastReportDate = reports.length > 0
        ? reports.reduce((max, r) => (r.serviceDate > max ? r.serviceDate : max), reports[0].serviceDate)
        : null;
      const latest = reports[0]; // le plus récent (getHistory trie déjà par service_date desc)

      let metrics: DepartmentMetric[] = [];
      switch (reportType) {
        case 'worship': {
          const totalParticipants = reports.reduce((s, r) => s + ((r.data as WorshipReportData).totalParticipants || 0), 0);
          const totalNewMembers = reports.reduce((s, r) => s + ((r.data as WorshipReportData).totalNewMembers || 0), 0);
          const totalChildren = reports.reduce((s, r) => {
            const c = (r.data as WorshipReportData).attendance?.children;
            return s + (c?.boys || 0) + (c?.girls || 0);
          }, 0);
          metrics = [
            { label: 'Moy. participants', value: reports.length ? Math.round(totalParticipants / reports.length) : 0 },
            { label: 'Moy. nouveaux', value: reports.length ? Math.round(totalNewMembers / reports.length) : 0 },
            { label: 'Moy. enfants', value: reports.length ? Math.round(totalChildren / reports.length) : 0 },
            { label: 'Cultes', value: reports.length },
          ];
          break;
        }
        case 'adn': {
          const totalVisitors = reports.reduce((s, r) => s + ((r.data as AdnReportData).totalNewVisitors || 0), 0);
          const totalJoin = reports.reduce((s, r) => s + ((r.data as AdnReportData).totalWantsToJoin || 0), 0);
          const totalGiveLife = reports.reduce((s, r) => s + ((r.data as AdnReportData).totalWantsToGiveLifeToJesus || 0), 0);
          metrics = [
            { label: 'Visiteurs', value: totalVisitors },
            { label: 'Veut rejoindre', value: totalJoin },
            { label: 'Décision Christ', value: totalGiveLife },
            { label: 'Rapports', value: reports.length },
          ];
          break;
        }
        case 'finance': {
          const total = reports.reduce((s, r) => s + ((r.data as FinanceReportData).totalFinances || 0), 0);
          const tithes = reports.reduce((s, r) => s + ((r.data as FinanceReportData).tithes || 0), 0);
          const offerings = reports.reduce(
            (s, r) => s + ((r.data as FinanceReportData).regularOfferings || 0) + ((r.data as FinanceReportData).specialOfferings || 0),
            0
          );
          metrics = [
            { label: 'Total', value: `${total.toLocaleString('fr-FR')} F` },
            { label: 'Dîmes', value: `${tithes.toLocaleString('fr-FR')} F` },
            { label: 'Offrandes', value: `${offerings.toLocaleString('fr-FR')} F` },
            { label: 'Rapports', value: reports.length },
          ];
          break;
        }
        case 'sainte_cene': {
          const pains = reports.reduce((s, r) => s + ((r.data as SainteCeneReportData).painsDistribuees || 0), 0);
          const vins = reports.reduce((s, r) => s + ((r.data as SainteCeneReportData).vinsDistribuees || 0), 0);
          metrics = [
            { label: 'Pains distribués', value: pains },
            { label: 'Vins distribués', value: vins },
            { label: 'Célébrations', value: reports.length },
          ];
          break;
        }
        case 'sono': {
          const latestData = latest?.data as SonoReportData | undefined;
          const checksOk = latestData
            ? Object.values(latestData.beforeService || {}).filter((v) => v === 'OK').length
            : 0;
          const checksTotal = latestData ? Object.values(latestData.beforeService || {}).length : 0;
          metrics = latestData
            ? [
                { label: 'Checks OK', value: `${checksOk}/${checksTotal}` },
                { label: 'Live stream', value: latestData.duringService?.liveStreaming || '-' },
                { label: 'Son salle', value: latestData.duringService?.roomSoundQuality === 'SATISFAISANT' ? '✓' : '⚠' },
                { label: 'Rapports', value: reports.length },
              ]
            : [{ label: 'Rapports', value: reports.length }];
          break;
        }
        case 'academie': {
          const totalActual = reports.reduce((s, r) => s + ((r.data as AcademieReportData).actualStudents || 0), 0);
          const totalPresent = reports.reduce((s, r) => s + ((r.data as AcademieReportData).presentStudents || 0), 0);
          const attendRate = totalActual > 0 ? Math.round((totalPresent / totalActual) * 100) : 0;
          metrics = [
            { label: 'Taux présence', value: `${attendRate}%` },
            { label: 'Présents total', value: totalPresent },
            { label: 'Inscrits total', value: totalActual },
            { label: 'Sessions', value: reports.length },
          ];
          break;
        }
      }

      return {
        reportType,
        label: CULTE_REPORT_TYPE_LABELS[reportType],
        count: reports.length,
        lastReportDate,
        metrics,
      };
    });
  },

  async getConsolidatedGlobalStats(startDate: string, endDate: string): Promise<ConsolidatedGlobalStats> {
    const [worshipReports, adnReports, financeReports] = await Promise.all([
      this.getHistory({ reportType: 'worship', startDate, endDate }),
      this.getHistory({ reportType: 'adn', startDate, endDate }),
      this.getHistory({ reportType: 'finance', startDate, endDate }),
    ]);
    const avgAttendance = worshipReports.length
      ? Math.round(worshipReports.reduce((s, r) => s + ((r.data as WorshipReportData).totalParticipants || 0), 0) / worshipReports.length)
      : 0;
    const totalVisitors = adnReports.reduce((s, r) => s + ((r.data as AdnReportData).totalNewVisitors || 0), 0);
    const totalFinances = financeReports.reduce((s, r) => s + ((r.data as FinanceReportData).totalFinances || 0), 0);
    return { avgAttendance, totalVisitors, totalFinances };
  },

  async getPreviousPeriodStats(startDate: string, endDate: string, meetingTypeName?: string): Promise<DashboardStats> {
    const durationMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    const prevEnd = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    return this.getDashboardStats(prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0], meetingTypeName);
  },
};

export interface DashboardStats {
  totalParticipants: number;
  totalNewMembers: number;
  totalFinances: number;
  averageAttendance: number;
  worshipReports: CulteReport[];
}

export interface ConsolidatedGlobalStats {
  avgAttendance: number;
  totalVisitors: number;
  totalFinances: number;
}

export interface DepartmentMetric {
  label: string;
  value: string | number;
}

export interface ConsolidatedDepartment {
  reportType: CulteReportType;
  label: string;
  count: number;
  lastReportDate: string | null;
  metrics: DepartmentMetric[];
}
