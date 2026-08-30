import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CulteEvent, CulteRecurringSchedule, CulteReportType, DayOfWeek } from '../types/culteReport.types';

function mapEvent(row: any): CulteEvent {
  return {
    id: row.id,
    churchId: row.church_id,
    serviceDate: row.service_date,
    meetingTypeName: row.meeting_type_name,
    createdAt: row.created_at,
  };
}

function mapSchedule(row: any): CulteRecurringSchedule {
  return {
    id: row.id,
    churchId: row.church_id,
    meetingTypeName: row.meeting_type_name,
    dayOfWeek: row.day_of_week,
    isActive: row.is_active,
    startTime: row.start_time,
  };
}

export const CulteEventService = {
  /** Cree les evenements du programme recurrent pour cette date s'ils n'existent pas encore
   * (ex: chaque mercredi/dimanche) -- a appeler avant d'afficher le selecteur d'evenements. */
  async ensureRecurringEventsForDate(serviceDate: string): Promise<void> {
    const dayOfWeek = new Date(`${serviceDate}T00:00:00`).getDay();
    const { data: schedules, error } = await supabase
      .from('culte_recurring_schedules')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);
    if (error) throw error;
    if (!schedules || schedules.length === 0) return;

    const rows = schedules.map((s: any) => ({
      church_id: getChurchId(),
      service_date: serviceDate,
      meeting_type_name: s.meeting_type_name,
    }));
    const { error: upsertErr } = await supabase
      .from('culte_events')
      .upsert(rows, { onConflict: 'church_id,service_date,meeting_type_name', ignoreDuplicates: true });
    if (upsertErr) throw upsertErr;
  },

  /** Evenements du jour (deja generes par ensureRecurringEventsForDate) pour une date donnee. */
  async getEventsForDate(serviceDate: string): Promise<CulteEvent[]> {
    const { data, error } = await supabase
      .from('culte_events')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('service_date', serviceDate);
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  },

  async getRecentEvents(limitCount = 30): Promise<CulteEvent[]> {
    const { data, error } = await supabase
      .from('culte_events')
      .select('*')
      .eq('church_id', getChurchId())
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limitCount);
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  },

  /** Cree un evenement ad-hoc (ex: Mardi du Mariage, veillee de priere) -- reutilise l'evenement
   * existant si un autre departement l'a deja cree pour la meme date/type. */
  async createEvent(serviceDate: string, meetingTypeName: string): Promise<CulteEvent> {
    const { data, error } = await supabase
      .from('culte_events')
      .upsert(
        { church_id: getChurchId(), service_date: serviceDate, meeting_type_name: meetingTypeName.trim() },
        { onConflict: 'church_id,service_date,meeting_type_name' }
      )
      .select()
      .single();
    if (error) throw error;
    return mapEvent(data);
  },

  /** Corrige la date/le nom d'un evenement deja cree (ex: erreur de saisie manuelle) --
   * n'importe quel departement peut la corriger, meme apres qu'un rapport y soit rattache :
   * les rapports deja soumis pour cet event_id sont resynchronises (date/nom denormalises). */
  async updateEvent(id: string, serviceDate: string, meetingTypeName: string): Promise<CulteEvent> {
    const { data, error } = await supabase
      .from('culte_events')
      .update({ service_date: serviceDate, meeting_type_name: meetingTypeName.trim() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const { error: syncErr } = await supabase
      .from('culte_reports')
      .update({ service_date: serviceDate, meeting_type_name: meetingTypeName.trim() })
      .eq('event_id', id);
    if (syncErr) throw syncErr;

    return mapEvent(data);
  },

  /** Evenements qu'un departement a retires de sa propre liste "Culte du jour" (trop ancien,
   * pas de rapport a faire) -- n'affecte que ce departement : l'evenement et les rapports deja
   * soumis par d'autres departements restent intacts. */
  async getDismissedEventIds(reportType: CulteReportType): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('culte_event_dismissals')
      .select('event_id')
      .eq('church_id', getChurchId())
      .eq('report_type', reportType);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => r.event_id));
  },

  async dismissEvent(eventId: string, reportType: CulteReportType, dismissedBy?: string | null): Promise<void> {
    const { error } = await supabase
      .from('culte_event_dismissals')
      .upsert(
        { church_id: getChurchId(), event_id: eventId, report_type: reportType, dismissed_by: dismissedBy ?? null },
        { onConflict: 'event_id,report_type' }
      );
    if (error) throw error;
  },
};

export const RecurringScheduleService = {
  async list(): Promise<CulteRecurringSchedule[]> {
    const { data, error } = await supabase
      .from('culte_recurring_schedules')
      .select('*')
      .eq('church_id', getChurchId())
      .order('day_of_week', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapSchedule);
  },

  async create(meetingTypeName: string, dayOfWeek: DayOfWeek, startTime: string | null = null): Promise<CulteRecurringSchedule> {
    const { data, error } = await supabase
      .from('culte_recurring_schedules')
      .insert({ church_id: getChurchId(), meeting_type_name: meetingTypeName.trim(), day_of_week: dayOfWeek, start_time: startTime })
      .select()
      .single();
    if (error) throw error;
    return mapSchedule(data);
  },

  async update(id: string, meetingTypeName: string, dayOfWeek: DayOfWeek, isActive: boolean, startTime: string | null = null): Promise<void> {
    const { error } = await supabase
      .from('culte_recurring_schedules')
      .update({ meeting_type_name: meetingTypeName.trim(), day_of_week: dayOfWeek, is_active: isActive, start_time: startTime })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('culte_recurring_schedules').delete().eq('id', id);
    if (error) throw error;
  },
};
