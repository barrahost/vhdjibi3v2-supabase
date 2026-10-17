import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { formatDateFr, todayISO } from '../lib/culteTiming';
import {
  actionTitle,
  isActionClosed,
  type ActionInput,
  type ActionPriority,
  type ActionStatus,
  type CulteAction,
} from '../types/culteBrief.types';
import { CulteDirectory } from './culteDirectory.service';
import { CulteNotifyService } from './culteNotify.service';
import type { Actor } from './culteBrief.service';

// Le plan d'actions s'appuie sur la table historique des « besoins signalés » (culte_report_needs),
// étendue par supabase_culte_brief_debrief.sql : les besoins existants y sont déjà des actions.

function mapAction(row: any): CulteAction {
  return {
    id: row.id,
    eventId: row.event_id ?? null,
    reportId: row.culte_report_id ?? null,
    source: row.source ?? 'rapport',
    departmentName: row.department_name,
    description: row.description,
    cause: row.cause ?? null,
    decision: row.decision ?? null,
    indicator: row.indicator ?? null,
    responsibleId: row.responsible_id ?? null,
    responsibleName: row.responsible_name ?? null,
    dueDate: row.due_date ?? null,
    priority: row.priority,
    status: row.status ?? (row.is_addressed ? 'done' : 'todo'),
    needsArbitration: !!row.needs_arbitration,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    addressedAt: row.addressed_at ?? null,
  };
}

export interface ActionFilters {
  eventId?: string;
  /** Actions nées de l'un de ces cultes. */
  eventIds?: string[];
  /** 'open' = à faire / en cours ; 'closed' = terminées / abandonnées. */
  scope?: 'open' | 'closed' | 'all';
  responsibleId?: string;
  departmentNames?: string[];
}

export const isOverdue = (action: Pick<CulteAction, 'dueDate' | 'status'>, today = todayISO()) =>
  !!action.dueDate && action.dueDate < today && !isActionClosed(action.status);

export interface ActionsSummary {
  open: number;
  overdue: number;
  toArbitrate: number;
  highPriority: number;
}

export function summarizeActions(actions: CulteAction[]): ActionsSummary {
  const today = todayISO();
  const open = actions.filter((a) => !isActionClosed(a.status));
  return {
    open: open.length,
    overdue: open.filter((a) => isOverdue(a, today)).length,
    toArbitrate: open.filter((a) => a.needsArbitration).length,
    highPriority: open.filter((a) => a.priority === 'high').length,
  };
}

const toRow = (input: Partial<ActionInput>) => {
  const row: Record<string, any> = {};
  if (input.eventId !== undefined) row.event_id = input.eventId;
  if (input.reportId !== undefined) row.culte_report_id = input.reportId;
  if (input.source !== undefined) row.source = input.source;
  if (input.departmentName !== undefined) row.department_name = input.departmentName;
  if (input.description !== undefined) row.description = input.description.trim();
  if (input.cause !== undefined) row.cause = input.cause?.trim() || null;
  if (input.decision !== undefined) row.decision = input.decision?.trim() || null;
  if (input.indicator !== undefined) row.indicator = input.indicator?.trim() || null;
  if (input.responsibleId !== undefined) row.responsible_id = input.responsibleId || null;
  if (input.responsibleName !== undefined) row.responsible_name = input.responsibleName?.trim() || null;
  if (input.dueDate !== undefined) row.due_date = input.dueDate || null;
  if (input.priority !== undefined) row.priority = input.priority;
  if (input.needsArbitration !== undefined) row.needs_arbitration = input.needsArbitration;
  return row;
};

/** Coupe un texte destiné à un SMS (points de suspension en ASCII : trois caractères, comptés tels quels). */
const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text);

/** Prévient la personne qui reçoit une action (push, SMS de secours). Ne lève jamais. */
async function notifyAssignee(action: CulteAction, actor: Actor): Promise<void> {
  if (!action.responsibleId || action.responsibleId === actor.id) return;
  try {
    const users = await CulteDirectory.users();
    const person = users.find((u) => u.id === action.responsibleId);
    const firstName = (person?.fullName || action.responsibleName || '').split(' ')[0];
    const title = actionTitle(action);
    const due = action.dueDate ? ` — pour le ${formatDateFr(action.dueDate)}` : '';
    // SMS : un seul segment (160 caractères) ; le titre prend la place qui reste pour ne pas couper « Plan d'actions »
    const smsStart = `Bonjour ${firstName}, action confiée (${action.departmentName}) : `;
    const smsEnd = `${due.replace('—', '-')}. Voir Plan d'actions sur Bergerie.`;
    const smsTitle = truncate(title, Math.max(20, 160 - smsStart.length - smsEnd.length));
    await CulteNotifyService.notifyUsers([action.responsibleId], {
      title: 'Une action t\'est confiée',
      body: `${title}${due}`,
      url: '/plan-actions',
      sms: `${smsStart}${smsTitle}${smsEnd}`,
    });
  } catch (error) {
    console.error('Erreur lors de la notification de l\'action:', error);
  }
}

export const CulteActionService = {
  async list(filters: ActionFilters = {}): Promise<CulteAction[]> {
    let query = supabase
      .from('culte_report_needs')
      .select('*')
      .eq('church_id', getChurchId())
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (filters.eventId) query = query.eq('event_id', filters.eventId);
    if (filters.eventIds) query = query.in('event_id', filters.eventIds);
    if (filters.scope === 'open') query = query.in('status', ['todo', 'in_progress']);
    if (filters.scope === 'closed') query = query.in('status', ['done', 'dropped']);
    if (filters.responsibleId) query = query.eq('responsible_id', filters.responsibleId);
    if (filters.departmentNames && filters.departmentNames.length > 0) query = query.in('department_name', filters.departmentNames);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapAction);
  },

  async create(input: ActionInput, actor: Actor): Promise<CulteAction> {
    const { data, error } = await supabase
      .from('culte_report_needs')
      .insert({
        church_id: getChurchId(),
        priority: input.priority ?? 'medium',
        status: 'todo',
        created_by: actor.id ?? null,
        created_by_name: actor.name ?? null,
        ...toRow({ needsArbitration: false, ...input }),
      })
      .select()
      .single();
    if (error) throw error;
    const action = mapAction(data);
    void notifyAssignee(action, actor);
    return action;
  },

  async update(id: string, patch: Partial<ActionInput> & { status?: ActionStatus }, actor: Actor): Promise<CulteAction> {
    const before = patch.responsibleId !== undefined ? await this.getById(id) : null;
    const fields: Record<string, any> = toRow(patch);
    if (patch.status) {
      fields.status = patch.status;
      if (isActionClosed(patch.status)) fields.addressed_by = actor.id ?? null;
    }
    const { data, error } = await supabase.from('culte_report_needs').update(fields).eq('id', id).select().single();
    if (error) throw error;
    const action = mapAction(data);
    if (before && action.responsibleId && action.responsibleId !== before.responsibleId) void notifyAssignee(action, actor);
    return action;
  },

  setStatus(id: string, status: ActionStatus, actor: Actor): Promise<CulteAction> {
    return this.update(id, { status }, actor);
  },

  async getById(id: string): Promise<CulteAction | null> {
    const { data, error } = await supabase.from('culte_report_needs').select('*').eq('id', id).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? mapAction(data[0]) : null;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('culte_report_needs').delete().eq('id', id);
    if (error) throw error;
  },

  /** Crée une action par ligne de besoin pas encore enregistrée pour ce culte et ce département. */
  async createNeedsFromLines(
    params: {
      eventId: string;
      reportId?: string | null;
      departmentName: string;
      text: string;
      /** Besoins déjà enregistrés dans la fiche : ces lignes-là ont déjà été converties (ou supprimées volontairement du plan). */
      previousText?: string;
      source?: 'debrief' | 'rapport';
      priority?: ActionPriority;
    },
    actor: Actor
  ): Promise<number> {
    const toLines = (text: string) =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    const alreadyConverted = new Set(toLines(params.previousText ?? '').map((line) => line.toLowerCase()));
    const lines = toLines(params.text).filter((line) => !alreadyConverted.has(line.toLowerCase()));
    if (lines.length === 0) return 0;

    const existing = await this.list({ eventId: params.eventId, scope: 'all' });
    const known = new Set(
      existing.filter((a) => a.departmentName === params.departmentName).map((a) => a.description.trim().toLowerCase())
    );
    const fresh = Array.from(new Set(lines)).filter((line) => !known.has(line.toLowerCase()));
    if (fresh.length === 0) return 0;

    const { error } = await supabase.from('culte_report_needs').insert(
      fresh.map((description) => ({
        church_id: getChurchId(),
        event_id: params.eventId,
        culte_report_id: params.reportId ?? null,
        department_name: params.departmentName,
        description,
        priority: params.priority ?? 'medium',
        source: params.source ?? 'debrief',
        status: 'todo',
        created_by: actor.id ?? null,
        created_by_name: actor.name ?? null,
      }))
    );
    if (error) throw error;
    return fresh.length;
  },
};
