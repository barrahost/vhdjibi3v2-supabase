export type CulteReportType = 'worship' | 'adn' | 'finance' | 'sainte_cene' | 'sono' | 'academie';

export const CULTE_REPORT_TYPE_LABELS: Record<CulteReportType, string> = {
  worship: 'Culte (rapport général)',
  adn: 'ADN — Amis des Nouveaux',
  finance: 'Finance',
  sainte_cene: 'Sainte Cène',
  sono: 'Sonorisation',
  academie: "Académie d'Honneur",
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
