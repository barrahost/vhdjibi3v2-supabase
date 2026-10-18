// Suivi du baptême : le responsable du département Baptême voit toutes les âmes avec leur parcours spirituel
// (nouvelle naissance, baptême) pour organiser son suivi. Tout est calculé ici (fonctions pures, testables) ;
// l'écran est dans pages/BaptismFollowUp.tsx.

/**
 * Pour comparer des textes : sans accents, majuscules, apostrophes ni traits d'union
 * (« N’Guessan » et « nguessan », « Jean-Marc » et « jean marc » se valent).
 */
export function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/['’‘`´]/g, '')
    .replace(/-/g, ' ');
}

/**
 * Ce département s'occupe-t-il du baptême ? (« BAPTÊME », « Département du baptême », « Baptêmes », « Baptisés »,
 * et la faute courante « bateme ».) « Baptiste » (un prénom : « Jean Baptiste ») ne compte pas.
 */
export function isBaptismDepartmentName(name?: string | null): boolean {
  return !!name && /(?:bapteme|bateme|baptis(?!te))/.test(plain(name));
}

// ── Les âmes ────────────────────────────────────────────────────────────────────────────────────
/** Membre suivi, âme indécise (n'a pas encore décidé), ou serviteur (B.O.S.S promu depuis les âmes). */
export type SoulCategory = 'member' | 'undecided' | 'servant';

export const CATEGORY_LABELS: Record<SoulCategory, string> = {
  member: 'Membres',
  undecided: 'Indécis(es)',
  servant: 'B.O.S.S',
};

export interface BaptismRow {
  id: string;
  fullName: string;
  nickname: string;
  phone: string;
  location: string;
  category: SoulCategory;
  /** Valeur brute de shepherd_id : identifiant ou uid (anciennes données) d'un utilisateur. */
  shepherdId: string | null;
  /** Identifiant canonique du berger (users.id) une fois résolu ; sinon la valeur brute. */
  shepherdKey: string | null;
  shepherdName: string;
  shepherdPhone: string;
  firstVisitDate: Date | null;
  bornAgain: boolean;
  bornAgainDate: Date | null;
  baptized: boolean;
  baptismDate: Date | null;
  /** Profil spirituel tel qu'en base, pour la frise de progression. */
  profile: Record<string, any>;
}

const truthy = (value: unknown) => value === true || value === 'true' || value === 1 || value === '1';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Le profil spirituel est un JSON libre : objet normalement, mais on ne s'y fie pas. */
function toProfile(value: unknown): Record<string, any> {
  if (typeof value === 'string') {
    try {
      return toProfile(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

/** Ligne de la table `souls` (snake_case) → ligne du suivi. */
export function toBaptismRow(row: any): BaptismRow {
  const profile = toProfile(row.spiritual_profile ?? row.spiritualProfile);
  const shepherdId = (row.shepherd_id ?? row.shepherdId ?? null) || null;
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? row.fullName ?? '').trim(),
    nickname: String(row.nickname ?? '').trim(),
    phone: String(row.phone ?? '').trim(),
    location: String(row.location ?? '').trim(),
    category: truthy(row.is_servant ?? row.isServant) ? 'servant' : truthy(row.is_undecided ?? row.isUndecided) ? 'undecided' : 'member',
    shepherdId,
    shepherdKey: shepherdId,
    shepherdName: '',
    shepherdPhone: '',
    firstVisitDate: toDate(row.first_visit_date ?? row.firstVisitDate ?? row.created_at),
    bornAgain: truthy(profile.isBornAgain),
    bornAgainDate: toDate(profile.bornAgainDate),
    baptized: truthy(profile.isBaptized),
    baptismDate: toDate(profile.baptismDate),
    profile,
  };
}

export interface ShepherdUser {
  id: string;
  uid?: string | null;
  fullName: string;
  phone?: string | null;
}

/** Associe à chaque âme le nom (et l'identifiant canonique) de son berger, que shepherd_id soit un id ou un uid. */
export function resolveShepherds(rows: BaptismRow[], users: ShepherdUser[]): BaptismRow[] {
  const byAnyId = new Map<string, ShepherdUser>();
  users.forEach((user) => {
    byAnyId.set(user.id, user);
    if (user.uid) byAnyId.set(user.uid, user);
  });
  return rows.map((row) => {
    const user = row.shepherdId ? byAnyId.get(row.shepherdId) : undefined;
    return user ? { ...row, shepherdKey: user.id, shepherdName: user.fullName, shepherdPhone: user.phone ?? '' } : row;
  });
}

// ── Parcours : nouvelle naissance et baptême ─────────────────────────────────────────────────────
/**
 *  - baptized : baptisé(e) (la nouvelle naissance peut ne pas être renseignée) ;
 *  - to_baptize : né(e) de nouveau, pas encore baptisé(e) : celles et ceux à accompagner vers le baptême ;
 *  - not_born_again : pas encore né(e) de nouveau.
 */
export type BaptismStage = 'baptized' | 'to_baptize' | 'not_born_again';

export function stageOf(row: Pick<BaptismRow, 'bornAgain' | 'baptized'>): BaptismStage {
  if (row.baptized) return 'baptized';
  return row.bornAgain ? 'to_baptize' : 'not_born_again';
}

export type YesNoAll = 'all' | 'yes' | 'no';

export interface BaptismFilters {
  /** Baptisé(e)s (yes), pas encore baptisé(e)s (no), ou tout le monde. */
  baptism: YesNoAll;
  /** Né(e)s de nouveau (yes), pas encore (no), ou tout le monde. */
  bornAgain: YesNoAll;
  category: 'all' | SoulCategory;
  /** Identifiant canonique d'un berger, 'unassigned' (sans berger), ou null (tous). */
  shepherd: string | null;
  search: string;
}

export const DEFAULT_FILTERS: BaptismFilters = { baptism: 'all', bornAgain: 'all', category: 'all', shepherd: null, search: '' };

const digits = (text: string) => text.replace(/\D/g, '');

/** Numéro cherché, tapé avec ou sans indicatif (« 07 07… » ou « +225 07 07… ») : on compare les chiffres, ou leur fin à défaut. */
function phoneMatches(phone: string, term: string): boolean {
  const have = digits(phone);
  const want = digits(term);
  if (want.length < 3 || !have) return false;
  if (have.includes(want)) return true;
  return want.length >= 8 && have.length >= 8 && have.slice(-8) === want.slice(-8);
}

function matchesSearch(row: BaptismRow, term: string): boolean {
  const words = plain(term).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = plain([row.fullName, row.nickname, row.location, row.shepherdName].join(' '));
  // chaque mot doit s'y trouver, dans n'importe quel ordre (« Awa KONE » trouve « KONE Awa »)
  return words.every((word) => text.includes(word)) || phoneMatches(row.phone, term);
}

const matches = (filter: YesNoAll, value: boolean) => filter === 'all' || (filter === 'yes') === value;

/** Filtres qui délimitent le groupe étudié (catégorie, berger, recherche) : les compteurs portent sur ce groupe. */
export function inScope(rows: BaptismRow[], filters: Pick<BaptismFilters, 'category' | 'shepherd' | 'search'>): BaptismRow[] {
  return rows.filter((row) => {
    if (filters.category !== 'all' && row.category !== filters.category) return false;
    if (filters.shepherd === 'unassigned' && row.shepherdKey) return false;
    if (filters.shepherd && filters.shepherd !== 'unassigned' && row.shepherdKey !== filters.shepherd) return false;
    return matchesSearch(row, filters.search);
  });
}

/** Filtres de parcours (baptême, nouvelle naissance), appliqués au groupe étudié. */
export function bySpiritual(rows: BaptismRow[], filters: Pick<BaptismFilters, 'baptism' | 'bornAgain'>): BaptismRow[] {
  return rows.filter((row) => matches(filters.baptism, row.baptized) && matches(filters.bornAgain, row.bornAgain));
}

export interface BaptismSummary {
  total: number;
  bornAgain: number;
  notBornAgain: number;
  baptized: number;
  notBaptized: number;
  /** Nés de nouveau et pas encore baptisés. */
  toBaptize: number;
}

export function summarize(rows: BaptismRow[]): BaptismSummary {
  const bornAgain = rows.filter((r) => r.bornAgain).length;
  const baptized = rows.filter((r) => r.baptized).length;
  return {
    total: rows.length,
    bornAgain,
    notBornAgain: rows.length - bornAgain,
    baptized,
    notBaptized: rows.length - baptized,
    toBaptize: rows.filter((r) => stageOf(r) === 'to_baptize').length,
  };
}

export type BaptismSort = 'name' | 'visit_asc' | 'visit_desc' | 'baptism_desc';

export const SORT_LABELS: Record<BaptismSort, string> = {
  name: 'Nom (A → Z)',
  visit_desc: 'Première visite : récentes d’abord',
  visit_asc: 'Première visite : anciennes d’abord',
  baptism_desc: 'Baptême : récents d’abord',
};

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

/** Ordre alphabétique français, accents ignorés (un seul collateur : bien plus rapide que localeCompare répété). */
export const compareNames = (a: string, b: string) => collator.compare(a, b);

const byName = (a: BaptismRow, b: BaptismRow) => compareNames(a.fullName, b.fullName);

/** Tri stable ; les dates absentes passent toujours en dernier. */
export function sortRows(rows: BaptismRow[], sort: BaptismSort): BaptismRow[] {
  const copy = [...rows];
  const byDate = (pick: (r: BaptismRow) => Date | null, direction: 1 | -1) => (a: BaptismRow, b: BaptismRow) => {
    const x = pick(a)?.getTime();
    const y = pick(b)?.getTime();
    if (x === undefined && y === undefined) return byName(a, b);
    if (x === undefined) return 1;
    if (y === undefined) return -1;
    return (x - y) * direction || byName(a, b);
  };
  if (sort === 'visit_asc') return copy.sort(byDate((r) => r.firstVisitDate, 1));
  if (sort === 'visit_desc') return copy.sort(byDate((r) => r.firstVisitDate, -1));
  if (sort === 'baptism_desc') return copy.sort(byDate((r) => r.baptismDate, -1));
  return copy.sort(byName);
}

/** Pourcentage arrondi, « 0 % » si le groupe est vide. */
export function percent(part: number, total: number): string {
  return `${total ? Math.round((part / total) * 100) : 0} %`;
}

/**
 * Numéro ivoirien importé sans son 0 de tête (« +225 707070707 » au lieu de « +225 0707070707 », ancien import des
 * familles) : on le rétablit pour que l'appel fonctionne. Tout autre numéro est rendu tel quel.
 */
export function repairIvorianNumber(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.length === 12 && d.startsWith('225') && '157'.includes(d[3]) ? `+2250${d.slice(3)}` : phone;
}
