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
}
