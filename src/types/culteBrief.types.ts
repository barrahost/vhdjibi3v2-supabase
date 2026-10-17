import type { CulteEvent } from './culteReport.types';

// ── Brief & Débrief des cultes (boucle hebdomadaire inspirée du guide du Centre Kodesh) ──────────

export type MeetingStatus = 'draft' | 'ready' | 'done';
export type ChecklistStatus = 'pending' | 'ok' | 'nok';
/** 'service' : à vérifier avant chaque culte — 'day' : une seule fois par jour (repris au 2e culte). */
export type ChecklistScope = 'service' | 'day';
export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dropped';
export type ActionSource = 'rapport' | 'controle' | 'debrief' | 'brief' | 'manuel';
export type ActionPriority = 'low' | 'medium' | 'high';

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminée',
  dropped: 'Abandonnée',
};

export const ACTION_SOURCE_LABELS: Record<ActionSource, string> = {
  rapport: 'Rapport de culte',
  controle: 'Contrôle',
  debrief: 'Débrief',
  brief: 'Brief',
  manuel: 'Ajoutée à la main',
};

export const ACTION_PRIORITY_LABELS: Record<ActionPriority, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

/** Un culte avec son horaire (issu du programme récurrent) et son suivi brief/débrief. */
export interface CulteEventInfo extends CulteEvent {
  /** HH:MM */
  startTime: string | null;
  /** HH:MM */
  endTime: string | null;
  briefEnabled: boolean;
}

// ── Brief ───────────────────────────────────────────────────────────────────────────────────────
export interface BriefContent {
  /** Thème du week-end, pour harmoniser tous les départements. */
  theme?: string;
  /** Vision et atmosphère que le Saint-Esprit attend pour ce culte. */
  vision?: string;
  /** Points de vigilance : annonces, prestations, présentations spéciales, timing… */
  vigilance?: string;
  /** Acteurs clés : dirigeant, chantres, prédicateur, interventions spéciales… */
  keyActors?: string;
  /** Éléments exceptionnels : dress code, événement spécial… */
  exceptional?: string;
  /** À retenir / à archiver : résumés, points clés, vidéos. */
  toRemember?: string;
}

export interface DebriefContent {
  planned?: string;
  happened?: string;
  worked?: string;
  failed?: string;
  why?: string;
  decision?: string;
  /** Points nécessitant un arbitrage de la direction. */
  arbitration?: string;
  conclusion?: string;
}

export interface CulteMeeting<C> {
  id: string;
  eventId: string;
  content: C;
  status: MeetingStatus;
  readyAt: string | null;
  updatedByName: string | null;
  updatedAt: string;
}

export interface RunSheetItem {
  id: string;
  eventId: string;
  position: number;
  /** HH:MM */
  startTime: string | null;
  title: string;
  departmentName: string | null;
  responsibleName: string | null;
  support: string | null;
  needsRegie: boolean;
  durationMin: number | null;
  notes: string | null;
}

export interface BriefInstruction {
  id: string;
  eventId: string;
  departmentId: string | null;
  departmentName: string;
  instructions: string;
  updatedByName: string | null;
  updatedAt: string;
}

// ── Contrôle de préparation ────────────────────────────────────────────────────────────────────
export interface ChecklistTemplate {
  id: string;
  departmentId: string | null;
  departmentName: string;
  position: number;
  task: string;
  indicator: string | null;
  scope: ChecklistScope;
  isActive: boolean;
}

export interface ChecklistItem {
  id: string;
  eventId: string;
  templateId: string | null;
  departmentId: string | null;
  departmentName: string;
  position: number;
  task: string;
  indicator: string | null;
  status: ChecklistStatus;
  responsibleName: string | null;
  observation: string | null;
  inherited: boolean;
  checkedByName: string | null;
  checkedAt: string | null;
}

export interface ChecklistProgress {
  total: number;
  ok: number;
  nok: number;
  pending: number;
}

// ── Débrief d'un département ───────────────────────────────────────────────────────────────────
export interface DepartmentDebrief {
  id: string;
  eventId: string;
  departmentId: string | null;
  departmentName: string;
  positives: string;
  difficulties: string;
  causes: string;
  needs: string;
  solutions: string;
  submittedByName: string | null;
  updatedAt: string;
}

// ── Plan d'actions (culte_report_needs étendu) ────────────────────────────────────────────────
export interface CulteAction {
  id: string;
  eventId: string | null;
  reportId: string | null;
  source: ActionSource;
  departmentName: string;
  /** Constat ou besoin. */
  description: string;
  cause: string | null;
  /** Décision corrective / action à mener. */
  decision: string | null;
  indicator: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  dueDate: string | null;
  priority: ActionPriority;
  status: ActionStatus;
  needsArbitration: boolean;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string | null;
  addressedAt: string | null;
}

export interface ActionInput {
  eventId?: string | null;
  reportId?: string | null;
  source: ActionSource;
  departmentName: string;
  description: string;
  cause?: string | null;
  decision?: string | null;
  indicator?: string | null;
  responsibleId?: string | null;
  responsibleName?: string | null;
  dueDate?: string | null;
  priority?: ActionPriority;
  needsArbitration?: boolean;
}

export const isActionClosed = (status: ActionStatus) => status === 'done' || status === 'dropped';

/** Libellé principal d'une action : la décision à mener si elle existe, sinon le constat. */
export const actionTitle = (a: Pick<CulteAction, 'decision' | 'description'>) => a.decision?.trim() || a.description;
