import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { compareEventsInDay, todayISO } from '../lib/culteTiming';
import type {
  ChecklistItem,
  ChecklistProgress,
  ChecklistScope,
  ChecklistStatus,
  ChecklistTemplate,
  CulteEventInfo,
} from '../types/culteBrief.types';
import type { Actor } from './culteBrief.service';

function mapTemplate(row: any): ChecklistTemplate {
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    position: row.position,
    task: row.task,
    indicator: row.indicator,
    scope: row.scope,
    isActive: !!row.is_active,
  };
}

function mapItem(row: any): ChecklistItem {
  return {
    id: row.id,
    eventId: row.event_id,
    templateId: row.template_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    position: row.position,
    task: row.task,
    indicator: row.indicator,
    status: row.status,
    responsibleName: row.responsible_name,
    observation: row.observation,
    inherited: !!row.inherited,
    checkedByName: row.checked_by_name,
    checkedAt: row.checked_at,
  };
}

export interface TemplateInput {
  id?: string;
  departmentId: string | null;
  departmentName: string;
  task: string;
  indicator?: string | null;
  scope?: ChecklistScope;
  isActive?: boolean;
}

export function checklistProgress(items: Pick<ChecklistItem, 'status'>[]): ChecklistProgress {
  const progress: ChecklistProgress = { total: items.length, ok: 0, nok: 0, pending: 0 };
  items.forEach((item) => {
    if (item.status === 'ok') progress.ok += 1;
    else if (item.status === 'nok') progress.nok += 1;
    else progress.pending += 1;
  });
  return progress;
}

// ── Modèles de contrôle (par département) ────────────────────────────────────────────────────────
export const CulteChecklistTemplateService = {
  async list(): Promise<ChecklistTemplate[]> {
    const { data, error } = await supabase
      .from('culte_checklist_templates')
      .select('*')
      .eq('church_id', getChurchId())
      .order('department_name', { ascending: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapTemplate);
  },

  async save(input: TemplateInput, position?: number): Promise<ChecklistTemplate> {
    const fields = {
      department_id: input.departmentId,
      department_name: input.departmentName,
      task: input.task.trim(),
      indicator: input.indicator?.trim() || null,
      scope: input.scope ?? 'service',
      is_active: input.isActive ?? true,
    };
    if (input.id) {
      const { data, error } = await supabase.from('culte_checklist_templates').update(fields).eq('id', input.id).select().single();
      if (error) throw error;
      return mapTemplate(data);
    }
    const { data, error } = await supabase
      .from('culte_checklist_templates')
      .insert({ church_id: getChurchId(), position: position ?? 0, ...fields })
      .select()
      .single();
    if (error) throw error;
    return mapTemplate(data);
  },

  /** Modifie seulement les champs donnés : deux modifications rapprochées ne s'écrasent pas. */
  async update(id: string, patch: { task?: string; indicator?: string | null; scope?: ChecklistScope; isActive?: boolean }): Promise<ChecklistTemplate> {
    const fields: Record<string, any> = {};
    if (patch.task !== undefined) fields.task = patch.task.trim();
    if (patch.indicator !== undefined) fields.indicator = patch.indicator?.trim() || null;
    if (patch.scope !== undefined) fields.scope = patch.scope;
    if (patch.isActive !== undefined) fields.is_active = patch.isActive;
    const { data, error } = await supabase.from('culte_checklist_templates').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return mapTemplate(data);
  },

  /** Ajoute plusieurs points à la suite des existants du département (suggestions du guide). */
  async addMany(rows: TemplateInput[], startPosition: number): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await supabase.from('culte_checklist_templates').insert(
      rows.map((row, index) => ({
        church_id: getChurchId(),
        department_id: row.departmentId,
        department_name: row.departmentName,
        position: startPosition + index,
        task: row.task.trim(),
        indicator: row.indicator?.trim() || null,
        scope: row.scope ?? 'service',
        is_active: true,
      }))
    );
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('culte_checklist_templates').delete().eq('id', id);
    if (error) throw error;
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const results = await Promise.all(
      orderedIds.map((id, index) => supabase.from('culte_checklist_templates').update({ position: index }).eq('id', id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
  },
};

// ── Points de contrôle d'un culte ───────────────────────────────────────────────────────────────
export const CulteChecklistService = {
  async list(eventId: string): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
      .from('culte_checklist_items')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('event_id', eventId)
      .order('department_name', { ascending: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapItem);
  },

  /**
   * Crée les points de contrôle du culte à partir des modèles (une seule fois, sans écraser ce qui
   * existe). Les points « une fois par jour » sont repris du culte précédent du même jour : ce qui
   * a été vérifié avant le 1er culte n'est pas à re-vérifier avant le 2e. Cette reprise est rejouée à
   * chaque appel pour les points encore « à vérifier » : ouvrir le 2e culte avant que le 1er soit
   * contrôlé ne les laisse pas en attente pour toujours.
   */
  async ensureForEvent(event: CulteEventInfo, dayEvents: CulteEventInfo[]): Promise<void> {
    // Jamais de points créés sur un culte passé : ouvrir un ancien culte n'y injecte pas les modèles d'aujourd'hui
    if (event.serviceDate < todayISO()) return;

    const templates = (await CulteChecklistTemplateService.list()).filter((t) => t.isActive);
    if (templates.length === 0) return;

    const existing = await this.list(event.id);
    const have = new Set(existing.map((item) => item.templateId).filter(Boolean));
    const missing = templates.filter((t) => !have.has(t.id));
    const dayTemplateIds = new Set(templates.filter((t) => t.scope === 'day').map((t) => t.id));
    const pendingDay = existing.filter((item) => item.templateId && dayTemplateIds.has(item.templateId) && item.status === 'pending' && !item.inherited);
    if (missing.length === 0 && pendingDay.length === 0) return;

    // Points déjà vérifiés lors d'un culte précédent du même jour (le plus récent l'emporte)
    const earlier = dayEvents.filter((e) => e.id !== event.id && compareEventsInDay(e, event) < 0).sort(compareEventsInDay);
    const inherited = new Map<string, ChecklistItem>();
    if (earlier.length > 0) {
      const { data, error } = await supabase
        .from('culte_checklist_items')
        .select('*')
        .eq('church_id', getChurchId())
        .in('event_id', earlier.map((e) => e.id))
        .not('template_id', 'is', null);
      if (error) throw error;
      const byEvent = new Map<string, ChecklistItem[]>();
      (data ?? []).map(mapItem).forEach((item: ChecklistItem) => {
        byEvent.set(item.eventId, [...(byEvent.get(item.eventId) ?? []), item]);
      });
      earlier.forEach((e) => (byEvent.get(e.id) ?? []).forEach((item) => item.templateId && inherited.set(item.templateId, item)));
    }

    if (missing.length === 0) {
      await this.refreshInherited(pendingDay, inherited);
      return;
    }

    const rows = missing.map((template) => {
      const source = template.scope === 'day' ? inherited.get(template.id) : undefined;
      const reuse = !!source && source.status !== 'pending';
      return {
        church_id: getChurchId(),
        event_id: event.id,
        template_id: template.id,
        department_id: template.departmentId,
        department_name: template.departmentName,
        position: template.position,
        task: template.task,
        indicator: template.indicator,
        status: reuse ? source!.status : 'pending',
        responsible_name: reuse ? source!.responsibleName : null,
        observation: reuse ? source!.observation : null,
        inherited: reuse,
        checked_by_name: reuse ? source!.checkedByName : null,
        checked_at: reuse ? source!.checkedAt : null,
      };
    });
    const { error } = await supabase
      .from('culte_checklist_items')
      .upsert(rows, { onConflict: 'event_id,template_id', ignoreDuplicates: true });
    if (error) throw error;
    await this.refreshInherited(pendingDay, inherited);
  },

  /** Reprend, pour les points « une fois par jour » encore à vérifier, le résultat du culte précédent s'il existe désormais. */
  async refreshInherited(pending: ChecklistItem[], inherited: Map<string, ChecklistItem>): Promise<void> {
    const now = new Date().toISOString();
    for (const item of pending) {
      const source = item.templateId ? inherited.get(item.templateId) : undefined;
      if (!source || source.status === 'pending') continue;
      const { error } = await supabase
        .from('culte_checklist_items')
        .update({
          status: source.status,
          inherited: true,
          responsible_name: item.responsibleName ?? source.responsibleName,
          observation: item.observation ?? source.observation,
          checked_by_name: source.checkedByName,
          checked_at: source.checkedAt,
          updated_at: now,
        })
        // seulement s'il n'a pas été coché entre-temps
        .eq('id', item.id)
        .eq('status', 'pending');
      if (error) throw error;
    }
  },

  async setStatus(itemId: string, status: ChecklistStatus, actor: Actor): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from('culte_checklist_items')
      .update({
        status,
        inherited: false,
        checked_by: status === 'pending' ? null : actor.id ?? null,
        checked_by_name: status === 'pending' ? null : actor.name ?? null,
        checked_at: status === 'pending' ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return mapItem(data);
  },

  async update(itemId: string, patch: { observation?: string | null; responsibleName?: string | null }): Promise<ChecklistItem> {
    const fields: Record<string, any> = { updated_at: new Date().toISOString() };
    if (patch.observation !== undefined) fields.observation = patch.observation?.trim() || null;
    if (patch.responsibleName !== undefined) fields.responsible_name = patch.responsibleName?.trim() || null;
    const { data, error } = await supabase.from('culte_checklist_items').update(fields).eq('id', itemId).select().single();
    if (error) throw error;
    return mapItem(data);
  },

  /** Point ajouté à la main pour ce culte seulement (hors modèle). */
  async addCustom(eventId: string, department: { id: string | null; name: string }, task: string): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from('culte_checklist_items')
      .insert({
        church_id: getChurchId(),
        event_id: eventId,
        template_id: null,
        department_id: department.id,
        department_name: department.name,
        position: 1000,
        task: task.trim(),
      })
      .select()
      .single();
    if (error) throw error;
    return mapItem(data);
  },

  async remove(itemId: string): Promise<void> {
    const { error } = await supabase.from('culte_checklist_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  /** Points « non OK » des cultes donnés (ex. à corriger depuis le 1er culte avant le 2e). */
  async listNok(eventIds: string[]): Promise<ChecklistItem[]> {
    if (eventIds.length === 0) return [];
    const { data, error } = await supabase
      .from('culte_checklist_items')
      .select('*')
      .eq('church_id', getChurchId())
      .in('event_id', eventIds)
      .eq('status', 'nok');
    if (error) throw error;
    return (data ?? []).map(mapItem);
  },
};
