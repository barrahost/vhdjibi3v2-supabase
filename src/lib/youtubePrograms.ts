// Classement des directs YouTube par programme de l'église.
// Mardi : Mardis du mariage ; mercredi : Rendez-vous des champions ; dimanche : 1er puis 2e culte ;
// tout autre jour (ou 3e direct d'un dimanche) : direct spécial.
// Les heures varient : on se fie au jour (heure d'Abidjan = UTC), à l'ordre des directs dans la journée
// et, en priorité, aux mots du titre quand ils sont explicites.

export type ProgramId = 'culte1' | 'culte2' | 'mardi' | 'mercredi' | 'autre' | 'essai';

export const PROGRAMS: { id: ProgramId; label: string; short: string; color: string }[] = [
  { id: 'culte1', label: 'Dimanche — 1er culte', short: '1er culte', color: '#00665C' },
  { id: 'culte2', label: 'Dimanche — 2e culte', short: '2e culte', color: '#0EA5A4' },
  { id: 'mardi', label: 'Mardis du mariage', short: 'Mardi mariage', color: '#DB2777' },
  { id: 'mercredi', label: 'Rendez-vous des champions', short: 'RDV champions', color: '#F59E0B' },
  { id: 'autre', label: 'Directs spéciaux', short: 'Spécial', color: '#7C3AED' },
  { id: 'essai', label: 'Essais / coupures (< 10 min)', short: 'Essai', color: '#9CA3AF' },
];
export const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p])) as Record<ProgramId, (typeof PROGRAMS)[number]>;

/** Un direct plus court est considéré comme un essai ou une coupure : il ne compte pas comme un culte. */
export const MIN_PROGRAM_SECONDS = 10 * 60;

interface LiveLike {
  videoId: string;
  title: string;
  startedAt: Date;
  durationSeconds: number | null;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Programme indiqué par le titre, s'il est explicite. */
export function programFromTitle(title: string): ProgramId | null {
  const t = normalize(title);
  if (/mariage/.test(t)) return 'mardi';
  if (/champion/.test(t)) return 'mercredi';
  if (/\b(1er|1e|premier|1st)\s*culte\b/.test(t) || /culte\s*(1|i)\b/.test(t)) return 'culte1';
  if (/\b(2e|2eme|2nd|second|deuxieme)\s*culte\b/.test(t) || /culte\s*(2|ii)\b/.test(t)) return 'culte2';
  return null;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Programme de chaque direct (clé : videoId). */
export function classifyLives(lives: LiveLike[]): Map<string, ProgramId> {
  const result = new Map<string, ProgramId>();
  const sundays = new Map<string, LiveLike[]>();

  for (const live of lives) {
    const fromTitle = programFromTitle(live.title);
    const tooShort = live.durationSeconds !== null && live.durationSeconds < MIN_PROGRAM_SECONDS;
    if (fromTitle && !tooShort) {
      result.set(live.videoId, fromTitle);
      continue;
    }
    if (tooShort) {
      result.set(live.videoId, 'essai');
      continue;
    }
    const weekday = live.startedAt.getUTCDay();
    if (weekday === 2) result.set(live.videoId, 'mardi');
    else if (weekday === 3) result.set(live.videoId, 'mercredi');
    else if (weekday === 0) {
      const key = dayKey(live.startedAt);
      if (!sundays.has(key)) sundays.set(key, []);
      sundays.get(key)!.push(live);
    } else result.set(live.videoId, 'autre');
  }

  // Dimanche : 1er culte puis 2e culte dans l'ordre de la journée (en tenant compte des titres déjà explicites)
  for (const [key, list] of sundays) {
    const titled = lives.filter((l) => dayKey(l.startedAt) === key && l.startedAt.getUTCDay() === 0 && result.get(l.videoId));
    const taken = new Set(titled.map((l) => result.get(l.videoId)));
    const free: ProgramId[] = (['culte1', 'culte2'] as ProgramId[]).filter((p) => !taken.has(p));
    list
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .forEach((live, i) => result.set(live.videoId, free[i] ?? 'autre'));
  }
  return result;
}
