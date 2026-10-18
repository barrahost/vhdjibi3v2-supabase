// Pointage des présences par le berger : fonctions pures (testables). L'écran est dans
// components/attendance/BatchAttendanceForm.tsx, les accès à la base dans services/attendance.service.ts.

export type PresenceMark = 'present' | 'absent';

/**
 * Peut pointer : l'administration, l'ADN, et toute personne qui a une casquette de berger.
 * Les casquettes sont toutes actives en permanence (plus de bascule de profil) : l'ancien drapeau « isActive »
 * enregistré en base n'est plus fiable et ne doit pas refuser un berger.
 */
export function canTakeAttendance(user: { role?: string | null; business_profiles?: any; businessProfiles?: any } | null | undefined): boolean {
  if (!user) return false;
  if (['admin', 'super_admin', 'adn', 'shepherd', 'intern'].includes(String(user.role ?? ''))) return true;
  const profiles = (user.business_profiles ?? user.businessProfiles ?? []) as any[];
  return Array.isArray(profiles) && profiles.some((p) => p && ['shepherd', 'adn', 'admin'].includes(p.type));
}

/** Voit et pointe toutes les âmes de l'église (et non seulement les siennes). */
export function seesAllSouls(user: { role?: string | null; business_profiles?: any; businessProfiles?: any } | null | undefined): boolean {
  if (!user) return false;
  if (['admin', 'super_admin', 'adn'].includes(String(user.role ?? ''))) return true;
  const profiles = (user.business_profiles ?? user.businessProfiles ?? []) as any[];
  return Array.isArray(profiles) && profiles.some((p) => p && ['adn', 'admin'].includes(p.type));
}

/** Identifiants sous lesquels une personne peut être enregistrée comme berger : id, et uid pour les données migrées. */
export function shepherdKeys(user: { id?: string | null; uid?: string | null }): string[] {
  return Array.from(new Set([user.id, user.uid].filter((v): v is string => !!v)));
}

/** « AAAA-MM-JJ » d'une date, en heure locale (c'est la journée que voit la personne). */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Les présences sont enregistrées à minuit UTC du jour du culte (« 2026-10-18T00:00:00.000Z »), comme l'a
 * toujours fait l'application. On lit le jour tel quel dans la valeur enregistrée, sans conversion de fuseau.
 */
export function storedDay(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : null;
}

export const dayToStored = (day: string) => `${day}T00:00:00.000Z`;

/** Bornes [début, fin[ d'une journée enregistrée, pour retrouver les présences déjà saisies ce jour-là. */
export function dayRange(day: string): { from: string; to: string } {
  const next = new Date(`${day}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { from: dayToStored(day), to: next.toISOString() };
}

export interface AttendanceRow {
  id: string;
  soul_id: string;
  shepherd_id: string | null;
  date: string;
  present: boolean | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const stamp = (row: AttendanceRow) => Date.parse(row.updated_at || row.created_at || '') || 0;

/**
 * Les présences déjà enregistrées pour une journée : une par âme (la plus récente), et les doublons laissés par
 * l'ancien formulaire (même âme, même jour), à supprimer à la prochaine sauvegarde.
 */
export function latestPerSoul(rows: AttendanceRow[]): { bySoul: Map<string, AttendanceRow>; duplicates: AttendanceRow[] } {
  const bySoul = new Map<string, AttendanceRow>();
  const duplicates: AttendanceRow[] = [];
  [...rows]
    .sort((a, b) => stamp(b) - stamp(a) || b.id.localeCompare(a.id))
    .forEach((row) => {
      if (bySoul.has(row.soul_id)) duplicates.push(row);
      else bySoul.set(row.soul_id, row);
    });
  return { bySoul, duplicates };
}

export interface NewAttendance {
  id: string;
  church_id: string;
  soul_id: string;
  shepherd_id: string;
  date: string;
  present: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Ce qu'il faut écrire pour enregistrer le pointage d'une journée : une présence nouvelle pour une âme pas encore
 * pointée ce jour-là, sinon la correction de la présence existante (jamais une seconde présence le même jour).
 * Seules les présences nouvelles ou modifiées sont écrites ; les doublons de la journée sont à supprimer.
 */
export function buildSave(params: {
  day: string;
  marks: Map<string, PresenceMark>;
  existing: Map<string, AttendanceRow>;
  duplicates: AttendanceRow[];
  shepherdId: string;
  churchId: string;
  now: string;
  newId: () => string;
}): { inserts: NewAttendance[]; updates: { present: boolean; ids: string[] }[]; deleteIds: string[]; created: number; updated: number } {
  const { day, marks, existing, duplicates, shepherdId, churchId, now, newId } = params;
  const inserts: NewAttendance[] = [];
  const toPresent: string[] = [];
  const toAbsent: string[] = [];
  marks.forEach((mark, soulId) => {
    const present = mark === 'present';
    const before = existing.get(soulId);
    if (before) {
      if (!!before.present !== present) (present ? toPresent : toAbsent).push(before.id);
      return;
    }
    inserts.push({ id: newId(), church_id: churchId, soul_id: soulId, shepherd_id: shepherdId, date: dayToStored(day), present, created_at: now, updated_at: now });
  });
  const updates = [
    { present: true, ids: toPresent },
    { present: false, ids: toAbsent },
  ].filter((u) => u.ids.length > 0);
  return { inserts, updates, deleteIds: duplicates.map((d) => d.id), created: inserts.length, updated: toPresent.length + toAbsent.length };
}

export interface MarkCounts {
  present: number;
  absent: number;
  unmarked: number;
}

export function countMarks(soulIds: string[], marks: Map<string, PresenceMark>): MarkCounts {
  let present = 0;
  let absent = 0;
  soulIds.forEach((id) => {
    const mark = marks.get(id);
    if (mark === 'present') present += 1;
    else if (mark === 'absent') absent += 1;
  });
  return { present, absent, unmarked: soulIds.length - present - absent };
}
