import { useState, useEffect } from 'react';
import { Link2, Copy, Check, RefreshCw, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { ShepherdConfirmationService, ConfirmationToken } from '../../services/shepherdConfirmation.service';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shepherdId: string;
  shepherdName: string;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function GenerateConfirmationLinkModal({ isOpen, onClose, shepherdId, shepherdName }: Props) {
  const [existing, setExisting] = useState<ConfirmationToken | null | 'loading'>('loading');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Charger le statut existant à chaque ouverture
  useEffect(() => {
    if (!isOpen || !shepherdId) return;
    setExisting('loading');
    setNewToken(null);
    setCopied(false);
    ShepherdConfirmationService.getLatestToken(shepherdId)
      .then(t => setExisting(t))
      .catch(() => setExisting(null));
  }, [isOpen, shepherdId]);

  if (!isOpen) return null;

  const activeToken = newToken ?? (existing !== 'loading' && existing?.status === 'pending' && existing.expiresAt > new Date() ? existing.token : null);
  const link = activeToken ? `${window.location.origin}/confirm/${activeToken}` : null;

  const generate = async () => {
    setGenerating(true);
    try {
      const t = await ShepherdConfirmationService.createToken(shepherdId, shepherdName);
      setNewToken(t);
      setExisting(null);
      setCopied(false);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du lien');
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success('Lien copié');
  };

  const handleClose = () => {
    setNewToken(null);
    setCopied(false);
    onClose();
  };

  // ── Statut calculé ──────────────────────────────────────────────────────────
  const isValidated  = existing !== 'loading' && existing?.status === 'used';
  const isPending    = existing !== 'loading' && existing?.status === 'pending' && existing.expiresAt > new Date();
  const isExpired    = existing !== 'loading' && existing?.status === 'pending' && existing && existing.expiresAt <= new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Lien de confirmation</h2>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Berger : <span className="font-medium text-gray-800">{shepherdName}</span>
        </p>

        {/* Statut actuel */}
        {existing === 'loading' ? (
          <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Vérification en cours...
          </div>
        ) : isValidated ? (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Liste validée</p>
              <p className="text-green-600 text-xs mt-0.5">
                Validée le {fmtDate(existing!.usedAt ?? existing!.createdAt)}
              </p>
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Lien en attente</p>
              <p className="text-amber-600 text-xs mt-0.5">
                Expire le {fmtDate(existing!.expiresAt)}
              </p>
            </div>
          </div>
        ) : isExpired ? (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-gray-600">Lien expiré</p>
              <p className="text-gray-400 text-xs mt-0.5">Génère un nouveau lien ci-dessous.</p>
            </div>
          </div>
        ) : null}

        {/* Lien actif (en attente ou nouveau) */}
        {link && (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 break-all">
              <span className="text-xs text-gray-600 font-mono">{link}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#00665C] text-white text-sm font-medium rounded-xl hover:bg-[#00665C]/90 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
              <button
                onClick={generate}
                disabled={generating}
                title="Regénérer (invalide l'ancien lien)"
                className="h-10 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${generating ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">Lien valable 7 jours · Usage unique</p>
          </div>
        )}

        {/* Bouton générer (si pas de lien actif) */}
        {!link && existing !== 'loading' && (
          <button
            onClick={generate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 h-10 bg-[#00665C] text-white text-sm font-medium rounded-xl hover:bg-[#00665C]/90 disabled:opacity-50 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            {generating ? 'Génération...' : isValidated ? 'Nouveau lien (re-confirmation)' : 'Générer le lien'}
          </button>
        )}
      </div>
    </div>
  );
}
