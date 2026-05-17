import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed as PWA → don't show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Already dismissed → don't show for 7 days
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Detect iOS (iPhone / iPad / iPod)
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    if (ios) {
      // On iOS, show only if user is on Safari (other browsers cannot install PWA on iOS)
      const isSafari =
        /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
      if (isSafari) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Android / Desktop: capture the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo-agc-bergerie.svg"
              alt="AGC Bergerie"
              className="w-10 h-10 rounded-lg object-contain"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">AGC Bergerie</p>
              <p className="text-xs text-gray-500">Installer l'application</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pb-4">
          {isIOS ? (
            /* ── iOS Safari: instructions manuelles ── */
            <>
              <p className="text-sm text-gray-600 mb-3">
                Ajoutez l'appli sur votre écran d'accueil pour un accès rapide, même hors connexion.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00665C] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <p className="text-sm text-gray-700">
                    Appuyez sur{' '}
                    <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-1.5 py-0.5 text-xs font-medium">
                      <Share className="w-3 h-3" /> Partager
                    </span>{' '}
                    en bas de Safari
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00665C] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-gray-700">
                    Faites défiler et choisissez{' '}
                    <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-1.5 py-0.5 text-xs font-medium">
                      <Plus className="w-3 h-3" /> Sur l'écran d'accueil
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00665C] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <p className="text-sm text-gray-700">
                    Appuyez sur <strong>Ajouter</strong> en haut à droite — c'est fait !
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="mt-4 w-full py-2.5 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-lg hover:bg-[#00665C]/5 active:bg-[#00665C]/10"
              >
                Compris, merci !
              </button>
            </>
          ) : (
            /* ── Android / Desktop: prompt natif ── */
            <>
              <p className="text-sm text-gray-600 mb-4">
                Installez l'appli sur votre appareil pour un accès rapide depuis l'écran d'accueil.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {installing ? 'Installation…' : 'Installer'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Barre de couleurs signature */}
        <div className="h-1 bg-gradient-to-r from-[#00665C] via-[#F2B636] to-[#A32035]" />
      </div>
    </div>
  );
}
