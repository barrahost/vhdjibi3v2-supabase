import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { DEPARTMENT_NAME_BY_REPORT_TYPE, normalizeDeptName } from '../types/culteReport.types';
import { CulteDirectory, type DirectoryDepartment } from '../services/culteDirectory.service';

export interface CulteAccess {
  loading: boolean;
  userId: string | null;
  userName: string;
  /** Administrateur, pasteur ou responsable du département « Gestion des cultes » : prépare le brief,
   * gère les modèles de contrôle, voit et arbitre tout. */
  isManager: boolean;
  /** Départements dirigés ou supervisés (responsable de département, pasteur assistant). */
  managedDepartmentIds: string[];
  /** Leurs noms (les actions sont rattachées à un département par son nom). */
  managedDepartmentNames: string[];
  /** Départements où l'on peut créer une action : tous (undefined) pour la direction, sinon les siens (liste vide = aucun). */
  allowedActionDepartments: string[] | undefined;
  /** Voir et gérer une action : la direction toutes ; les autres, celles de leurs départements ou qui leur sont confiées. */
  canManageAction: (action: { responsibleId?: string | null; departmentName: string }) => boolean;
  /** Peut-il cocher le contrôle / écrire le débrief de ce département ? */
  canEditDepartment: (departmentId?: string | null) => boolean;
}

/** Droits du module « Cultes », déduits des casquettes de l'utilisateur (même logique que les rapports de culte). */
export function useCulteAccess(): CulteAccess {
  const { user, userRole } = useAuth();
  const [departments, setDepartments] = useState<DirectoryDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const profiles = useMemo(() => (((user as any)?.businessProfiles || []) as any[]), [user]);
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || profiles.some((p) => p?.type === 'admin');
  const isPasteur = userRole === 'pasteur' || profiles.some((p) => p?.type === 'pasteur');

  const managedDepartmentIds = useMemo(() => {
    const ids = new Set<string>([
      ...getProfileDepartmentIds(profiles.find((p) => p?.type === 'department_leader')),
      ...getProfileDepartmentIds(profiles.find((p) => p?.type === 'pasteur_assistant')),
    ]);
    return Array.from(ids);
  }, [profiles]);

  useEffect(() => {
    let cancelled = false;
    CulteDirectory.departments()
      .then((list) => {
        if (!cancelled) setDepartments(list);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const culteDepartmentId = useMemo(() => {
    const wanted = normalizeDeptName(DEPARTMENT_NAME_BY_REPORT_TYPE.worship);
    return departments.find((d) => normalizeDeptName(d.name) === wanted)?.id ?? null;
  }, [departments]);
  const managedDepartmentNames = useMemo(
    () => departments.filter((d) => managedDepartmentIds.includes(d.id)).map((d) => d.name),
    [departments, managedDepartmentIds]
  );
  const userId: string | null = (user as any)?.id ?? null;

  const isManager = isAdmin || isPasteur || (!!culteDepartmentId && managedDepartmentIds.includes(culteDepartmentId));

  const canManageAction = useCallback(
    (action: { responsibleId?: string | null; departmentName: string }) =>
      isManager || (!!userId && action.responsibleId === userId) || managedDepartmentNames.includes(action.departmentName),
    [isManager, userId, managedDepartmentNames]
  );

  const canEditDepartment = useCallback(
    (departmentId?: string | null) => isManager || (!!departmentId && managedDepartmentIds.includes(departmentId)),
    [isManager, managedDepartmentIds]
  );

  return {
    loading,
    userId,
    userName: (user as any)?.fullName || 'Inconnu',
    isManager,
    managedDepartmentIds,
    managedDepartmentNames,
    allowedActionDepartments: isManager ? undefined : managedDepartmentNames,
    canManageAction,
    canEditDepartment,
  };
}
