// Installation de l'appli (PWA) — proposée uniquement sur mobile.
//
// Sur Android/Chrome, `beforeinstallprompt` n'est émis qu'UNE seule fois par chargement
// de page, très tôt. Comme le bandeau n'est monté que plus tard (page de login, ou
// après connexion), on intercepte l'événement dès le démarrage et on le garde ici.
// → ce module doit être importé EN PREMIER par main.tsx (il s'abonne à l'import).
//
// iOS n'a aucune API d'installation : le bandeau n'y propose qu'un guide manuel.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'unavailable' | 'ready' | 'installed';

/** Comment installer sur cet appareil : prompt natif, guide Safari, guide « ouvre Safari », rien. */
export type InstallPlatform = 'native' | 'ios-safari' | 'ios-browser' | 'none';

// ── Rappels : « Plus tard » masque l'invitation pendant 7 jours ─────────────────────────
const SNOOZE_DAYS = 7;
const INSTALL_SNOOZE_KEY = 'pwa-banner-dismissed'; // clé historique, même format (date ISO)
const PUSH_SNOOZE_KEY = 'push-prompt-dismissed';

function isSnoozed(key: string): boolean {
  try {
    const value = localStorage.getItem(key);
    if (!value) return false;
    const days = (Date.now() - new Date(value).getTime()) / 86_400_000;
    return Number.isFinite(days) && days < SNOOZE_DAYS;
  } catch {
    return false;
  }
}

function snooze(key: string): void {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    /* stockage indisponible : l'invitation reviendra, sans conséquence */
  }
}

export const isInstallPromptDismissed = () => isSnoozed(INSTALL_SNOOZE_KEY);
export const dismissInstallPrompt = () => snooze(INSTALL_SNOOZE_KEY);
export const isPushPromptDismissed = () => isSnoozed(PUSH_SNOOZE_KEY);
export const dismissPushPrompt = () => snooze(PUSH_SNOOZE_KEY);

// ── Détection de l'appareil ─────────────────────────────────────────────────────────────
const userAgent = () => navigator.userAgent || '';

/** L'appli tourne déjà installée (écran d'accueil), pas dans un onglet de navigateur. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  // iPadOS 13+ se présente comme un Mac : on le reconnaît à son écran tactile
  return (
    /iPad|iPhone|iPod/.test(userAgent()) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function getInstallPlatform(): InstallPlatform {
  if (isStandalone()) return 'none';

  if (isIOS()) {
    const ua = userAgent();
    // Chrome / Firefox / Edge / Opera sur iOS : l'installation fiable passe par Safari
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return 'ios-browser';
    // Les navigateurs intégrés (WhatsApp, Instagram…) n'ont pas « Safari » dans leur UA
    return /Safari/.test(ua) ? 'ios-safari' : 'none';
  }

  // Android : proposé seulement si le navigateur a émis `beforeinstallprompt`
  return /Android/i.test(userAgent()) ? 'native' : 'none';
}

// ── Capture de `beforeinstallprompt` (Android) ──────────────────────────────────────────
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

export function subscribeInstallState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallState(): InstallState {
  if (installed) return 'installed';
  return deferredPrompt ? 'ready' : 'unavailable';
}

/**
 * Déclenche la fenêtre d'installation native (à appeler depuis un clic).
 * L'événement n'est utilisable qu'une fois : il est consommé dans tous les cas.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferredPrompt;
  if (!event) return 'unavailable';
  deferredPrompt = null;
  emit();
  try {
    await event.prompt();
    return (await event.userChoice).outcome;
  } catch {
    return 'unavailable';
  }
}

if (typeof window !== 'undefined' && getInstallPlatform() === 'native') {
  window.addEventListener('beforeinstallprompt', event => {
    // Empêche la mini-barre native de Chrome : c'est notre bandeau qui propose l'installation
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    emit();
  });
}
