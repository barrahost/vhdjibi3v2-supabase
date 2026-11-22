import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { validatePhoneNumber } from '../utils/phoneValidation';
import { DEPARTMENT_TO_REPORT_TYPE, normalizeDeptName, type CulteReportType } from '../types/culteReport.types';

/**
 * Rapports de culte qu'un stagiaire peut faire : ceux des départements où il sert (sa fiche B.O.S.S,
 * retrouvée par son numéro), quand ces départements ont un rapport (ADN, Sainte Cène, Gestion des cultes…).
 */
export async function loadInternReportTypes(phone?: string | null): Promise<CulteReportType[]> {
  if (!phone) return [];
  const { formattedNumber, cleanNumber } = validatePhoneNumber(phone);
  const variants = Array.from(new Set([phone, formattedNumber, cleanNumber, cleanNumber ? `0${cleanNumber.replace(/^0/, '')}` : undefined].filter(Boolean))) as string[];
  const { data: servants, error } = await supabase
    .from('servants')
    .select('department_ids')
    .eq('church_id', getChurchId())
    .in('phone', variants);
  if (error) throw error;
  const departmentIds = Array.from(new Set((servants ?? []).flatMap((s: { department_ids: string[] | null }) => s.department_ids ?? [])));
  if (departmentIds.length === 0) return [];
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('church_id', getChurchId())
    .in('id', departmentIds);
  if (deptError) throw deptError;
  const types = (departments ?? [])
    .map((d: { name: string }) => DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(d.name)])
    .filter(Boolean) as CulteReportType[];
  return Array.from(new Set(types));
}
