import { shortServiceLabel, toMinutes } from './culteTiming';
import type { BriefContent, TimingMoment } from '../types/culteBrief.types';

// Mise en forme de la « fiche de timing » imprimable (PDF) à partir du brief et du conducteur d'un culte.
// Tout est calculé ici (heures, durées, moments, annonces) ; le dessin du PDF est dans utils/culteTimingSheetPdf.ts.

const pad = (n: number) => String(n).padStart(2, '0');

// ── Contenu du brief lu en base ─────────────────────────────────────────────────────────────────
// Le contenu est un JSON libre : on ne se fie à rien (une valeur inattendue ne doit pas faire planter l'écran).
const BRIEF_TEXT_KEYS = [
  'theme',
  'vision',
  'vigilance',
  'keyActors',
  'exceptional',
  'toRemember',
  'ficheTitle',
  'preacher',
  'leader',
  'communionLeads',
  'pastorAnnouncements',
  'leaderAnnouncements',
  'verse',
  'footerNote',
] as const;

/** Moments lus en base : seuls ceux dont l'intitulé et l'heure sont du texte sont gardés. */
export function normalizeMoments(raw: unknown): TimingMoment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is TimingMoment => !!m && typeof m === 'object' && typeof (m as TimingMoment).label === 'string' && typeof (m as TimingMoment).from === 'string')
    .map((m) => ({ label: m.label, from: m.from }));
}

/** Contenu de brief remis dans la forme attendue : champs texte en chaînes (le reste est ignoré), moments en liste valide. */
export function sanitizeBriefContent(raw: unknown): BriefContent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const content: BriefContent = {};
  BRIEF_TEXT_KEYS.forEach((key) => {
    const value = source[key];
    if (typeof value === 'string') content[key] = value;
  });
  if (Array.isArray(source.moments)) content.moments = normalizeMoments(source.moments);
  return content;
}

const fromMinutes = (minutes: number) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}h${pad(wrapped % 60)}`;
};

/** '07:30' → « 07h30 » (avec le zéro devant, comme sur la fiche papier). */
export function slotTime(hhmm?: string | null): string {
  const minutes = toMinutes(hhmm);
  return minutes === null ? '' : fromMinutes(minutes);
}

export interface SheetRowInput {
  startTime?: string | null;
  title: string;
  responsibleName?: string | null;
  durationMin?: number | null;
}

/** Début, fin et durée d'une séquence : la fin vient de la durée, à défaut du début de la séquence suivante. */
function span(row: SheetRowInput, next?: SheetRowInput | null) {
  const start = toMinutes(row.startTime);
  if (start === null) return { start: null, end: null, minutes: row.durationMin && row.durationMin > 0 ? row.durationMin : null };
  let end: number | null = null;
  if (row.durationMin && row.durationMin > 0) end = start + row.durationMin;
  else {
    const following = toMinutes(next?.startTime);
    if (following !== null && following > start) end = following;
  }
  return { start, end, minutes: end === null ? null : end - start };
}

/** « 07h30–07h35 », ou « 07h30 » seul quand la fin n'est pas connue. */
export function slotRange(row: SheetRowInput, next?: SheetRowInput | null): string {
  const { start, end } = span(row, next);
  if (start === null) return '';
  return end === null ? fromMinutes(start) : `${fromMinutes(start)}–${fromMinutes(end)}`;
}

/** 5 → « 05min », 70 → « 1h10min », 60 → « 1h ». */
export function slotDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${pad(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${pad(m)}min` : `${h}h`;
}

// ── Annonces ────────────────────────────────────────────────────────────────────────────────────
/** Une annonce : un titre (en rouge), du texte, et éventuellement des puces. */
export interface AnnouncementItem {
  title: string;
  /** Texte qui suit le titre sur sa propre ligne (après « : »). */
  lead: string;
  /** Lignes suivantes : elles passent à la ligne, sous le titre. */
  text: string[];
  bullets: { label: string; text: string }[];
}

/** Index du « : » qui sépare un intitulé du reste (pas dans une heure « 7:30 » ni une adresse « https:// »). */
function colonIndex(line: string): number {
  for (let i = 1; i < line.length && i <= 80; i += 1) {
    if (line[i] !== ':') continue;
    const prev = line[i - 1];
    const next = line[i + 1] ?? '';
    if (/\d/.test(prev) && /\d/.test(next)) continue;
    if (next === '/' && line[i + 2] === '/') continue;
    return i;
  }
  return -1;
}

const BULLET = /^\s*(?:[-•✓✔*]|–)\s+/;

/**
 * Lit les annonces écrites dans un champ de texte :
 *  - une annonce par bloc, les blocs étant séparés par une ligne vide ;
 *  - dans la première ligne, ce qui précède « : » est le titre (en rouge sur la fiche), la suite de la ligne le prolonge ;
 *  - une ligne qui commence par « - » est une puce (son intitulé avant « : » est en gras) ;
 *  - toute autre ligne passe à la ligne, sous le titre.
 */
export function parseAnnouncements(raw?: string | null): AnnouncementItem[] {
  if (!raw?.trim()) return [];
  return raw
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const item: AnnouncementItem = { title: '', lead: '', text: [], bullets: [] };
      let rest = lines;
      if (!BULLET.test(lines[0])) {
        const idx = colonIndex(lines[0]);
        if (idx === -1) {
          item.title = lines[0];
        } else {
          item.title = lines[0].slice(0, idx + 1).replace(/\s+:$/, ' :');
          item.lead = lines[0].slice(idx + 1).trim();
        }
        rest = lines.slice(1);
      }
      rest.forEach((line) => {
        if (BULLET.test(line)) {
          const body = line.replace(BULLET, '');
          const idx = colonIndex(body);
          item.bullets.push(idx === -1 ? { label: '', text: body } : { label: body.slice(0, idx + 1), text: body.slice(idx + 1).trim() });
        } else {
          item.text.push(line);
        }
      });
      return item;
    });
}

// ── Conducteur groupé par moments ───────────────────────────────────────────────────────────────
export type SheetBlock =
  | { kind: 'moment'; label: string }
  | { kind: 'row'; label: string; range: string; duration: string };

/** Séquences dans l'ordre du conducteur, un intitulé de moment étant inséré quand son heure est atteinte. */
export function buildBlocks(rows: SheetRowInput[], moments: TimingMoment[] = []): SheetBlock[] {
  const ordered = normalizeMoments(moments)
    .filter((m) => m.label.trim() && toMinutes(m.from) !== null)
    .map((m) => ({ label: m.label.trim(), at: toMinutes(m.from) as number }))
    .sort((a, b) => a.at - b.at);

  const blocks: SheetBlock[] = [];
  let current = -1;
  rows.forEach((row, index) => {
    const start = toMinutes(row.startTime);
    if (start !== null) {
      // dernier moment commencé à cette heure ; on n'en change que vers l'avant (conducteur remanié : pas de va-et-vient)
      let reached = -1;
      ordered.forEach((m, i) => {
        if (m.at <= start) reached = i;
      });
      if (reached > current) {
        // deux moments qui commencent à la même heure s'affichent tous les deux, l'un sous l'autre
        const first = Math.max(current + 1, ordered.findIndex((m) => m.at === ordered[reached].at));
        for (let i = first; i <= reached; i += 1) blocks.push({ kind: 'moment', label: ordered[i].label });
        current = reached;
      }
    }
    const { minutes } = span(row, rows[index + 1]);
    const name = row.title.trim();
    const who = row.responsibleName?.trim();
    blocks.push({
      kind: 'row',
      label: who ? `${name} – ${who}` : name,
      range: slotRange(row, rows[index + 1]),
      duration: slotDuration(row.durationMin && row.durationMin > 0 ? row.durationMin : minutes),
    });
  });
  return blocks;
}

// ── Textes de l'en-tête ─────────────────────────────────────────────────────────────────────────
const capitalize = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/** « Dimanche 11 Octobre 2026 » ; le premier du mois s'écrit « 1er » : « Dimanche 1er Novembre 2026 ». */
export function longDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const words = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).split(' ');
  if (date.getDate() === 1) words[1] = '1er';
  return words.map((word, i) => (i === 0 || i === 2 ? capitalize(word) : word)).join(' ');
}

export interface ServiceBanner {
  /** « 1 » et « er » : l'exposant se dessine à part. */
  number?: string;
  sup?: string;
  /** « Culte » (ou le nom entier de la rencontre). */
  text: string;
}

/** « 1er Culte de Célébration & Contemplation » → « 1er Culte » ; autre rencontre : son nom. */
export function serviceBanner(meetingTypeName: string): ServiceBanner {
  const short = shortServiceLabel(meetingTypeName);
  const match = short.match(/^(\d+)\s*(er|re|e|è|ème|nd|nde)\s+(.+)$/i);
  if (match) return { number: match[1], sup: match[2], text: capitalize(match[3]) };
  return { text: capitalize(short) };
}

const ascii = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** « Timing_1er_culte_11-10-2026.pdf » */
export function ficheFileName(meetingTypeName: string, iso: string): string {
  return `Timing_${ascii(shortServiceLabel(meetingTypeName))}_${iso.split('-').reverse().join('-')}.pdf`;
}

// ── Modèle complet de la fiche ──────────────────────────────────────────────────────────────────
/** Valeurs reprises de la dernière fiche, quand celle du culte n'en a pas encore. */
export interface FicheDefaults {
  ficheTitle?: string;
  footerNote?: string;
}

/**
 * Titre et note de la fiche la plus récente, parmi des contenus de brief classés du plus récent au plus ancien.
 * Un titre vide ne compte pas (c'est « le titre habituel ») ; une note effacée exprès, si : la dernière fiche n'en
 * avait pas, la nouvelle n'en aura pas non plus.
 */
export function pickFicheDefaults(contents: BriefContent[]): FicheDefaults {
  return {
    ficheTitle: contents.map((c) => c.ficheTitle).find((v): v is string => typeof v === 'string' && v.trim() !== ''),
    footerNote: contents.map((c) => c.footerNote).find((v): v is string => typeof v === 'string'),
  };
}

export interface TimingSheetModel {
  title: string;
  dateLabel: string;
  banner: ServiceBanner;
  preacher: string;
  leader: string;
  communionLeads: string;
  blocks: SheetBlock[];
  pastorAnnouncements: AnnouncementItem[];
  leaderAnnouncements: AnnouncementItem[];
  verse: string;
  footerNote: string;
  fileName: string;
}

export interface FicheInput {
  content: BriefContent;
  defaults?: FicheDefaults;
  rows: SheetRowInput[];
  event: { meetingTypeName: string; serviceDate: string };
  churchName: string;
}

export function buildFicheModel({ content: rawContent, defaults = {}, rows, event, churchName }: FicheInput): TimingSheetModel {
  const content = sanitizeBriefContent(rawContent);
  const filled = rows.filter((row) => row.title?.trim());
  // La note de pied de page vide (effacée exprès) n'est pas remplacée par celle de la dernière fiche.
  const footer = content.footerNote !== undefined ? content.footerNote : defaults.footerNote ?? '';
  return {
    title: content.ficheTitle?.trim() || defaults.ficheTitle?.trim() || churchName,
    dateLabel: longDateLabel(event.serviceDate),
    banner: serviceBanner(event.meetingTypeName),
    preacher: content.preacher?.trim() ?? '',
    leader: content.leader?.trim() ?? '',
    communionLeads: content.communionLeads?.trim() ?? '',
    blocks: buildBlocks(filled, content.moments ?? []),
    pastorAnnouncements: parseAnnouncements(content.pastorAnnouncements),
    leaderAnnouncements: parseAnnouncements(content.leaderAnnouncements),
    verse: content.verse?.trim() ?? '',
    footerNote: footer.trim(),
    fileName: ficheFileName(event.meetingTypeName, event.serviceDate),
  };
}

// ── Logos de la fiche ───────────────────────────────────────────────────────────────────────────
export interface FicheBranding {
  /** Logo en haut à gauche (adresse relative au site). */
  logoUrl: string;
  /** Décor en haut à droite (la flamme de la fiche de Vases d'Honneur), s'il y en a un. */
  flameUrl: string | null;
}

/**
 * Logos de l'en-tête : ceux de la fiche de Vases d'Honneur pour cette église ; pour une autre église de la
 * plateforme, son propre logo (ou celui de Bergerie) et pas de flamme.
 */
export function ficheBranding(church?: { name?: string | null; shortName?: string | null; copyrightName?: string | null; slug?: string | null; logoUrl?: string | null } | null): FicheBranding {
  const label = [church?.name, church?.shortName, church?.copyrightName].filter(Boolean).join(' ');
  const isVasesDHonneur = !church || church.slug === 'bergerie' || /vases\s*d['’]?\s*honneur/i.test(label);
  if (isVasesDHonneur) return { logoUrl: '/images/LOGO_VH.png', flameUrl: '/images/fiche-flamme.png' };
  return { logoUrl: church?.logoUrl || '/logo-agc-bergerie.png', flameUrl: null };
}
