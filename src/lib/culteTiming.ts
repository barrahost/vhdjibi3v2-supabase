import type { CulteEventInfo } from '../types/culteBrief.types';

const pad = (n: number) => String(n).padStart(2, '0');

/** 'HH:MM:SS' (colonne TIME) → 'HH:MM'. */
export const toHHMM = (value?: string | null): string | null => (value ? value.slice(0, 5) : null);

/** 'HH:MM' → minutes depuis minuit. */
export function toMinutes(hhmm?: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

export const fromMinutes = (minutes: number): string => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

/** '07:30' → « 7h30 », '10:00' → « 10h ». */
export function formatTimeFr(hhmm?: string | null): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return m ? `${h}h${pad(m)}` : `${h}h`;
}

export function formatRangeFr(start?: string | null, end?: string | null): string {
  if (start && end) return `${formatTimeFr(start)} – ${formatTimeFr(end)}`;
  return formatTimeFr(start) || '';
}

export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

/** « dimanche 19 octobre » */
export function formatDayFr(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** « 19/10/2026 » */
export const formatDateFr = (iso?: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

/** Ordre chronologique d'une même journée : par heure de début, les cultes sans horaire à la fin. */
export function compareEventsInDay(a: CulteEventInfo, b: CulteEventInfo): number {
  const ma = toMinutes(a.startTime);
  const mb = toMinutes(b.startTime);
  if (ma !== null && mb !== null && ma !== mb) return ma - mb;
  if (ma !== null && mb === null) return -1;
  if (ma === null && mb !== null) return 1;
  return a.meetingTypeName.localeCompare(b.meetingTypeName, 'fr');
}

export interface PreparationWindow {
  opensAt: string;
  closesAt: string;
  /** Libellé affiché : contrôle avant le 1er culte, point rapide entre deux cultes. */
  label: string;
  betweenServices: boolean;
}

/**
 * Fenêtre de contrôle avant un culte : 1 h avant le début ; pour le 2e culte du dimanche, dès la fin
 * du 1er (ex. 9h30 → 10h) : c'est le « point entre les deux cultes ».
 */
export function getPreparationWindow(event: CulteEventInfo, previous: CulteEventInfo | null): PreparationWindow | null {
  const start = toMinutes(event.startTime);
  if (start === null) return null;

  const defaultOpen = start - 60;
  const previousEnd = toMinutes(previous?.endTime);
  if (previousEnd !== null && previousEnd <= start && previousEnd > defaultOpen) {
    return {
      opensAt: fromMinutes(previousEnd),
      closesAt: fromMinutes(start),
      label: 'Point entre les deux cultes',
      betweenServices: true,
    };
  }
  return { opensAt: fromMinutes(defaultOpen), closesAt: fromMinutes(start), label: 'Contrôle de préparation', betweenServices: false };
}

export type EventPhase = 'before' | 'during' | 'after';

/** Où en est-on par rapport à ce culte ? (sert à ouvrir le bon onglet par défaut) */
export function getEventPhase(event: CulteEventInfo, now = new Date()): EventPhase {
  const today = todayISO(now);
  if (event.serviceDate > today) return 'before';
  if (event.serviceDate < today) return 'after';

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(event.startTime);
  const end = toMinutes(event.endTime) ?? (start !== null ? start + 120 : null);
  if (start === null || end === null) return 'during';
  if (nowMin < start - 90) return 'before';
  if (nowMin < end) return 'during';
  return 'after';
}

/** Le culte est terminé (heure de fin passée, ou jour passé) : c'est le moment du débrief. */
export const isEventFinished = (event: CulteEventInfo, now = new Date()): boolean => getEventPhase(event, now) === 'after';

/** « 1er Culte de Célébration & Contemplation » → « 1er culte » ; autres rencontres : leur nom. */
export function shortServiceLabel(meetingTypeName: string): string {
  const match = meetingTypeName.match(/^(\d+\s*(?:er|re|e|è|ème|nd|nde))\s+culte/i);
  return match ? `${match[1].replace(/\s+/g, '')} culte` : meetingTypeName;
}

export const capitalize = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/** Jours entre aujourd'hui et une date ISO (négatif si passée). */
export function daysFromToday(iso: string): number {
  const target = new Date(`${iso}T00:00:00`).getTime();
  const today = new Date(`${todayISO()}T00:00:00`).getTime();
  return Math.round((target - today) / 86_400_000);
}
