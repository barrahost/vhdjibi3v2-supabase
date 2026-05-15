import { AlertTriangle, WifiOff, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useSMSStatus } from '@/hooks/useSMSStatus';

/**
 * Bannière affichée lorsque le service SMS est dégradé :
 * - api_error  → API Brevo inaccessible
 * - empty      → Plus aucun crédit SMS
 * - low        → Crédit SMS faible (≤ 10 crédits)
 *
 * Disparaît automatiquement dès que le statut repasse à 'ok'.
 * La bannière "low" est dismissible manuellement.
 */
export function SMSStatusBanner() {
  const { status, smsCount, refresh } = useSMSStatus();
  const [dismissed, setDismissed] = useState(false);

  // Ne rien afficher si tout va bien, ou pendant le chargement, ou si fermé
  if (status === 'loading' || status === 'ok') return null;
  if (status === 'low' && dismissed) return null;

  const configs = {
    api_error: {
      bg: 'bg-red-50 border-red-200',
      icon: <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0" />,
      title: 'Service SMS indisponible',
      message: "Le service d'envoi de SMS rencontre une interruption. Aucun message ne peut être envoyé pour le moment. Notre équipe a été informée et le problème sera réglé rapidement.",
      textColor: 'text-red-800',
      mutedColor: 'text-red-600',
      dismissible: false,
    },
    empty: {
      bg: 'bg-orange-50 border-orange-200',
      icon: <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />,
      title: 'Crédit SMS épuisé',
      message: "Le crédit SMS est épuisé. L'envoi de SMS est suspendu jusqu'à rechargement. Le problème sera réglé rapidement.",
      textColor: 'text-orange-800',
      mutedColor: 'text-orange-600',
      dismissible: false,
    },
    low: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />,
      title: 'Crédit SMS faible',
      message: smsCount !== null
        ? `Il reste environ ${smsCount} SMS disponible${smsCount > 1 ? 's' : ''}. Pensez à recharger le crédit prochainement.`
        : "Le crédit SMS est faible. Pensez à le recharger prochainement.",
      textColor: 'text-yellow-800',
      mutedColor: 'text-yellow-600',
      dismissible: true,
    },
  } as const;

  const cfg = configs[status as keyof typeof configs];
  if (!cfg) return null;

  return (
    <div className={`border rounded-lg px-4 py-3 mx-6 mt-4 flex items-start gap-3 ${cfg.bg}`}>
      {cfg.icon}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${cfg.textColor}`}>{cfg.title}</p>
        <p className={`text-sm mt-0.5 ${cfg.mutedColor}`}>{cfg.message}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Bouton rafraîchir (utile pour api_error) */}
        <button
          onClick={refresh}
          className={`p-1 rounded hover:bg-white/60 transition-colors ${cfg.mutedColor}`}
          title="Vérifier à nouveau"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Bouton fermer uniquement pour "low" */}
        {cfg.dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className={`p-1 rounded hover:bg-white/60 transition-colors ${cfg.mutedColor}`}
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
