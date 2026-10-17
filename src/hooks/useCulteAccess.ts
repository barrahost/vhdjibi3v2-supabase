import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { DEPARTMENT_NAME_BY_REPORT_TYPE, normalizeDeptName } from '../types/culteReport.types';
import { CulteDirectory } from '../services/culteDirectory.service';

export interface CulteAccess {
  loading: boolean;
  userId: string | null;
  userName: string;
  /** Administrateur, pasteur ou responsable du département « Gestion des cultes » : prépare le brief,
   * gère les modèles de contrôle, voit et arbitre tout. */
  isManager: boolean;
  /** Départements dirigés ou supervisés (responsable de département, pasteur assistant). */
  managedDepartmentIds: string[];
  /** Peut-il cocher le contrôle / écrire le débrief de ce département ? */
  canEditDepartment: (departmentId?: string | null) => boolean;
}

/** Droits du module « Cultes », déduits des casquettes de l'utilisateur (même logique que les rapports de culte). */
export function useCulteAccess(): CulteAccess {
  const { user, userRole } = useAuth();
  const [culteDepartmentId, setCulteDepartmentId] = useState<string | null>(null);
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
      .then((departments) => {
        if (cancelled) return;
        const wanted = normalizeDeptName(DEPARTMENT_NAME_BY_REPORT_TYPE.worship);
        setCulteDepartmentId(departments.find((d) => normalizeDeptName(d.name) === wanted)?.id ?? null);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const isManager = isAdmin || isPasteur || (!!culteDepartmentId && managedDepartmentIds.includes(culteDepartmentId));

  const canEditDepartment = useCallback(
    (departmentId?: string | null) => isManager || (!!departmentId && managedDepartmentIds.includes(departmentId)),
    [isManager, managedDepartmentIds]
  );

  return {
    loading,
    userId: (user as any)?.id ?? null,
    userName: (user as any)?.fullName || 'Inconnu',
    isManager,
    managedDepartmentIds,
    canEditDepartment,
  };
}
