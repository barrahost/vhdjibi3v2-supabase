import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PlusSquare, Share, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChurch } from '../../contexts/ChurchContext';
import { useReceivesAlerts } from '../../hooks/useReceivesAlerts';
import { useCookieConsent } from '../../lib/cookieConsent';
import {
  dismissInstallPrompt,
  getInstallPlatform,
  getInstallState,
  isInstallPromptDismissed,
  promptInstall,
  subscribeInstallState,
  type InstallPlatform,
} from '../../lib/pwaInstall';
import { FloatingPrompt, PromptBar } from './PromptBar';

interface PWAInstallBannerProps {
  /**
   * 'login' : carte en haut de la page de connexion, dès l'arrivée, avec les étapes visibles ;
   * 'app'   : barre compacte flottante au-dessus du menu du bas, une fois les cookies réglés.
   */
  placement?: 'login' | 'app';
}

// Le domaine super admin n'a rien à installer côté mobile
const isSuperAdminDomain = () => window.location.hostname.split('.')[0] === 'bergerie-adm';

export function PWAInstallBanner({ placement = 'app' }: PWAInstallBannerProps) {
  const { church } = useChurch();
  const receivesAlerts = useReceivesAlerts();
  const consented = useCookieConsent();
  const installState = useSyncExternalStore(subscribeInstallState, getInstallState);

  const [platform] = useState(getInstallPlatform);
  const [dismissed, setDismissed] = useState(isInstallPromptDismissed);
  const [ready, setReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const appName = church?.shortName || church?.name || 'Bergerie';
  const appLogo = church?.logoUrl || '/logo-agc-bergerie.svg';

  // Barre flottante : pas tant que le bandeau cookies (en bas aussi) est affiché, puis un
  // court délai pour ne pas surgir pendant le chargement. La carte du haut n'en a pas besoin.
  useEffect(() => {
    if (placement !== 'app' || !consented) return;
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, [placement, consented]);

  // Android : l'installation vient d'être faite (via notre bouton ou le menu du navigateur).
  // Le toast n'est émis que si le changement a lieu pendant que ce composant est monté :
  // ni au retour sur une page (connexion → appli) ni deux fois pour la même installation.
  const previousInstallState = useRef(installState);
  useEffect(() => {
    if (installState === 'installed' && previousInstallState.current !== 'installed') {
      toast.success("Appli installée ! Ouvre-la depuis ton écran d'accueil.");
    }
    previousInstallState.current = installState;
  }, [installState]);

  const available =
    platform === 'ios-safari' ||
    platform === 'ios-browser' ||
    (platform === 'native' && installState === 'ready');

  const dismiss = () => {
    dismissInstallPrompt();
    setDismissed(true);
    setGuideOpen(false);
  };

  const handleInstall = async () => {
    if (platform !== 'native') {
      setGuideOpen(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome !== 'accepted') dismiss(); // refus ou échec : on laisse tranquille 7 jours
  };

  if (!available || dismissed || isSuperAdminDomain()) return null;

  if (placement === 'login') {
    return (
      <div className="mb-5 sm:mx-auto sm:w-full sm:max-w-xl">
        <InstallCard
          appName={appName}
          appLogo={appLogo}
          platform={platform}
          onInstall={handleInstall}
          onDismiss={dismiss}
        />
      </div>
    );
  }

  if (!consented || !ready) return null;

  return (
    <>
      <FloatingPrompt>
        <PromptBar
          icon={<img src={appLogo} alt="" className="h-10 w-10 rounded-lg object-contain" />}
          title="Installe l'appli"
          description={
            receivesAlerts
              ? 'Reçois tes alertes, même appli fermée'
              : "Accès rapide depuis ton écran d'accueil"
          }
          actionLabel="Installer"
          onAction={handleInstall}
          onDismiss={dismiss}
        />
      </FloatingPrompt>

      {guideOpen && (
        <IosInstallGuide
          appName={appName}
          needsSafari={platform === 'ios-browser'}
          onClose={dismiss}
        />
      )}
    </>
  );
}

// ── Carte d'arrivée (page de connexion) ────────────────────────────────────────────────────
// Android : un bouton qui ouvre la fenêtre d'installation native.
// iPhone / iPad : aucune installation automatique possible → les étapes sont affichées tout de suite.
function InstallCard({
  appName,
  appLogo,
  platform,
  onInstall,
  onDismiss,
}: {
  appName: string;
  appLogo: string;
  platform: InstallPlatform;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const manualSteps = platform !== 'native';

  return (
    <div
      role="region"
      aria-label={`Installer ${appName}`}
      className="animate-fade-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={appLogo}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded-xl bg-brand-50 object-contain p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-gray-900">Installer {appName}</p>
            <p className="text-sm leading-snug text-gray-500">
              Pour recevoir tes alertes, même appli fermée
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Plus tard"
            title="Plus tard"
            className="-mr-1 flex-shrink-0 self-start rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {manualSteps ? (
          <>
            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <p className="mb-3 text-sm font-medium text-gray-700">Comment installer :</p>
              <IosInstallSteps needsSafari={platform === 'ios-browser'} />
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            >
              J'ai compris
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onInstall}
            className="mt-4 w-full rounded-xl bg-[#00665C] py-2.5 text-sm font-medium text-white hover:bg-[#00665C]/90 active:bg-[#00524A]"
          >
            Installer
          </button>
        )}
      </div>
      {/* Barre de couleurs signature */}
      <div className="h-1 bg-gradient-to-r from-[#00665C] via-[#F2B636] to-[#A32035]" />
    </div>
  );
}

// ── Étapes d'installation iPhone / iPad (partagées par la carte et le guide) ──────────────
function IosInstallSteps({ needsSafari }: { needsSafari: boolean }) {
  const steps = [
    <>
      Appuie sur{' '}
      <span className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-xs font-medium ring-1 ring-gray-200">
        <Share className="h-3 w-3" /> Partager
      </span>{' '}
      dans la barre de Safari
    </>,
    <>
      Fais défiler et choisis{' '}
      <span className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-xs font-medium ring-1 ring-gray-200">
        <PlusSquare className="h-3 w-3" /> Sur l'écran d'accueil
      </span>
    </>,
    <>
      Confirme avec <strong>Ajouter</strong>
    </>,
  ];

  return (
    <>
      {needsSafari && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Sur iPhone, l'installation se fait depuis <strong>Safari</strong> : ouvre cette page
          dans Safari, puis suis les étapes ci-dessous.
        </p>
      )}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#00665C] text-xs font-bold text-white">
              {index + 1}
            </span>
            <p className="text-sm text-gray-700">{step}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

// ── Guide en feuille modale (barre flottante de l'appli, sur iPhone / iPad) ────────────────
function IosInstallGuide({
  appName,
  needsSafari,
  onClose,
}: {
  appName: string;
  needsSafari: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="animate-slide-up relative w-full max-w-md rounded-t-2xl bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="ios-install-title" className="text-base font-semibold text-gray-900">
            Ajouter {appName} à ton écran d'accueil
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 mt-1 text-sm text-gray-600">
          Reçois tes alertes même appli fermée et ouvre l'appli en un geste.
        </p>

        <IosInstallSteps needsSafari={needsSafari} />

        <p className="mt-4 text-xs text-gray-500">
          Ensuite, ouvre l'appli depuis son icône sur ton écran d'accueil : c'est là que tu
          pourras activer les notifications.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-[#00665C] py-2.5 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/5 active:bg-[#00665C]/10"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}
