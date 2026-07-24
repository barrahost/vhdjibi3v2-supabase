export type GaveLifeToJesus = 'yes' | 'no' | 'not_yet';
export type WillJoinVH = 'yes' | 'no';
export type PlannedService =
  | 'wednesday_evening'
  | 'sunday_first'
  | 'sunday_second'
  | 'undecided';

export const WILL_JOIN_VH_OPTIONS: { value: WillJoinVH; label: string }[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
];

export const willJoinVHLabel = (v?: WillJoinVH | null): string =>
  WILL_JOIN_VH_OPTIONS.find((o) => o.value === v)?.label || '';

export const PLANNED_SERVICE_OPTIONS: { value: PlannedService; label: string }[] = [
  { value: 'wednesday_evening', label: 'Culte du Mercredi Soir - 19h' },
  { value: 'sunday_first', label: '1er Culte du Dimanche - 7h' },
  { value: 'sunday_second', label: '2e Culte du Dimanche - 10h' },
  { value: 'undecided', label: 'Pas encore décidé' },
];

export const GAVE_LIFE_OPTIONS: { value: GaveLifeToJesus; label: string }[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
  { value: 'not_yet', label: 'Pas encore' },
];

export const plannedServiceLabel = (v?: PlannedService | null): string =>
  PLANNED_SERVICE_OPTIONS.find((o) => o.value === v)?.label || '';

export const gaveLifeLabel = (v?: GaveLifeToJesus | null): string =>
  GAVE_LIFE_OPTIONS.find((o) => o.value === v)?.label || '';

export interface EvangelizedSoul {
  id: string;
  fullName: string;
  nickname?: string | null;
  gender: 'male' | 'female';
  phone: string;
  location: string;
  evangelizationDate: Date;
  evangelizationLocation?: string | null;
  notes?: string | null;
  evangelistId: string;
  importedFromEvangelistId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'imported';
  photoURL?: string | null;
  importedToSoulId?: string | null;
  importedAt?: Date | null;
  importedBy?: string | null;
  // Nouveaux champs (audit fiche évangélisation)
  attendedCommunity?: string | null;
  gaveLifeToJesus?: GaveLifeToJesus | null;
  willJoinVH?: WillJoinVH | null;
  plannedService?: PlannedService | null;
  prayerTopics?: string | null;
  interviewerName?: string | null;
  serviceFamilyId?: string | null;
}
