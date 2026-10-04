import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useReceivesAlerts } from '../../hooks/useReceivesAlerts';
import { useCookieConsent } from '../../lib/cookieConsent';
import { dismissPushPrompt, isPushPromptDismissed, isStandalone } from '../../lib/pwaInstall';
import { PushService } from '../../services/push.service';
import { FloatingPrompt, PromptBar } from './PromptBar';

/**
 * À l'ouverture de l'appli installée, propose d'activer les notifications push.
 * Sur iPhone c'est le seul moment possible : iOS n'autorise le push que pour une appli
 * ouverte depuis l'écran d'accueil, et la permission exige un geste de l'utilisateur.
 */
export function PushOptInPrompt() {
  const { user } = useAuth();
  const receivesAlerts = useReceivesAlerts();
  const consented = useCookieConsent();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id || !receivesAlerts || !consented) return;
    if (!isStandalone() || !PushService.isSupported()) return;
    // Permission déjà accordée ou refusée : rien à proposer (le profil permet de changer d'avis)
    if (Notification.permission !== 'default' || isPushPromptDismissed()) return;

    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, [user?.id, receivesAlerts, consented]);

  const dismiss = () => {
    dismissPushPrompt();
    setVisible(false);
  };

  const enable = async () => {
    if (!user?.id) return;
    setBusy(true);
    const ok = await PushService.subscribe(user.id);
    setBusy(false);
    setVisible(false);

    if (ok) {
      toast.success('Notifications activées !');
      return;
    }
    dismissPushPrompt(); // pas d'insistance après un refus ou un échec
    toast.error(
      Notification.permission === 'denied'
        ? 'Notifications bloquées : autorise-les dans les réglages de ton téléphone.'
        : "Impossible d'activer les notifications pour le moment.",
    );
  };

  if (!visible) return null;

  return (
    <FloatingPrompt>
      <PromptBar
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <Bell className="h-5 w-5 text-[#00665C]" />
          </div>
        }
        title="Active les alertes"
        description="Une notification dès qu'une âme t'est confiée"
        actionLabel="Activer"
        onAction={enable}
        onDismiss={dismiss}
        busy={busy}
      />
    </FloatingPrompt>
  );
}
