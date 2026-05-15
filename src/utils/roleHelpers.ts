/**
 * Helpers unifiés pour la détection de rôles utilisateur.
 *
 * L'application utilise deux systèmes en parallèle :
 *  - Legacy : champ unique `role` (ex: 'shepherd', 'intern', 'adn'...)
 *  - Nouveau : tableau `businessProfiles[]` permettant plusieurs casquettes
 *
 * Ces helpers garantissent qu'aucun utilisateur multi-casquettes n'est oublié
 * dans les filtres, sélecteurs et statistiques.
 */

type RoleType = string;

interface BusinessProfileLike {
  type: RoleType;
  isActive?: boolean;
}

interface UserLike {
  role?: RoleType | null;
  businessProfiles?: BusinessProfileLike[] | null;
  status?: string | null;
}

/** Vérifie si un utilisateur a un profil métier actif d'un type donné. */
export function hasActiveBusinessProfile(user: UserLike | null | undefined, type: RoleType): boolean {
  if (!user?.businessProfiles?.length) return false;
  return user.businessProfiles.some(p => p?.type === type && p?.isActive !== false);
}

/** Vérifie si l'utilisateur possède l'un des rôles donnés (legacy OU businessProfiles). */
export function hasAnyRole(user: UserLike | null | undefined, roles: RoleType[]): boolean {
  if (!user) return false;
  if (user.role && roles.includes(user.role)) return true;
  return user.businessProfiles?.some(
    p => p && roles.includes(p.type) && p.isActive !== false
  ) ?? false;
}

/** Berger ou stagiaire (toutes casquettes confondues). */
export function isShepherdUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['shepherd', 'intern']);
}

/** Stagiaire spécifiquement. */
export function isInternUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['intern']);
}

/** Membre ADN (legacy ou business profile). */
export function isADNUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['adn']);
}

/** Administrateur (admin ou super_admin). */
export function isAdminUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['admin', 'super_admin']);
}

/** Responsable de département. */
export function isDepartmentLeaderUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['department_leader']);
}

/** Responsable de famille. */
export function isFamilyLeaderUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['family_leader']);
}

/** Évangéliste. */
export function isEvangelistUser(user: UserLike | null | undefined): boolean {
  return hasAnyRole(user, ['evangelist']);
}

/** Filtre côté client : retourne tous les bergers/stagiaires actifs. */
export function filterShepherds<T extends UserLike>(users: T[]): T[] {
  return users.filter(u => isShepherdUser(u) && (u.status ?? 'active') === 'active');
}
