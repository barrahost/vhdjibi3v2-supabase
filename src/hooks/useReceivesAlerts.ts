import { useAuth } from '../contexts/AuthContext';

// Mêmes rôles que la cloche de notifications du Header : ce sont eux qui reçoivent des
// alertes (ex. « une âme t'a été confiée »), donc pour qui les notifications push ont du sens.
const ALERT_ROLES = ['shepherd', 'intern', 'admin', 'super_admin', 'adn'];

export function useReceivesAlerts(): boolean {
  const { user, userRole, activeRole } = useAuth();

  // Toutes les casquettes détenues comptent, comme pour la cloche
  const heldRoles = new Set<string>([
    ...(((user?.businessProfiles as any[]) || []).map((p: any) => p?.type).filter(Boolean)),
    ...(userRole ? [userRole as string] : []),
    ...(activeRole ? [activeRole as string] : []),
  ]);

  return ALERT_ROLES.some(role => heldRoles.has(role));
}
