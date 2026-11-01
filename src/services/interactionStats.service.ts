import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { isShepherdUser } from '../utils/roleHelpers';
import type { StatFamily, StatInteraction, StatShepherd, StatSoul } from '../lib/interactionStats';

/**
 * Périmètre des statistiques :
 *  - church : toute l'église (administrateur, pasteur) ;
 *  - family : la ou les familles dont l'utilisateur est responsable ;
 *  - shepherd : les âmes de l'utilisateur (berger).
 */
export type StatsScope = 'church' | 'family' | 'shepherd';

export interface InteractionStatsData {
  souls: StatSoul[];
  shepherds: StatShepherd[];
  families: StatFamily[];
  interactions: StatInteraction[];
  /** Interactions chargées à partir de cette date. */
  loadedFrom: Date;
}

const PAGE = 1000;

/** Lit toutes les lignes d'une requête, par pages de 1000 (limite de Supabase). */
async function fetchAll<T>(build: () => any): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

const chunk = <T,>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

/**
 * Charge âmes, bergers, familles et interactions du périmètre, depuis `since`.
 * `userKeys` : identifiant et uid de l'utilisateur connecté (utiles pour family et shepherd).
 */
export async function loadInteractionStatsData(scope: StatsScope, userKeys: string[], since: Date): Promise<InteractionStatsData> {
  const churchId = getChurchId();
  const keys = userKeys.filter(Boolean);

  const [usersRaw, familiesRaw] = await Promise.all([
    fetchAll<any>(() =>
      supabase.from('users').select('id, uid, full_name, phone, role, business_profiles, status').eq('church_id', churchId).order('id'),
    ),
    fetchAll<any>(() => supabase.from('service_families').select('id, name, leader_id').eq('church_id', churchId).order('id')),
  ]);

  const families: StatFamily[] = familiesRaw
    .filter((f) => scope !== 'family' || keys.includes(f.leader_id))
    .map((f) => ({ id: f.id, name: f.name || 'Famille sans nom' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  // Âmes actives du périmètre
  const soulsQuery = () => {
    let q = supabase
      .from('souls')
      .select('id, full_name, phone, shepherd_id, service_family_id, status')
      .eq('church_id', churchId)
      .or('status.eq.active,status.is.null');
    if (scope === 'family') q = q.in('service_family_id', families.length ? families.map((f) => f.id) : ['__aucune__']);
    if (scope === 'shepherd') q = q.in('shepherd_id', keys.length ? keys : ['__aucun__']);
    return q.order('id');
  };
  const soulsRaw = scope === 'family' && !families.length ? [] : await fetchAll<any>(soulsQuery);
  const souls: StatSoul[] = soulsRaw.map((s) => ({
    id: s.id,
    fullName: s.full_name || 'Sans nom',
    phone: s.phone || '',
    shepherdKey: s.shepherd_id ?? null,
    familyId: s.service_family_id ?? null,
  }));

  // Bergers : utilisateurs bergers/stagiaires, et toute personne à qui une âme est confiée
  const ownerKeys = new Set(souls.map((s) => s.shepherdKey).filter(Boolean) as string[]);
  const shepherds: StatShepherd[] = usersRaw
    .filter((u) => ownerKeys.has(u.id) || (u.uid && ownerKeys.has(u.uid)) || (scope === 'church' && u.status !== 'inactive' && isShepherdUser(u)))
    .map((u) => ({ id: u.id, uid: u.uid ?? null, fullName: u.full_name || 'Sans nom', phone: u.phone || '' }));

  // Interactions (suivi des âmes, hors fiches d'évangélisation)
  const interactionsQuery = (soulIds?: string[]) => () => {
    let q = supabase
      .from('interactions')
      .select('id, soul_id, shepherd_id, type, date')
      .eq('church_id', churchId)
      .or('source_collection.is.null,source_collection.eq.souls')
      .gte('date', since.toISOString());
    if (soulIds) q = q.in('soul_id', soulIds);
    return q.order('id');
  };
  let interactionsRaw: any[];
  if (scope === 'church' || souls.length > 400) {
    interactionsRaw = await fetchAll<any>(interactionsQuery());
  } else {
    const parts = await Promise.all(chunk(souls.map((s) => s.id), 100).map((ids) => fetchAll<any>(interactionsQuery(ids))));
    interactionsRaw = parts.flat();
  }
  const soulIds = new Set(souls.map((s) => s.id));
  const interactions: StatInteraction[] = interactionsRaw
    .filter((i) => soulIds.has(i.soul_id) && i.date)
    .map((i) => ({ soulId: i.soul_id, shepherdKey: i.shepherd_id ?? null, type: i.type, date: new Date(i.date) }))
    .filter((i) => !Number.isNaN(i.date.getTime()));

  return { souls, shepherds, families, interactions, loadedFrom: since };
}
