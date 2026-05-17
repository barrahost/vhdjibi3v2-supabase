import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, MessageSquare, Key, DollarSign, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSMSStatus } from '../../hooks/useSMSStatus';

interface SMSConfig {
  apiKey: string;
  username: string;
  senderId: string;
  smsCostXOF: number;
  lowCreditThreshold: number;
}

const DEFAULTS: SMSConfig = {
  apiKey: '',
  username: 'vhdjibi3',
  senderId: '',
  smsCostXOF: 24,
  lowCreditThreshold: 10,
};

export default function SMSConfigSettings() {
  const [config, setConfig]     = useState<SMSConfig>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testOk, setTestOk]     = useState<boolean | null>(null);
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
    setTestOk(null);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'sms', value: config, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
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

  const handleTest = async () => {
    setTesting(true);
    setTestOk(null);
    try {
      const { data, error } = await supabase.functions.invoke('check-sms-balance');
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setTestOk(true);
      toast.success('Connexion Africa\'s Talking réussie');
      refresh();
    } catch {
      setTestOk(false);
      toast.error('Impossible de joindre Africa\'s Talking — vérifiez vos identifiants');
    } finally {
      setTesting(false);
    }
  };

  const statusBadge = {
    loading:   { label: 'Vérification...', cls: 'bg-gray-100 text-gray-600' },
    ok:        { label: 'Opérationnel',    cls: 'bg-green-100 text-green-700' },
    low:       { label: 'Crédit faible',   cls: 'bg-yellow-100 text-yellow-700' },
    empty:     { label: 'Crédit épuisé',   cls: 'bg-red-100 text-red-700' },
    api_error: { label: 'Erreur API',      cls: 'bg-red-100 text-red-700' },
  }[status] ?? { label: 'Inconnu', cls: 'bg-gray-100 text-gray-600' };

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00665C]/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-[#00665C]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Statut du service</h3>
              <p className="text-sm text-gray-500">Africa's Talking — Côte d'Ivoire</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Coût unitaire</p>
            <p className="text-lg font-bold text-gray-900">{config.smsCostXOF} XOF</p>
          </div>
        </div>
        <button onClick={refresh} className="mt-3 text-xs text-[#00665C] hover:underline">
          Actualiser le statut
        </button>
      </div>

      {/* Identifiants Africa's Talking */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Identifiants Africa's Talking</h3>
            <p className="text-sm text-gray-500">Nécessaires pour envoyer des SMS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom d'utilisateur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.username}
              onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
              placeholder="Ex: vhdjibi3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Clé API (API Key) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none font-mono"
                placeholder="atsk_xxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config.apiKey && (
              <p className="mt-1 text-xs text-gray-400 font-mono">
                {config.apiKey.slice(0, 8)}{'•'.repeat(Math.max(0, config.apiKey.length - 8))}
              </p>
            )}
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
              Nom affiché comme expéditeur. Laisser vide pour utiliser le numéro AT par défaut.
            </p>
          </div>
        </div>

        {/* Bouton tester la connexion */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !config.apiKey || !config.username}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#00665C] text-[#00665C] rounded-lg hover:bg-[#00665C]/5 disabled:opacity-50 transition-colors"
          >
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>
          {testOk === true && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" /> Connexion réussie
            </span>
          )}
          {testOk === false && (
            <span className="text-sm text-red-600 font-medium">
              ✗ Connexion échouée — vérifiez vos identifiants
            </span>
          )}
        </div>
      </div>

      {/* Paramètres de coût et alertes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-purple-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Coût et alertes</h3>
            <p className="text-sm text-gray-500">Estimation du solde et seuil d'alerte</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              Sert à estimer le nombre de SMS restants depuis votre solde.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seuil d'alerte crédit faible (nbre de SMS)
            </label>
            <input
              type="number"
              value={config.lowCreditThreshold}
              onChange={e => setConfig(c => ({ ...c, lowCreditThreshold: parseInt(e.target.value) || 10 }))}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Une bannière d'alerte s'affiche dès que le solde passe sous ce seuil.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
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
