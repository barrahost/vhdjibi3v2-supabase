import { useSyncExternalStore } from 'react';

// Le consentement est écrit dans localStorage par CookieBanner / PrivacyPreferencesModal.
// Les invitations « flottantes » (installation de l'appli, notifications) attendent qu'il
// soit donné pour ne pas se superposer au bandeau cookies, qui occupe le bas de l'écran.
const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_CONSENT_EVENT = 'cookie-consent-changed';

export function hasCookieConsent(): boolean {
  try {
    return !!localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch {
    return true; // stockage indisponible : ne bloque pas les invitations
  }
}

/** À appeler juste après avoir enregistré le consentement. */
export function notifyCookieConsentChanged(): void {
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

function subscribe(listener: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, listener);
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, listener);
}

/** true dès que le visiteur a répondu au bandeau cookies. */
export function useCookieConsent(): boolean {
  return useSyncExternalStore(subscribe, hasCookieConsent);
}
