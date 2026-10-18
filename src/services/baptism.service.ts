import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { resolveShepherds, toBaptismRow, type BaptismRow, type BaptismSummary, type ShepherdUser } from '../lib/baptism';

const COLUMNS = 'id, full_name, nickname, phone, location, is_undecided, is_servant, shepherd_id, first_visit_date, created_at, status, spiritual_profile';
const PAGE_SIZE = 1000;
const MAX_PAGES = 200; // garde-fou : 200 000 âmes

/** Les âmes actives de l'église : statut « active », ou absent (anciennes données). */
const activeSouls = (columns: string, options?: { count: 'exact'; head?: boolean }) =>
  supabase.from('souls').select(columns, options).eq('church_id', getChurchId()).or('status.eq.active,status.is.null');

/**
 * Toutes les âmes actives de l'église. Le serveur plafonne le nombre de lignes par requête : on lit donc par
 * tranches jusqu'à la fin, pour que « toutes les âmes » le soit vraiment. La lecture avance par identifiant (« après
 * le dernier lu ») et non par position : une âme supprimée ou ajoutée pendant la lecture ne décale rien.
 */
async function readAllSouls(): Promise<BaptismRow[]> {
  const byId = new Map<string, BaptismRow>();
  let last: string | null = null;
  let total: number | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let query = activeSouls(COLUMNS, page === 0 ? { count: 'exact' } : undefined).order('id', { ascending: true }).limit(PAGE_SIZE);
    if (last !== null) query = query.gt('id', last);
    const { data, error, count } = await query;
    if (error) throw error;
    if (page === 0) total = count ?? null;
    if (!data || data.length === 0) break;
    last = String(data[data.length - 1].id);
    data.forEach((row: any) => byId.set(String(row.id), toBaptismRow(row)));
    if (total !== null && byId.size >= total) break; // tout est lu : pas de requête vide en plus
  }
  return Array.from(byId.values());
}

export const BaptismService = {
  /** Toutes les âmes avec leur parcours (nouvelle naissance, baptême) et leur berger. */
  async fetchSouls(): Promise<BaptismRow[]> {
    const rows = await readAllSouls();
    return resolveShepherds(rows, await BaptismService.fetchShepherds(rows));
  },

  /**
   * Les compteurs seuls (carte du tableau de bord), sans rapatrier les âmes : 4 comptages côté serveur.
   * « À baptiser » = nés de nouveau moins ceux qui sont aussi baptisés.
   */
  async fetchSummary(): Promise<BaptismSummary> {
    const bornAgain = 'spiritual_profile->>isBornAgain';
    const baptized = 'spiritual_profile->>isBaptized';
    const count = (extra?: (q: any) => any) => {
      const query = activeSouls('id', { count: 'exact', head: true });
      return extra ? extra(query) : query;
    };
    const [all, born, bapt, both] = await Promise.all([
      count(),
      count((q) => q.eq(bornAgain, 'true')),
      count((q) => q.eq(baptized, 'true')),
      count((q) => q.eq(bornAgain, 'true').eq(baptized, 'true')),
    ]);
    [all, born, bapt, both].forEach((result) => {
      if (result.error) throw result.error;
    });
    const total = all.count ?? 0;
    const bornAgainCount = born.count ?? 0;
    const baptizedCount = bapt.count ?? 0;
    return {
      total,
      bornAgain: bornAgainCount,
      notBornAgain: total - bornAgainCount,
      baptized: baptizedCount,
      notBaptized: total - baptizedCount,
      toBaptize: bornAgainCount - (both.count ?? 0),
    };
  },

  /** Les bergers des âmes (shepherd_id est un identifiant, ou un uid pour les données migrées). Sans eux, la liste reste utilisable. */
  async fetchShepherds(rows: BaptismRow[]): Promise<ShepherdUser[]> {
    const ids = Array.from(new Set(rows.map((row) => row.shepherdId).filter((id): id is string => !!id)));
    const users = new Map<string, ShepherdUser>();
    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const select = () => supabase.from('users').select('id, uid, full_name, phone').eq('church_id', getChurchId());
        const [byId, byUid] = await Promise.all([select().in('id', chunk), select().in('uid', chunk)]);
        if (byId.error) throw byId.error;
        if (byUid.error) throw byUid.error;
        [...(byId.data ?? []), ...(byUid.data ?? [])].forEach((u: any) => {
          if (u.full_name) users.set(u.id, { id: u.id, uid: u.uid, fullName: u.full_name, phone: u.phone });
        });
      }
    } catch (error) {
      console.error('Error loading shepherds for baptism follow-up:', error);
    }
    return Array.from(users.values());
  },
};
