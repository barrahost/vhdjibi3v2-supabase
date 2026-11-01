// Statistiques des interactions (appels, visites, messages, SMS des bergers avec leurs âmes).
// Tout est calculé ici, en fonctions pures (testables) ; le chargement est dans services/interactionStats.service.ts
// et l'écran dans components/stats/InteractionStatsDashboard.tsx.

export type InteractionType = 'call' | 'visit' | 'message' | 'sms';
export const INTERACTION_TYPES: InteractionType[] = ['call', 'visit', 'message', 'sms'];
export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: 'Appels',
  visit: 'Visites',
  message: 'Messages',
  sms: 'SMS',
};

/** Une âme est « oubliée » sans aucun contact depuis ce nombre de jours (choix du pasteur). */
export const FORGOTTEN_AFTER_DAYS = 30;

export interface StatSoul {
  id: string;
  fullName: string;
  phone: string;
  /** shepherd_id brut : identifiant ou uid (anciennes données) d'un utilisateur. */
  shepherdKey: string | null;
  familyId: string | null;
}

export interface StatShepherd {
  id: string;
  uid?: string | null;
  fullName: string;
  phone?: string;
}

export interface StatFamily {
  id: string;
  name: string;
}

export interface StatInteraction {
  soulId: string;
  /** shepherd_id brut de l'interaction (identifiant ou uid) : qui l'a faite. */
  shepherdKey: string | null;
  type: string;
  date: Date;
}

export interface Period {
  from: Date;
  /** exclu */
  to: Date;
}

export interface StatsFilters {
  /** Identifiant canonique d'un berger, ou null (tous). */
  shepherdId: string | null;
  /** Identifiant d'une famille, ou null (toutes). */
  familyId: string | null;
  type: InteractionType | null;
}

export const NO_FILTERS: StatsFilters = { shepherdId: null, familyId: null, type: null };

// ── Périodes ───────────────────────────────────────────────────────────────────────────────
export type PeriodPreset = 'week' | 'month' | '3months' | 'year' | 'custom';

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  week: 'Cette semaine',
  month: 'Ce mois',
  '3months': '3 derniers mois',
  year: 'Cette année',
  custom: 'Personnalisée',
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Lundi de la semaine de `d`. */
export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const shift = (day.getDay() + 6) % 7;
  return addDays(day, -shift);
}

/** Période d'un préréglage, jusqu'à aujourd'hui inclus. `custom` : `from` et `to` (AAAA-MM-JJ) inclus. */
export function periodFor(preset: PeriodPreset, now = new Date(), custom?: { from: string; to: string }): Period {
  const tomorrow = addDays(startOfDay(now), 1);
  switch (preset) {
    case 'week':
      return { from: startOfWeek(now), to: tomorrow };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: tomorrow };
    case '3months':
      return { from: addDays(startOfDay(now), -90), to: tomorrow };
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: tomorrow };
    case 'custom': {
      const from = custom?.from ? new Date(`${custom.from}T00:00:00`) : addDays(startOfDay(now), -30);
      const toDay = custom?.to ? new Date(`${custom.to}T00:00:00`) : startOfDay(now);
      return { from, to: addDays(toDay, 1) };
    }
  }
}

/** Période de même durée juste avant (pour comparer). */
export function previousPeriod(period: Period): Period {
  const days = Math.max(1, Math.round((period.to.getTime() - period.from.getTime()) / 86_400_000));
  return { from: addDays(period.from, -days), to: period.from };
}

const inPeriod = (date: Date, period: Period) => date >= period.from && date < period.to;

// ── Résolution des bergers (id ou uid) ──────────────────────────────────────────────────────
export function shepherdResolver(shepherds: StatShepherd[]) {
  const byKey = new Map<string, StatShepherd>();
  shepherds.forEach((s) => {
    byKey.set(s.id, s);
    if (s.uid) byKey.set(s.uid, s);
  });
  return (key: string | null | undefined): string | null => (key ? byKey.get(key)?.id ?? key : null);
}

// ── Calculs ────────────────────────────────────────────────────────────────────────────────
export interface Kpis {
  total: number;
  previousTotal: number;
  soulsFollowed: number;
  soulsContacted: number;
  previousSoulsContacted: number;
  shepherdsCount: number;
  activeShepherds: number;
  previousActiveShepherds: number;
  averagePerShepherd: number;
  previousAveragePerShepherd: number;
}

export interface SeriesPoint {
  key: string;
  label: string;
  call: number;
  visit: number;
  message: number;
  sms: number;
  total: number;
}

export interface ShepherdRow {
  shepherd: StatShepherd;
  soulsFollowed: number;
  interactions: number;
  soulsContacted: number;
  /** 0..1, null si le berger n'a pas d'âme */
  coverage: number | null;
  lastContact: Date | null;
}

export interface ForgottenSoul {
  soul: StatSoul;
  shepherdName: string;
  familyName: string;
  lastContact: Date | null;
  /** Jours depuis le dernier contact (null : aucun contact connu). */
  daysSince: number | null;
}

export interface FamilyRow {
  family: StatFamily;
  soulsFollowed: number;
  interactions: number;
  soulsContacted: number;
  coverage: number | null;
}

export interface InteractionStatsResult {
  kpis: Kpis;
  series: SeriesPoint[];
  byType: Record<InteractionType, number>;
  shepherds: ShepherdRow[];
  forgotten: ForgottenSoul[];
  families: FamilyRow[];
}

export const normalizeType = (type: string): InteractionType | null =>
  (INTERACTION_TYPES as string[]).includes(type) ? (type as InteractionType) : null;

const percent = (part: number, total: number) => (total ? part / total : null);

/** Regroupement par semaine (lundi) ou, au-delà de ~3 mois, par mois. */
function bucketsFor(period: Period): { key: (d: Date) => string; points: SeriesPoint[] } {
  const days = (period.to.getTime() - period.from.getTime()) / 86_400_000;
  const blank = (key: string, label: string): SeriesPoint => ({ key, label, call: 0, visit: 0, message: 0, sms: 0, total: 0 });
  const points: SeriesPoint[] = [];
  if (days > 100) {
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    for (let d = new Date(period.from.getFullYear(), period.from.getMonth(), 1); d < period.to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      points.push(blank(monthKey(d), d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })));
    }
    return { key: monthKey, points };
  }
  if (days <= 8) {
    const dayKey = (d: Date) => startOfDay(d).toISOString().slice(0, 10);
    for (let d = startOfDay(period.from); d < period.to; d = addDays(d, 1)) {
      points.push(blank(dayKey(d), d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })));
    }
    return { key: dayKey, points };
  }
  const weekKey = (d: Date) => startOfWeek(d).toISOString().slice(0, 10);
  for (let d = startOfWeek(period.from); d < period.to; d = addDays(d, 7)) {
    points.push(blank(weekKey(d), `sem. ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`));
  }
  return { key: weekKey, points };
}

/**
 * Toutes les statistiques d'une période, sur un périmètre déjà délimité (église, familles d'un responsable, ou âmes
 * d'un berger) et des filtres (berger, famille, type).
 *  - Âmes suivies : âmes actives ayant un berger, dans le périmètre filtré.
 *  - Interactions : celles des âmes suivies (et du type filtré) sur la période.
 *  - Âmes contactées : âmes suivies ayant eu au moins une interaction sur la période (quel que soit l'auteur).
 *  - Bergers actifs : bergers ayant fait au moins une interaction sur la période.
 *  - Âmes oubliées : âmes suivies sans aucun contact depuis 30 jours ou plus (à la date `now`, hors filtre de type).
 */
export function computeInteractionStats(params: {
  souls: StatSoul[];
  shepherds: StatShepherd[];
  families: StatFamily[];
  interactions: StatInteraction[];
  period: Period;
  filters?: StatsFilters;
  now?: Date;
}): InteractionStatsResult {
  const { period, filters = NO_FILTERS, now = new Date() } = params;
  const resolve = shepherdResolver(params.shepherds);
  const shepherdById = new Map(params.shepherds.map((s) => [s.id, s]));
  const familyById = new Map(params.families.map((f) => [f.id, f]));

  // Âmes suivies dans le périmètre filtré
  const souls = params.souls.filter((s) => {
    const shepherdId = resolve(s.shepherdKey);
    if (!shepherdId) return false;
    if (filters.shepherdId && shepherdId !== filters.shepherdId) return false;
    if (filters.familyId && s.familyId !== filters.familyId) return false;
    return true;
  });
  const soulById = new Map(souls.map((s) => [s.id, s]));

  // Interactions de ces âmes (toutes dates : utile pour le dernier contact), puis du type demandé
  const allForSouls = params.interactions.filter((i) => soulById.has(i.soulId));
  const typed = filters.type ? allForSouls.filter((i) => i.type === filters.type) : allForSouls;
  const current = typed.filter((i) => inPeriod(i.date, period));
  const previous = typed.filter((i) => inPeriod(i.date, previousPeriod(period)));

  // Bergers du périmètre : ceux qui suivent au moins une âme (ou le berger filtré)
  const shepherdIds = new Set(souls.map((s) => resolve(s.shepherdKey)!).filter(Boolean));
  if (filters.shepherdId) shepherdIds.add(filters.shepherdId);
  const activeIn = (list: StatInteraction[]) =>
    new Set(list.map((i) => resolve(i.shepherdKey)).filter((id): id is string => !!id && shepherdIds.has(id)));
  const activeNow = activeIn(current);
  const activeBefore = activeIn(previous);
  const contactedNow = new Set(current.map((i) => i.soulId));
  const contactedBefore = new Set(previous.map((i) => i.soulId));

  const kpis: Kpis = {
    total: current.length,
    previousTotal: previous.length,
    soulsFollowed: souls.length,
    soulsContacted: contactedNow.size,
    previousSoulsContacted: contactedBefore.size,
    shepherdsCount: shepherdIds.size,
    activeShepherds: activeNow.size,
    previousActiveShepherds: activeBefore.size,
    averagePerShepherd: shepherdIds.size ? current.length / shepherdIds.size : 0,
    previousAveragePerShepherd: shepherdIds.size ? previous.length / shepherdIds.size : 0,
  };

  // Évolution
  const { key, points } = bucketsFor(period);
  const pointByKey = new Map(points.map((p) => [p.key, p]));
  const byType: Record<InteractionType, number> = { call: 0, visit: 0, message: 0, sms: 0 };
  current.forEach((i) => {
    const type = normalizeType(i.type);
    const point = pointByKey.get(key(i.date));
    if (type) byType[type] += 1;
    if (point) {
      if (type) point[type] += 1;
      point.total += 1;
    }
  });

  // Dernier contact de chaque âme (tous types confondus)
  const lastBySoul = new Map<string, Date>();
  allForSouls.forEach((i) => {
    if (i.date > now) return;
    const last = lastBySoul.get(i.soulId);
    if (!last || i.date > last) lastBySoul.set(i.soulId, i.date);
  });

  // Classement des bergers
  const soulsByShepherd = new Map<string, StatSoul[]>();
  souls.forEach((s) => {
    const id = resolve(s.shepherdKey)!;
    if (!soulsByShepherd.has(id)) soulsByShepherd.set(id, []);
    soulsByShepherd.get(id)!.push(s);
  });
  const doneBy = new Map<string, number>();
  current.forEach((i) => {
    const id = resolve(i.shepherdKey);
    if (id) doneBy.set(id, (doneBy.get(id) ?? 0) + 1);
  });
  const shepherdRows: ShepherdRow[] = Array.from(shepherdIds).map((id) => {
    const mine = soulsByShepherd.get(id) ?? [];
    const contacted = mine.filter((s) => contactedNow.has(s.id)).length;
    const last = mine.reduce<Date | null>((acc, s) => {
      const d = lastBySoul.get(s.id);
      return d && (!acc || d > acc) ? d : acc;
    }, null);
    return {
      shepherd: shepherdById.get(id) ?? { id, fullName: 'Berger inconnu' },
      soulsFollowed: mine.length,
      interactions: doneBy.get(id) ?? 0,
      soulsContacted: contacted,
      coverage: percent(contacted, mine.length),
      lastContact: last,
    };
  });

  // Âmes oubliées
  const dayMs = 86_400_000;
  const forgotten: ForgottenSoul[] = souls
    .map((soul) => {
      const last = lastBySoul.get(soul.id) ?? null;
      const daysSince = last ? Math.floor((now.getTime() - last.getTime()) / dayMs) : null;
      return {
        soul,
        shepherdName: shepherdById.get(resolve(soul.shepherdKey) ?? '')?.fullName ?? '—',
        familyName: soul.familyId ? familyById.get(soul.familyId)?.name ?? '' : '',
        lastContact: last,
        daysSince,
      };
    })
    .filter((f) => f.daysSince === null || f.daysSince >= FORGOTTEN_AFTER_DAYS)
    // Jamais contactées d'abord, puis les plus anciennes
    .sort((a, b) => (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity) || a.soul.fullName.localeCompare(b.soul.fullName, 'fr'));

  // Familles
  const familyRows: FamilyRow[] = params.families
    .map((family) => {
      const mine = souls.filter((s) => s.familyId === family.id);
      const ids = new Set(mine.map((s) => s.id));
      const contacted = mine.filter((s) => contactedNow.has(s.id)).length;
      return {
        family,
        soulsFollowed: mine.length,
        interactions: current.filter((i) => ids.has(i.soulId)).length,
        soulsContacted: contacted,
        coverage: percent(contacted, mine.length),
      };
    })
    .filter((row) => row.soulsFollowed > 0);

  return { kpis, series: points, byType, shepherds: shepherdRows, forgotten, families: familyRows };
}

/** Évolution en % par rapport à la période précédente (null : pas de comparaison possible). */
export function trend(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}
