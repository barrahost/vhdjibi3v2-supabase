export type CulteReportType = 'worship' | 'adn' | 'finance' | 'sainte_cene' | 'sono' | 'academie';

export const CULTE_REPORT_TYPE_LABELS: Record<CulteReportType, string> = {
  worship: 'Culte (rapport général)',
  adn: 'ADN — Amis des Nouveaux',
  finance: 'Emmeraude',
  sainte_cene: 'Sainte Cène',
  sono: 'Communication & Sono',
  academie: "Académie d'Honneur",
};

export const DEPARTMENT_NAME_BY_REPORT_TYPE: Record<CulteReportType, string> = {
  worship: 'GESTION DES CULTES',
  adn: 'AMIS DES NOUVEAUX',
  finance: 'EMMERAUDE',
  sainte_cene: 'SAINTE CENE',
  sono: 'COM & SONO',
  academie: "ACADEMIE D'HONNEUR",
};

/** Normalise un nom de département pour une comparaison insensible à la casse et aux espaces. */
export function normalizeDeptName(name: string): string {
  return name.toUpperCase().trim().replace(/\s+/g, ' ');
}

export const DEPARTMENT_TO_REPORT_TYPE: Record<string, CulteReportType> = Object.fromEntries(
  (Object.entries(DEPARTMENT_NAME_BY_REPORT_TYPE) as [CulteReportType, string][]).map(([type, name]) => [name, type])
);

export const CULTE_REPORT_TYPE_COLORS: Record<CulteReportType, { header: string; accent: string; icon: string }> = {
  worship: { header: 'bg-[#00665C]', accent: 'text-[#00665C]', icon: 'text-[#00665C]' },
  finance: { header: 'bg-[#F2B636]', accent: 'text-[#F2B636]', icon: 'text-[#F2B636]' },
  adn: { header: 'bg-indigo-600', accent: 'text-indigo-600', icon: 'text-indigo-600' },
  academie: { header: 'bg-purple-600', accent: 'text-purple-600', icon: 'text-purple-600' },
  sono: { header: 'bg-sky-600', accent: 'text-sky-600', icon: 'text-sky-600' },
  sainte_cene: { header: 'bg-rose-600', accent: 'text-rose-600', icon: 'text-rose-600' },
};

export interface GenderCount {
  men: number;
  women: number;
}

export interface WorshipReportData {
  messageTheme: string;
  messageSource: string;
  speakerId?: string;
  speakerName?: string;
  attendance: {
    adults: GenderCount;
    children: { boys: number; girls: number };
    served: GenderCount;
    blooms: number;
    conversions: GenderCount;
  };
  newMembers: { men: number; women: number; blooms: number; children: number };
  totalParticipants: number;
  totalNewMembers: number;
}

export interface AdnReportData {
  newVisitors: GenderCount;
  visitorDecisions: {
    undecided: number;
    wantsToJoin: GenderCount;
    wantsToGiveLifeToJesus: GenderCount;
  };
  totalNewVisitors: number;
  totalWantsToJoin: number;
  totalWantsToGiveLifeToJesus: number;
}

export interface FinanceReportData {
  tithes: number;
  regularOfferings: number;
  specialOfferings: number;
  totalFinances: number;
}

export interface SainteCeneReportData {
  painsPreparees: number;
  vinsPreparees: number;
  painsDistribuees: number;
  vinsDistribuees: number;
  painsRestantes: number;
  vinsRestantes: number;
}

export type SonoOkNok = 'OK' | 'NOK';

export interface SonoReportData {
  beforeService: {
    materialCheck: SonoOkNok;
    soundQualityTest: SonoOkNok;
    liveStreamingTest: SonoOkNok;
    onlineSoundTest: SonoOkNok;
    onlineVideoTest: SonoOkNok;
    photoEquipmentPrep: SonoOkNok;
  };
  duringService: {
    proclamationLaunch: 'OK' | 'PROBLEME';
    roomSoundQuality: 'SATISFAISANT' | 'NON_SATISFAISANT';
    liveStreaming: 'OUI' | 'NON';
    onlineSoundQuality: 'BONNE' | 'MOYENNE' | 'MAUVAISE';
    onlineVideoQuality: 'BONNE' | 'MOYENNE' | 'MAUVAISE';
    photoshootDuringService: 'OUI' | 'NON';
    technicalProblems?: string;
  };
  afterService: {
    servantsPhotos: 'OUI' | 'NON';
    photoMasking: 'EFFECTUEE' | 'NON_EFFECTUEE';
    audioReplayPublication: SonoOkNok;
    audioReplayTime?: string;
    videoReplayPublication: 'OK' | 'EN_COURS' | 'NOK';
    fileArchiving: SonoOkNok;
  };
  generalObservations?: string;
}

export interface AcademieReportData {
  className: string;
  actualStudents: number;
  presentStudents: number;
  moderator: string;
  courseOfTheDay: string;
  spiritualAtmosphere: string;
  classParticipation: string;
  nextCourse: string;
  nextModerator: string;
  nextMeditation: string;
  nextExercise: string;
}

export type CulteReportData =
  | WorshipReportData
  | AdnReportData
  | FinanceReportData
  | SainteCeneReportData
  | SonoReportData
  | AcademieReportData;

export interface CulteReport {
  id: string;
  churchId: string;
  reportType: CulteReportType;
  departmentId: string | null;
  departmentName: string;
  worshipReportId: string | null;
  eventId: string | null;
  serviceDate: string;
  meetingTypeId: string | null;
  meetingTypeName: string | null;
  submittedBy: string | null;
  submittedByName: string;
  data: CulteReportData;
  notes: string | null;
  needsNotes: string | null;
  legacyFirestoreId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CulteReportMeetingType {
  id: string;
  churchId: string;
  name: string;
  description?: string;
}

export interface CulteReportSpeaker {
  id: string;
  churchId: string;
  name: string;
  description?: string;
}

export type CulteNeedPriority = 'low' | 'medium' | 'high';

export interface CulteNeed {
  id: string;
  churchId: string;
  culteReportId: string | null;
  departmentName: string;
  description: string;
  priority: CulteNeedPriority;
  isAddressed: boolean;
  addressedBy: string | null;
  addressedAt: string | null;
  createdAt: string;
}

/** Un culte/evenement partage entre tous les departements (worship inclus) -- decouple des
 * rapports eux-memes pour qu'aucun departement n'ait a attendre qu'un autre soumette en premier. */
export interface CulteEvent {
  id: string;
  churchId: string;
  serviceDate: string;
  meetingTypeName: string;
  createdAt: string;
}

/** 0 = dimanche ... 6 = samedi (convention JS Date.getDay()). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

/** Programme recurrent (ex: "Rendez-Vous des Champions" tous les mercredis) -- genere
 * automatiquement les culte_events du jour a l'ouverture du formulaire de rapport. */
export interface CulteRecurringSchedule {
  id: string;
  churchId: string;
  meetingTypeName: string;
  dayOfWeek: DayOfWeek;
  isActive: boolean;
}
