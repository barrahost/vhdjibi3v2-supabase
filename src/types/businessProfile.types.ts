export type BusinessProfileType = 
  | 'shepherd' 
  | 'department_leader' 
  | 'adn' 
  | 'admin'
  | 'family_leader'
  | 'evangelist';

export interface BusinessProfile {
  type: BusinessProfileType;
  /** @deprecated use departmentIds — kept for old records, still read as a fallback single-department value. */
  departmentId?: string;
  departmentIds?: string[]; // For department leaders — a leader can head several departments
  serviceFamilyId?: string; // For family leaders
  isActive?: boolean;
  isPrimary?: boolean; // Default profile used at login
}

/** Returns every department id a department_leader profile is responsible for, merging the legacy singular field with the new array. */
export function getProfileDepartmentIds(profile: Pick<BusinessProfile, 'departmentId' | 'departmentIds'> | undefined | null): string[] {
  if (!profile) return [];
  const ids = new Set<string>(profile.departmentIds || []);
  if (profile.departmentId) ids.add(profile.departmentId);
  return Array.from(ids);
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
  department_leader: 'Peut gérer son département et ses B.O.S.S',
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
    'MANAGE_DEPARTMENT_SERVANTS',
    'MANAGE_PROFILE',
    'MANAGE_CULTE_REPORTS'
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

// Union des permissions de TOUS les profils détenus : plus de bascule de profil,
// l'utilisateur a en permanence les droits de toutes ses casquettes.
export function getAllProfilePermissions(profiles: Pick<BusinessProfile, 'type'>[] | undefined | null): string[] {
  const all = new Set<string>();
  (profiles || []).forEach(p => {
    (PROFILE_PERMISSIONS[p.type] || []).forEach(perm => all.add(perm));
  });
  return Array.from(all);
}
