import { useState } from 'react';
import { Link2, Copy, Check, RefreshCw, X } from 'lucide-react';
import { ShepherdConfirmationService } from '../../services/shepherdConfirmation.service';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shepherdId: string;
  shepherdName: string;
}

export function GenerateConfirmationLinkModal({ isOpen, onClose, shepherdId, shepherdName }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const link = token ? `${window.location.origin}/confirm/${token}` : null;

  const generate = async () => {
    setLoading(true);
    try {
      const t = await ShepherdConfirmationService.createToken(shepherdId, shepherdName);
      setToken(t);
      setCopied(false);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du lien');
    } finally {
      setLoading(false);
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
    setToken(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Lien de confirmation</h2>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Génère un lien à envoyer à{' '}
          <span className="font-medium text-gray-800">{shepherdName}</span>. Il coche les
          âmes qu'il suit réellement — les autres sortent de sa liste et passent sans
          berger.
        </p>

        {!token ? (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-10 bg-[#00665C] text-white text-sm font-medium rounded-xl hover:bg-[#00665C]/90 disabled:opacity-50 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            {loading ? 'Génération...' : 'Générer le lien'}
          </button>
        ) : (
          <div className="space-y-3">
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
                disabled={loading}
                title="Regénérer (invalide l'ancien lien)"
                className="h-10 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">Lien valable 7 jours · Usage unique</p>
          </div>
        )}
      </div>
    </div>
  );
}
