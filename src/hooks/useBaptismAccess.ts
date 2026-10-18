import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { isBaptismDepartmentName } from '../lib/baptism';
import { getProfileDepartmentIds } from '../types/businessProfile.types';

export interface BaptismAccess {
  loading: boolean;
  /** Peut ouvrir le suivi du baptême : direction (administrateur, pasteur) ou responsable du département Baptême. */
  canView: boolean;
  /** Responsable du département Baptême, ou pasteur assistant qui le supervise. */
  isBaptismLead: boolean;
  /** La vérification a échoué (réseau) : on le dit, on ne renvoie pas la personne à l'accueil sans explication. */
  failed: boolean;
  retry: () => void;
}

const DIRECTION = ['admin', 'super_admin', 'pasteur'];

/**
 * Qui voit le suivi du baptême (toutes les âmes avec leur parcours : nouvelle naissance, baptême) ?
 * La direction, et quiconque dirige (ou supervise, pour un pasteur assistant) un département dont le nom
 * parle du baptême : le rôle se déduit des casquettes de l'utilisateur, il n'y a rien à régler par personne.
 */
export function useBaptismAccess(): BaptismAccess {
  const { user, userRole, availableRoles } = useAuth();
  const [baptismLead, setBaptismLead] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const profiles = useMemo(() => ((((user as any)?.businessProfiles ?? []) as any[]).filter(Boolean)), [user]);
  const isDirection = DIRECTION.includes(userRole as string) || (availableRoles as string[]).some((role) => DIRECTION.includes(role)) || profiles.some((p) => DIRECTION.includes(p.type));

  const departmentIds = useMemo(() => {
    const ids = new Set<string>();
    profiles
      .filter((p) => p.type === 'department_leader' || p.type === 'pasteur_assistant')
      .forEach((p) => getProfileDepartmentIds(p).forEach((id) => ids.add(id)));
    return Array.from(ids);
  }, [profiles]);
  const key = departmentIds.join('|');

  useEffect(() => {
    setFailed(false);
    if (departmentIds.length === 0) {
      setBaptismLead(false);
      return;
    }
    let cancelled = false;
    setBaptismLead(null);
    (async () => {
      try {
        const { data, error } = await supabase.from('departments').select('id, name').eq('church_id', getChurchId()).in('id', departmentIds);
        if (error) throw error;
        if (!cancelled) setBaptismLead((data ?? []).some((d: { name: string }) => isBaptismDepartmentName(d.name)));
      } catch (error) {
        console.error('Error loading departments for baptism access:', error);
        if (!cancelled) {
          setFailed(true);
          setBaptismLead(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const isBaptismLead = baptismLead === true;
  return { loading: !isDirection && baptismLead === null, canView: isDirection || isBaptismLead, isBaptismLead, failed: !isDirection && failed, retry: () => setAttempt((n) => n + 1) };
}
