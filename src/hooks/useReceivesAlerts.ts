import { useAuth } from '../contexts/AuthContext';
import { useCulteModule } from './useCulteModule';

// Mêmes rôles que la cloche de notifications du Header : ce sont eux qui reçoivent des
// alertes (ex. « une âme t'a été confiée »), donc pour qui les notifications push ont du sens.
const SOUL_ALERT_ROLES = ['shepherd', 'intern', 'admin', 'super_admin', 'adn'];

// Module « Cultes » : le pasteur, les pasteurs assistants et les responsables de département
// sont prévenus quand un brief est prêt, qu'un point de contrôle n'est pas OK ou qu'une action leur est confiée.
const CULTE_ALERT_ROLES = ['pasteur', 'pasteur_assistant', 'department_leader', 'admin', 'super_admin'];

export interface AlertTopics {
  /** Âmes confiées, rappels de suivi… */
  souls: boolean;
  /** Brief, contrôle de préparation et plan d'actions des cultes (uniquement si le module est activé). */
  cultes: boolean;
}

export function useAlertTopics(): AlertTopics {
  const { user, userRole, activeRole } = useAuth();
  const { enabled: culteModule } = useCulteModule({ skip: !user });

  // Toutes les casquettes détenues comptent, comme pour la cloche
  const heldRoles = new Set<string>([
    ...(((user?.businessProfiles as any[]) || []).map((p: any) => p?.type).filter(Boolean)),
    ...(userRole ? [userRole as string] : []),
    ...(activeRole ? [activeRole as string] : []),
  ]);

  return {
    souls: SOUL_ALERT_ROLES.some(role => heldRoles.has(role)),
    cultes: culteModule && CULTE_ALERT_ROLES.some(role => heldRoles.has(role)),
  };
}

export function useReceivesAlerts(): boolean {
  const { souls, cultes } = useAlertTopics();
  return souls || cultes;
}
