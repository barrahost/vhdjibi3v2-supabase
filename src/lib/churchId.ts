/**
 * Singleton module-level pour l'ID de l'église courante.
 * Initialisé une seule fois au démarrage depuis ChurchContext.
 * Peut être utilisé dans les pages, composants ET services sans hook React.
 */

let _churchId: string = 'agc';

/** Appelé par ChurchProvider une fois l'église chargée */
export function setCurrentChurchId(id: string): void {
  _churchId = id;
}

/** Retourne l'ID de l'église courante */
export function getChurchId(): string {
  return _churchId;
}
