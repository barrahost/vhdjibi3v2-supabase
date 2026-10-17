import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import type { DepartmentDebrief } from '../types/culteBrief.types';
import type { Actor } from './culteBrief.service';

function mapDebrief(row: any): DepartmentDebrief {
  return {
    id: row.id,
    eventId: row.event_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    positives: row.positives ?? '',
    difficulties: row.difficulties ?? '',
    causes: row.causes ?? '',
    needs: row.needs ?? '',
    solutions: row.solutions ?? '',
    submittedByName: row.submitted_by_name,
    updatedAt: row.updated_at,
  };
}

export interface DebriefSheetValues {
  positives: string;
  difficulties: string;
  causes: string;
  needs: string;
  solutions: string;
}

export const blankDebriefSheet = (): DebriefSheetValues => ({
  positives: '',
  difficulties: '',
  causes: '',
  needs: '',
  solutions: '',
});

export const isDebriefSheetEmpty = (v: DebriefSheetValues) =>
  !v.positives.trim() && !v.difficulties.trim() && !v.causes.trim() && !v.needs.trim() && !v.solutions.trim();

/** Texte lisible de la fiche, conservé dans les « notes » du rapport pour les écrans d'historique. */
export function debriefToNotes(v: DebriefSheetValues): string {
  const parts: [string, string][] = [
    ['Points positifs', v.positives],
    ['Difficultés rencontrées', v.difficulties],
    ['Causes identifiées', v.causes],
    ['Solutions proposées', v.solutions],
  ];
  return parts
    .filter(([, text]) => text.trim())
    .map(([label, text]) => `${label} : ${text.trim()}`)
    .join('\n');
}

export const CulteDebriefService = {
  async list(eventId: string): Promise<DepartmentDebrief[]> {
    const { data, error } = await supabase
      .from('culte_debriefs')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('event_id', eventId)
      .order('department_name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapDebrief);
  },

  /** Crée ou met à jour la fiche d'un département pour un culte. */
  async save(
    eventId: string,
    department: { id?: string | null; name: string },
    values: DebriefSheetValues,
    actor: Actor
  ): Promise<DepartmentDebrief> {
    const { data, error } = await supabase
      .from('culte_debriefs')
      .upsert(
        {
          church_id: getChurchId(),
          event_id: eventId,
          department_id: department.id ?? null,
          department_name: department.name,
          positives: values.positives.trim() || null,
          difficulties: values.difficulties.trim() || null,
          causes: values.causes.trim() || null,
          needs: values.needs.trim() || null,
          solutions: values.solutions.trim() || null,
          submitted_by: actor.id ?? null,
          submitted_by_name: actor.name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,department_name' }
      )
      .select()
      .single();
    if (error) throw error;
    return mapDebrief(data);
  },
};
