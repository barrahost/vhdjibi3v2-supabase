export type BusinessProfileType = 
  | 'shepherd' 
  | 'department_leader' 
  | 'adn' 
  | 'admin'
  | 'family_leader'
  | 'evangelist';

export interface BusinessProfile {
  type: BusinessProfileType;
  departmentId?: string; // For department leaders
  serviceFamilyId?: string; // For family leaders
  isActive?: boolean;
  isPrimary?: boolean; // Default profile used at login
}

export interface UserBusinessProfiles {
  profiles: BusinessProfile[];
  activeProfileType?: BusinessProfileType; // Single active profile
}

export const BUSINESS_PROFILE_LABELS: Record<BusinessProfileType, string> = {
  shepherd: 'Berger(e)',
  department_leader: 'Responsable de Département',
  adn: 'ADN',
  admin: 'Administrateur',
  family_leader: 'Responsable de Famille',
  evangelist: 'Évangéliste'
};

export const BUSINESS_PROFILE_DESCRIPTIONS: Record<BusinessProfileType, string> = {
  shepherd: 'Peut promouvoir des âmes, gérer ses interactions',
  department_leader: 'Peut gérer son département et ses serviteurs',
  adn: 'Peut gérer les âmes, audios, statistiques',
  admin: 'Accès complet au système',
  family_leader: 'Peut voir les âmes de sa famille et les assigner à ses bergers',
  evangelist: 'Peut enregistrer et suivre ses âmes évangélisées'
};

// Map business profiles to permissions
export const PROFILE_PERMISSIONS: Record<BusinessProfileType, string[]> = {
  shepherd: [
    'MANAGE_INTERACTIONS',
    'MANAGE_ATTENDANCES',
    'PROMOTE_SOUL_TO_SERVANT',
    'MANAGE_PROFILE'
  ],
  department_leader: [
    'MANAGE_SERVANTS',
    'MANAGE_DEPARTMENT_SERVANTS',
    'MANAGE_PROFILE'
  ],
  adn: [
    'MANAGE_SOULS',
    'MANAGE_AUDIO',
    'VIEW_STATS',
    'EXPORT_DATA',
    'MANAGE_INTERACTIONS',
    'MANAGE_ATTENDANCES',
    'MANAGE_PROFILE',
    'VIEW_REPLAY_TEACHINGS',
    'MANAGE_SMS_TEMPLATES',
    'MANAGE_EVANGELIZED_SOULS'
  ],
  admin: ['*'],
  family_leader: [
    'MANAGE_SOULS',
    'MANAGE_INTERACTIONS',
    'MANAGE_PROFILE',
    'MANAGE_SMS',
    'VIEW_REPLAY_TEACHINGS'
  ],
  evangelist: [
    'MANAGE_EVANGELIZED_SOULS',
    'MANAGE_INTERACTIONS',
    'MANAGE_SMS',
    'EXPORT_DATA',
    'MANAGE_PROFILE',
    'VIEW_REPLAY_TEACHINGS'
  ]
};

// Helper function to get permissions from a single active profile
export function getProfilePermissions(profileType: BusinessProfileType): string[] {
  return PROFILE_PERMISSIONS[profileType] || [];
}
