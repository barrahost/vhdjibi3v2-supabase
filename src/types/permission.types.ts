export type Permission = 
  | 'MANAGE_USERS'
  | 'MANAGE_SOULS' 
  | 'MANAGE_SHEPHERDS'
  | 'MANAGE_DEPARTMENTS'
  | 'MANAGE_FAMILIES'
  | 'MANAGE_SERVANTS'
  | 'VIEW_STATS'
  | 'EXPORT_DATA'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_PROFILE'
  | 'MANAGE_INTERACTIONS'
  | 'MANAGE_ATTENDANCES'
  | 'MANAGE_REPORTS'
  | 'MANAGE_BACKUP'
  | 'MANAGE_DATABASE'
  | 'MANAGE_SMS'
  | 'MANAGE_SMS_TEMPLATES'
  | 'MANAGE_AUDIO'
  | 'MANAGE_ROLES_PERMISSIONS'
  | 'PROMOTE_SOUL_TO_SERVANT'
  | 'MANAGE_DEPARTMENT_SERVANTS'
  | 'VIEW_REPLAY_TEACHINGS'
  | 'MANAGE_BIRTHDAYS'
  | 'MANAGE_EVANGELIZED_SOULS'
  | '*';

export type BaseRole = 'super_admin' | 'admin' | 'shepherd' | 'adn' | 'pasteur' | 'department_leader' | 'family_leader' | 'evangelist';

export interface UserRoles {
  primary: BaseRole;
  secondary: BaseRole[];
}

export type Role = BaseRole | UserRoles;

export interface RolePermissions {
  role: BaseRole;
  permissions: Permission[];
  description: string;
}