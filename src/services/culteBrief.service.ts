import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import type { CulteEvent, CulteRecurringSchedule } from '../types/culteReport.types';
import type {
  BriefContent,
  BriefInstruction,
  ChecklistProgress,
  CulteEventInfo,
  CulteMeeting,
  DebriefContent,
  MeetingStatus,
  RunSheetItem,
} from '../types/culteBrief.types';
import { RecurringScheduleService } from './culteEvent.service';
import {
  addDaysISO,
  compareEventsInDay,
  formatDateFr,
  fromMinutes,
  shortServiceLabel,
  toHHMM,
  toMinutes,
  todayISO,
} from '../lib/culteTiming';

export interface Actor {
  id?: string | null;
  name?: string | null;
}

export type MeetingKind = 'brief' | 'debrief';

// ── Mappers ─────────────────────────────────────────────────────────────────────────────────────
function mapEvent(row: any): CulteEvent {
  return {
    id: row.id,
    churchId: row.church_id,
    serviceDate: row.service_date,
    meetingTypeName: row.meeting_type_name,
    createdAt: row.created_at,
  };
}

function withTiming(event: CulteEvent, schedules: CulteRecurringSchedule[]): CulteEventInfo {
  const schedule = schedules.find((s) => s.meetingTypeName === event.meetingTypeName);
  return {
    ...event,
    startTime: toHHMM(schedule?.startTime),
    endTime: toHHMM(schedule?.endTime),
    briefEnabled: !!schedule?.briefEnabled,
  };
}

function mapMeeting<C>(row: any): CulteMeeting<C> {
  return {
    id: row.id,
    eventId: row.event_id,
    content: (row.content ?? {}) as C,
    status: row.status,
    readyAt: row.ready_at,
    updatedByName: row.updated_by_name,
    updatedAt: row.updated_at,
  };
}

function mapRunSheetItem(row: any): RunSheetItem {
  return {
    id: row.id,
    eventId: row.event_id,
    position: row.position,
    startTime: toHHMM(row.start_time),
    title: row.title,
    departmentName: row.department_name,
    responsibleName: row.responsible_name,
    support: row.support,
    needsRegie: !!row.needs_regie,
    durationMin: row.duration_min,
    notes: row.notes,
  };
}

function mapInstruction(row: any): BriefInstruction {
  return {
    id: row.id,
    eventId: row.event_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    instructions: row.instructions ?? '',
    updatedByName: row.updated_by_name,
    updatedAt: row.updated_at,
  };
}

// ── Cultes de la semaine (hub) et cockpit d'un culte ─────────────────────────────────────────────
export interface EventSummary {
  eventId: string;
  brief: MeetingStatus | null;
  debrief: MeetingStatus | null;
  checklist: ChecklistProgress;
  debriefSheets: number;
  actionsOpen: number;
  actionsOverdue: number;
}

export const CulteCockpitService = {
  /** Crée les cultes du programme récurrent (avec brief activé) des prochains jours s'ils n'existent pas. */
  async ensureUpcomingEvents(days = 10): Promise<void> {
    const schedules = (await RecurringScheduleService.list()).filter((s) => s.isActive && s.briefEnabled);
    if (schedules.length === 0) return;

    const today = todayISO();
    const rows: { church_id: string; service_date: string; meeting_type_name: string }[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDaysISO(today, i);
      const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
      schedules
        .filter((s) => s.dayOfWeek === dayOfWeek)
        .forEach((s) => rows.push({ church_id: getChurchId(), service_date: date, meeting_type_name: s.meetingTypeName }));
    }
    if (rows.length === 0) return;

    const { error } = await supabase
      .from('culte_events')
      .upsert(rows, { onConflict: 'church_id,service_date,meeting_type_name', ignoreDuplicates: true });
    if (error) throw error;
  },

  /** Cultes suivis (brief activé) autour d'aujourd'hui, du plus ancien au plus récent. */
  async listHubEvents(pastDays = 21, futureDays = 10): Promise<CulteEventInfo[]> {
    await this.ensureUpcomingEvents(futureDays);
    const schedules = await RecurringScheduleService.list();
    const today = todayISO();

    const { data, error } = await supabase
      .from('culte_events')
      .select('*')
      .eq('church_id', getChurchId())
      .gte('service_date', addDaysISO(today, -pastDays))
      .lte('service_date', addDaysISO(today, futureDays))
      .order('service_date', { ascending: true });
    if (error) throw error;

    return (data ?? [])
      .map(mapEvent)
      .map((event: CulteEvent) => withTiming(event, schedules))
      .filter((event: CulteEventInfo) => event.briefEnabled)
      .sort((a: CulteEventInfo, b: CulteEventInfo) => a.serviceDate.localeCompare(b.serviceDate) || compareEventsInDay(a, b));
  },

  async getEventInfo(eventId: string): Promise<CulteEventInfo | null> {
    const { data, error } = await supabase
      .from('culte_events')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('id', eventId)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return null;
    const schedules = await RecurringScheduleService.list();
    return withTiming(mapEvent(data[0]), schedules);
  },

  /** Tous les cultes suivis d'une même date (ex. les 2 cultes du dimanche), dans l'ordre chronologique. */
  async getDayEvents(serviceDate: string): Promise<CulteEventInfo[]> {
    const schedules = await RecurringScheduleService.list();
    const { data, error } = await supabase
      .from('culte_events')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('service_date', serviceDate);
    if (error) throw error;
    return (data ?? [])
      .map(mapEvent)
      .map((event: CulteEvent) => withTiming(event, schedules))
      .filter((event: CulteEventInfo) => event.briefEnabled)
      .sort(compareEventsInDay);
  },

  /** Libellés courts de cultes (« 19/10/2026 · 1er culte »), pour situer l'origine d'une action. */
  async getEventLabels(eventIds: string[]): Promise<Record<string, string>> {
    const ids = Array.from(new Set(eventIds.filter(Boolean)));
    if (ids.length === 0) return {};
    const { data, error } = await supabase
      .from('culte_events')
      .select('id, service_date, meeting_type_name')
      .eq('church_id', getChurchId())
      .in('id', ids);
    if (error) throw error;
    return Object.fromEntries(
      (data ?? []).map((row: any) => [row.id, `${formatDateFr(row.service_date)} · ${shortServiceLabel(row.meeting_type_name)}`])
    );
  },

  async getSummaries(eventIds: string[]): Promise<Record<string, EventSummary>> {
    const summaries: Record<string, EventSummary> = {};
    eventIds.forEach((eventId) => {
      summaries[eventId] = {
        eventId,
        brief: null,
        debrief: null,
        checklist: { total: 0, ok: 0, nok: 0, pending: 0 },
        debriefSheets: 0,
        actionsOpen: 0,
        actionsOverdue: 0,
      };
    });
    if (eventIds.length === 0) return summaries;

    const church = getChurchId();
    const [meetings, items, sheets, actions] = await Promise.all([
      supabase.from('culte_meetings').select('event_id, kind, status').eq('church_id', church).in('event_id', eventIds),
      supabase.from('culte_checklist_items').select('event_id, status').eq('church_id', church).in('event_id', eventIds),
      supabase.from('culte_debriefs').select('event_id').eq('church_id', church).in('event_id', eventIds),
      supabase.from('culte_report_needs').select('event_id, status, due_date').eq('church_id', church).in('event_id', eventIds),
    ]);
    for (const result of [meetings, items, sheets, actions]) if (result.error) throw result.error;

    (meetings.data ?? []).forEach((m: any) => {
      const s = summaries[m.event_id];
      if (!s) return;
      if (m.kind === 'brief') s.brief = m.status;
      else s.debrief = m.status;
    });
    (items.data ?? []).forEach((i: any) => {
      const s = summaries[i.event_id];
      if (!s) return;
      s.checklist.total += 1;
      if (i.status === 'ok') s.checklist.ok += 1;
      else if (i.status === 'nok') s.checklist.nok += 1;
      else s.checklist.pending += 1;
    });
    (sheets.data ?? []).forEach((d: any) => {
      if (summaries[d.event_id]) summaries[d.event_id].debriefSheets += 1;
    });
    const today = todayISO();
    (actions.data ?? []).forEach((a: any) => {
      const s = summaries[a.event_id];
      if (!s || a.status === 'done' || a.status === 'dropped') return;
      s.actionsOpen += 1;
      if (a.due_date && a.due_date < today) s.actionsOverdue += 1;
    });
    return summaries;
  },
};

// ── Brief et débrief général (un document par culte) ──────────────────────────────────────────────
export const CulteMeetingService = {
  async get<C = BriefContent | DebriefContent>(eventId: string, kind: MeetingKind): Promise<CulteMeeting<C> | null> {
    const { data, error } = await supabase
      .from('culte_meetings')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('event_id', eventId)
      .eq('kind', kind)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? mapMeeting<C>(data[0]) : null;
  },

  /** Enregistre le contenu sans toucher au statut (sauf si `status` est précisé). */
  async save<C>(eventId: string, kind: MeetingKind, content: C, actor: Actor, status?: MeetingStatus): Promise<CulteMeeting<C>> {
    const row: Record<string, any> = {
      church_id: getChurchId(),
      event_id: eventId,
      kind,
      content,
      updated_by: actor.id ?? null,
      updated_by_name: actor.name ?? null,
      updated_at: new Date().toISOString(),
    };
    if (status) {
      row.status = status;
      row.ready_at = status === 'draft' ? null : new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('culte_meetings')
      .upsert(row, { onConflict: 'event_id,kind' })
      .select()
      .single();
    if (error) throw error;
    return mapMeeting<C>(data);
  },

  /**
   * Enregistre seulement les champs modifiés par cet écran, par-dessus la dernière version enregistrée :
   * un autre responsable qui a complété le document entre-temps n'est pas écrasé par une version périmée.
   */
  async savePatch<C extends object>(
    eventId: string,
    kind: MeetingKind,
    patch: Partial<C>,
    actor: Actor,
    status?: MeetingStatus
  ): Promise<CulteMeeting<C>> {
    const latest = await CulteMeetingService.get<C>(eventId, kind);
    return CulteMeetingService.save<C>(eventId, kind, { ...(latest?.content ?? {}), ...patch } as C, actor, status);
  },

  async setStatus(eventId: string, kind: MeetingKind, status: MeetingStatus, actor: Actor): Promise<void> {
    const existing = await this.get(eventId, kind);
    await this.save(eventId, kind, existing?.content ?? {}, actor, status);
  },
};

// ── Conducteur (déroulé minuté) ───────────────────────────────────────────────────────────────────
export interface RunSheetInput {
  id?: string;
  startTime?: string | null;
  title: string;
  departmentName?: string | null;
  responsibleName?: string | null;
  support?: string | null;
  needsRegie?: boolean;
  durationMin?: number | null;
  notes?: string | null;
}

const toRunSheetRow = (item: RunSheetInput) => ({
  start_time: item.startTime || null,
  title: item.title.trim(),
  department_name: item.departmentName?.trim() || null,
  responsible_name: item.responsibleName?.trim() || null,
  support: item.support?.trim() || null,
  needs_regie: !!item.needsRegie,
  duration_min: item.durationMin ?? null,
  notes: item.notes?.trim() || null,
});

export const CulteRunSheetService = {
  async list(eventId: string): Promise<RunSheetItem[]> {
    const { data, error } = await supabase
      .from('culte_run_sheet_items')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('event_id', eventId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapRunSheetItem);
  },

  /** Ajoute une séquence à la fin, ou met à jour celle dont l'id est fourni. */
  async save(eventId: string, item: RunSheetInput, position?: number): Promise<RunSheetItem> {
    if (item.id) {
      const { data, error } = await supabase
        .from('culte_run_sheet_items')
        .update({ ...toRunSheetRow(item), updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .select()
        .single();
      if (error) throw error;
      return mapRunSheetItem(data);
    }
    const { data, error } = await supabase
      .from('culte_run_sheet_items')
      .insert({ church_id: getChurchId(), event_id: eventId, position: position ?? 0, ...toRunSheetRow(item) })
      .select()
      .single();
    if (error) throw error;
    return mapRunSheetItem(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('culte_run_sheet_items').delete().eq('id', id);
    if (error) throw error;
  },

  /** Réécrit les positions dans l'ordre fourni. */
  async reorder(orderedIds: string[]): Promise<void> {
    const results = await Promise.all(
      orderedIds.map((id, index) => supabase.from('culte_run_sheet_items').update({ position: index }).eq('id', id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
  },

  /**
   * Aligne le conducteur enregistré sur la liste fournie (ordre inclus), en ne touchant qu'à ce que cet
   * écran a réellement modifié par rapport à `baseline` (le conducteur tel qu'il l'avait chargé) :
   * séquences créées, modifiées, déplacées ou retirées ici. Une séquence ajoutée entre-temps par un autre
   * responsable n'est jamais supprimée.
   */
  async sync(eventId: string, items: RunSheetInput[], baseline: RunSheetItem[]): Promise<RunSheetItem[]> {
    const base = new Map(baseline.map((item) => [item.id, item]));
    const keep = new Set(items.map((item) => item.id).filter(Boolean));
    const removed = baseline.filter((item) => !keep.has(item.id)).map((item) => item.id);
    if (removed.length > 0) {
      const { error } = await supabase.from('culte_run_sheet_items').delete().in('id', removed);
      if (error) throw error;
    }
    const now = new Date().toISOString();
    const operations = items.flatMap((item, index) => {
      if (!item.id) {
        return [supabase.from('culte_run_sheet_items').insert({ church_id: getChurchId(), event_id: eventId, position: index, ...toRunSheetRow(item) })];
      }
      const before = base.get(item.id);
      const contentChanged = !before || JSON.stringify(toRunSheetRow(before)) !== JSON.stringify(toRunSheetRow(item));
      const moved = !before || before.position !== index;
      if (!contentChanged && !moved) return [];
      const fields = contentChanged ? { ...toRunSheetRow(item), position: index, updated_at: now } : { position: index };
      return [supabase.from('culte_run_sheet_items').update(fields).eq('id', item.id)];
    });
    const results = await Promise.all(operations);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
    return this.list(eventId);
  },

  async insertMany(eventId: string, items: RunSheetInput[], startPosition = 0): Promise<void> {
    if (items.length === 0) return;
    const rows = items.map((item, index) => ({
      church_id: getChurchId(),
      event_id: eventId,
      position: startPosition + index,
      ...toRunSheetRow(item),
    }));
    const { error } = await supabase.from('culte_run_sheet_items').insert(rows);
    if (error) throw error;
  },
};

// ── Consignes par département ────────────────────────────────────────────────────────────────────
export const CulteInstructionService = {
  async list(eventId: string): Promise<BriefInstruction[]> {
    const { data, error } = await supabase
      .from('culte_brief_instructions')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('event_id', eventId);
    if (error) throw error;
    return (data ?? []).map(mapInstruction);
  },

  async save(eventId: string, department: { id?: string | null; name: string }, instructions: string, actor: Actor): Promise<BriefInstruction> {
    const { data, error } = await supabase
      .from('culte_brief_instructions')
      .upsert(
        {
          church_id: getChurchId(),
          event_id: eventId,
          department_id: department.id ?? null,
          department_name: department.name,
          instructions,
          updated_by_name: actor.name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,department_name' }
      )
      .select()
      .single();
    if (error) throw error;
    return mapInstruction(data);
  },
};

// ── Reprise du brief d'un culte vers un autre (1er culte → 2e culte du dimanche) ─────────────────
export const CulteBriefCopyService = {
  /**
   * Copie thème/vision/consignes, conducteur et consignes du culte `from` vers `to` (qui doit être
   * vide). Les heures du conducteur sont décalées de l'écart entre les deux débuts de culte.
   */
  async copy(from: CulteEventInfo, to: CulteEventInfo, actor: Actor): Promise<void> {
    const [meeting, items, instructions] = await Promise.all([
      CulteMeetingService.get<BriefContent>(from.id, 'brief'),
      CulteRunSheetService.list(from.id),
      CulteInstructionService.list(from.id),
    ]);

    const fromStart = toMinutes(from.startTime);
    const toStart = toMinutes(to.startTime);
    const shift = fromStart !== null && toStart !== null ? toStart - fromStart : 0;

    await CulteMeetingService.save<BriefContent>(to.id, 'brief', meeting?.content ?? {}, actor);
    await CulteRunSheetService.insertMany(
      to.id,
      items.map((item) => ({
        startTime: item.startTime && shift ? fromMinutes((toMinutes(item.startTime) ?? 0) + shift) : item.startTime,
        title: item.title,
        departmentName: item.departmentName,
        responsibleName: item.responsibleName,
        support: item.support,
        needsRegie: item.needsRegie,
        durationMin: item.durationMin,
        notes: item.notes,
      }))
    );
    await Promise.all(
      instructions
        .filter((i) => i.instructions.trim())
        .map((i) => CulteInstructionService.save(to.id, { id: i.departmentId, name: i.departmentName }, i.instructions, actor))
    );
  },
};
