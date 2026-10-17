import type { CulteAccess } from '../../hooks/useCulteAccess';
import type { CulteEventInfo } from '../../types/culteBrief.types';

/** Propriétés communes aux onglets du cockpit d'un culte. */
export interface CockpitTabProps {
  event: CulteEventInfo;
  /** Tous les cultes suivis du même jour (ex. les 2 du dimanche), dans l'ordre chronologique. */
  dayEvents: CulteEventInfo[];
  access: CulteAccess;
  /** Le cockpit recharge ses compteurs (badges des onglets) après une modification. */
  onChanged?: () => void;
  /** L'onglet reste monté quand on change d'onglet (pour ne pas perdre une saisie) : faux quand il est masqué. */
  active?: boolean;
  /** Prévient le cockpit qu'il y a une saisie non enregistrée (garde-fou avant de changer de culte). */
  onDirtyChange?: (dirty: boolean) => void;
}
