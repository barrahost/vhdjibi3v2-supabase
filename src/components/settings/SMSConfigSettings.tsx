import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, MessageSquare, Key, AlertTriangle, Info, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSMSStatus } from '../../hooks/useSMSStatus';

interface SMSConfig {
  username: string;
  senderId: string;
  smsCostXOF: number;
  lowCreditThreshold: number;
}

const DEFAULTS: SMSConfig = {
  username: 'vhdjibi3',
  senderId: '',
  smsCostXOF: 24,
  lowCreditThreshold: 10,
};

export default function SMSConfigSettings() {
  const [config, setConfig] = useState<SMSConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { status, credits, smsCount, balanceRaw, refresh } = useSMSStatus();

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'sms')
          .single();
        if (!error && data?.value) {
          setConfig({ ...DEFAULTS, ...(data.value as SMSConfig) });
        }
      } catch (e) {
        console.error('Erreur chargement config SMS:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'sms', value: config, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Configuration SMS sauvegardée');
      refresh();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = {
    loading: { label: 'Vérification...', className: 'bg-gray-100 text-gray-600' },
    ok:       { label: 'Opérationnel',   className: 'bg-green-100 text-green-700' },
    low:      { label: 'Crédit faible',  className: 'bg-yellow-100 text-yellow-700' },
    empty:    { label: 'Crédit épuisé',  className: 'bg-red-100 text-red-700' },
    api_error:{ label: 'Erreur API',     className: 'bg-red-100 text-red-700' },
  }[status] ?? { label: 'Inconnu', className: 'bg-gray-100 text-gray-600' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-gray-500 text-sm">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut actuel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#00665C]/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-[#00665C]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Statut du service SMS</h3>
            <p className="text-sm text-gray-500">Africa's Talking — Côte d'Ivoire</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Statut</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Solde</p>
            <p className="text-lg font-bold text-gray-900">
              {balanceRaw || (credits !== null ? `XOF ${credits.toFixed(2)}` : '—')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">SMS restants</p>
            <p className="text-lg font-bold text-gray-900">
              {smsCount !== null ? smsCount.toLocaleString() : '—'}
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="mt-3 text-xs text-[#00665C] hover:underline"
        >
          Actualiser le statut
        </button>
      </div>

      {/* Clé API — Supabase secrets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Clé API Africa's Talking</h3>
            <p className="text-sm text-gray-500">Gérée via les secrets Supabase Edge Functions</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sécurité des identifiants</p>
            <p>La clé API (<code className="bg-blue-100 px-1 rounded">AT_API_KEY</code>) est stockée dans les secrets Supabase pour éviter toute exposition côté client. Pour la modifier, accédez à votre projet Supabase → Edge Functions → Secrets.</p>
          </div>
        </div>
      </div>

      {/* Paramètres SMS */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-purple-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Paramètres d'envoi</h3>
            <p className="text-sm text-gray-500">Identifiant expéditeur et seuils d'alerte</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom d'utilisateur Africa's Talking
            </label>
            <input
              type="text"
              value={config.username}
              onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
              placeholder="vhdjibi3"
            />
            <p className="mt-1 text-xs text-gray-500">
              Doit correspondre à la variable <code>AT_USERNAME</code> dans Supabase Secrets
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Identifiant expéditeur (Sender ID)
            </label>
            <input
              type="text"
              value={config.senderId}
              onChange={e => setConfig(c => ({ ...c, senderId: e.target.value }))}
              maxLength={11}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
              placeholder="Ex: VHAGC (max 11 car.)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Affiché comme expéditeur sur le téléphone du destinataire. Laisser vide pour utiliser le numéro par défaut.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Coût par SMS (XOF)
            </label>
            <input
              type="number"
              value={config.smsCostXOF}
              onChange={e => setConfig(c => ({ ...c, smsCostXOF: parseFloat(e.target.value) || 24 }))}
              min={1}
              step={0.5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Utilisé pour estimer le nombre de SMS restants depuis votre solde.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seuil d'alerte crédit faible (nombre de SMS)
            </label>
            <input
              type="number"
              value={config.lowCreditThreshold}
              onChange={e => setConfig(c => ({ ...c, lowCreditThreshold: parseInt(e.target.value) || 10 }))}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Une alerte s'affiche dès que le nombre de SMS restants passe sous ce seuil.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00665C] text-white text-sm font-medium rounded-lg hover:bg-[#00665C]/90 disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
