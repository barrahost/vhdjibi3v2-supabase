export interface Admin {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les profils spirituels
export interface SpiritualProfile {
  isBornAgain: boolean;
  bornAgainDate?: Date;
  isBaptized: boolean;
  baptismDate?: Date;
  isEnrolledInAcademy: boolean;
  academyEnrollmentDate?: Date;
  isEnrolledInLifeBearers: boolean;
  lifeBearersEnrollmentDate?: Date;
  servantFamily?: string;
  departments: {
    name: string;
    startDate: Date;
  }[];
}

// Types pour les interactions
export interface Interaction {
  id: string;
  soulId: string;
  shepherdId: string;
  type: 'call' | 'visit' | 'message' | 'sms' | 'other';
  date: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les âmes
export interface Soul {
  id: string;
  fullName: string;
  nickname?: string; // Ajout du champ surnom
  gender: 'male' | 'female';
  phone: string;
  location: string;
  isUndecided: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  firstVisitDate: Date;
  shepherdId?: string; // Peut être l'ID d'un berger ou d'un stagiaire
  evangelistId?: string; // Évangéliste responsable (si l'âme provient d'une évangélisation)
  spiritualProfile: SpiritualProfile;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
  photoURL?: string;
  // Nouveaux champs pour la promotion en serviteur
  isServant?: boolean; // Indique si l'âme est devenue serviteur
  servantId?: string; // Lien vers l'enregistrement serviteur
  promotionToServantDate?: Date; // Date de promotion
  // Nouveaux champs ADN
  originSource?: 'culte' | 'evangelisation'; // Provenance de l'âme
  serviceFamilyId?: string; // Famille de service assignée par ADN
  // Champs carte de bienvenue Vases d'Honneur
  email?: string;
  profession?: string;
  attendedCommunity?: string; // Communauté fréquentée
  isRegular?: boolean | null; // Régulier (Oui/Non)
  ageRange?: AgeRange; // Tranche d'âge
  maritalStatus?: MaritalStatus; // Situation matrimoniale
  decision?: SoulDecision; // Ma décision aujourd'hui (3 états)
  prayerRequest?: string; // Observations ou besoin de prière
}

export type AgeRange = '10-15' | '16-20' | '21-27' | '28-35' | '36-45' | '46-59' | '60+';
export type MaritalStatus = 'marie' | 'concubinage' | 'fiance' | 'seul';
export type SoulDecision = 'give_life' | 'member' | 'undecided';

// Types pour les familles de service
export interface ServiceFamily {
  id: string;
  name: string;
  description?: string;
  leader?: string;        // legacy - texte libre, conservé pour compat
  leaderId?: string;      // référence vers l'utilisateur responsable
  shepherdIds?: string[]; // IDs des bergers membres de la famille
  order: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface ShepherdOption {
  id: string;
  fullName: string;
  role?: string;
}

export interface Shepherd {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface Teaching {
  id: string;
  title: string;
  description: string;
  speaker: string;
  date: Date;
  thumbnail_url: string;
  category: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioTeaching extends Teaching {
  file_url: string;
  audioDuration?: number;
}

