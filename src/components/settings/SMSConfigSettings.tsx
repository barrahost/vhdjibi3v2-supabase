import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { Save, MessageSquare, Key, DollarSign, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSMSStatus } from '../../hooks/useSMSStatus';

type Provider = 'africastalking' | 'orange' | 'letexto';

interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  senderId: string;
}

interface OrangeConfig {
  clientId: string;
  clientSecret: string;
  senderNumber: string;
  senderName: string;
}

interface LeTextoConfig {
  apiKey: string;
  senderId: string;
}

interface ShepherdRemindersConfig {
  enabled: boolean;
  dayOfWeek: number;      // 0 = dimanche ... 6 = samedi
  hour: number;
  thresholdDays: number;
  cooldownDays: number;
  message: string;
}

interface SMSConfig {
  provider: Provider;
  smsCostXOF: number;
  lowCreditThreshold: number;
  africastalking: AfricasTalkingConfig;
  orange: OrangeConfig;
  letexto: LeTextoConfig;
  shepherdReminders: ShepherdRemindersConfig;
}

const DEFAULT_REMINDER_MESSAGE =
  "Bergerie AGC : [surnom], tu as [nombre] ame(s) sans interaction depuis 5+ jours. " +
  "Merci de les contacter et d'enregistrer l'interaction dans l'appli.";

const DEFAULTS: SMSConfig = {
  provider: 'africastalking',
  smsCostXOF: 24,
  lowCreditThreshold: 10,
  africastalking: { apiKey: '', username: 'vhdjibi3', senderId: '' },
  orange: { clientId: '', clientSecret: '', senderNumber: '', senderName: '' },
  letexto: { apiKey: '', senderId: '' },
  shepherdReminders: {
    enabled: false,
    dayOfWeek: 2,
    hour: 8,
    thresholdDays: 5,
    cooldownDays: 7,
    message: DEFAULT_REMINDER_MESSAGE,
  },
};

// Migre l'ancien format plat ({ apiKey, username, senderId, ... }) vers le format imbriqué actuel.
function normalizeConfig(raw: Record<string, any>): SMSConfig {
  return {
    provider: raw.provider || DEFAULTS.provider,
    smsCostXOF: raw.smsCostXOF ?? DEFAULTS.smsCostXOF,
    lowCreditThreshold: raw.lowCreditThreshold ?? DEFAULTS.lowCreditThreshold,
    africastalking: {
      apiKey:   raw.africastalking?.apiKey   ?? raw.apiKey   ?? DEFAULTS.africastalking.apiKey,
      username: raw.africastalking?.username ?? raw.username ?? DEFAULTS.africastalking.username,
      senderId: raw.africastalking?.senderId ?? raw.senderId ?? DEFAULTS.africastalking.senderId,
    },
    orange: {
      clientId:     raw.orange?.clientId     ?? DEFAULTS.orange.clientId,
      clientSecret: raw.orange?.clientSecret ?? DEFAULTS.orange.clientSecret,
      senderNumber: raw.orange?.senderNumber ?? DEFAULTS.orange.senderNumber,
      senderName:   raw.orange?.senderName   ?? DEFAULTS.orange.senderName,
    },
    letexto: {
      apiKey:   raw.letexto?.apiKey   ?? DEFAULTS.letexto.apiKey,
      senderId: raw.letexto?.senderId ?? DEFAULTS.letexto.senderId,
    },
    shepherdReminders: {
      enabled:       raw.shepherdReminders?.enabled ?? DEFAULTS.shepherdReminders.enabled,
      dayOfWeek:     raw.shepherdReminders?.dayOfWeek ?? DEFAULTS.shepherdReminders.dayOfWeek,
      hour:          raw.shepherdReminders?.hour ?? DEFAULTS.shepherdReminders.hour,
      thresholdDays: raw.shepherdReminders?.thresholdDays ?? DEFAULTS.shepherdReminders.thresholdDays,
      cooldownDays:  raw.shepherdReminders?.cooldownDays ?? DEFAULTS.shepherdReminders.cooldownDays,
      message:       raw.shepherdReminders?.message ?? DEFAULTS.shepherdReminders.message,
    },
  };
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export default function SMSConfigSettings() {
  const [config, setConfig]     = useState<SMSConfig>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testOk, setTestOk]     = useState<boolean | null>(null);
  const { status, credits, smsCount, balanceRaw, refresh } = useSMSStatus();

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('church_id', getChurchId())
          .eq('key', 'sms')
          .single();
        if (!error && data?.value) {
          setConfig(normalizeConfig(data.value as Record<string, any>));
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
      toast.success('Connexion au fournisseur SMS réussie');
      refresh();
    } catch {
      setTestOk(false);
      toast.error('Impossible de joindre le fournisseur SMS — vérifiez vos identifiants');
    } finally {
      setTesting(false);
    }
  };

  const statusBadge = {
    loading:     { label: 'Vérification...', cls: 'bg-gray-100 text-gray-600' },
    ok:          { label: 'Opérationnel',    cls: 'bg-green-100 text-green-700' },
    low:         { label: 'Crédit faible',   cls: 'bg-yellow-100 text-yellow-700' },
    empty:       { label: 'Crédit épuisé',   cls: 'bg-red-100 text-red-700' },
    api_error:   { label: 'Erreur API',      cls: 'bg-red-100 text-red-700' },
    unsupported: { label: 'Non disponible',  cls: 'bg-gray-100 text-gray-600' },
  }[status] ?? { label: 'Inconnu', cls: 'bg-gray-100 text-gray-600' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-gray-500 text-sm">Chargement...</span>
      </div>
    );
  }

  const isOrange = config.provider === 'orange';
  const isLeTexto = config.provider === 'letexto';

  return (
    <div className="space-y-6">

      {/* Choix du fournisseur */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Fournisseur SMS</h3>
        <p className="text-sm text-gray-500 mb-4">Le fournisseur actif est utilisé pour tous les envois de l'application.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setConfig(c => ({ ...c, provider: 'africastalking' }))}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              !isOrange && !isLeTexto ? 'border-[#00665C] bg-[#00665C]/5' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-900">Africa's Talking</p>
            <p className="text-xs text-gray-500 mt-1">Paiement carte, multi-opérateurs, déjà en place.</p>
          </button>
          <button
            type="button"
            onClick={() => setConfig(c => ({ ...c, provider: 'orange' }))}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              isOrange ? 'border-[#00665C] bg-[#00665C]/5' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-900">Orange Côte d'Ivoire</p>
            <p className="text-xs text-gray-500 mt-1">Le moins cher, paiement Orange Money / Airtime uniquement.</p>
          </button>
          <button
            type="button"
            onClick={() => setConfig(c => ({ ...c, provider: 'letexto' }))}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              isLeTexto ? 'border-[#00665C] bg-[#00665C]/5' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-900">LeTexto (Arolitec)</p>
            <p className="text-xs text-gray-500 mt-1">Fournisseur ivoirien, solde consultable via API.</p>
          </button>
        </div>
      </div>

      {/* Statut actuel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00665C]/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-[#00665C]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Statut du service</h3>
              <p className="text-sm text-gray-500">
                {isOrange ? "Orange — Côte d'Ivoire" : isLeTexto ? "LeTexto (Arolitec) — Côte d'Ivoire" : "Africa's Talking — Côte d'Ivoire"}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>

        {isOrange ? (
          <p className="text-sm text-gray-500">
            Le solde Orange n'est pas consultable automatiquement — vérifie-le depuis ta console
            développeur Orange ("Your balance").
          </p>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Identifiants — Africa's Talking */}
      {!isOrange && !isLeTexto && (
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
                value={config.africastalking.username}
                onChange={e => setConfig(c => ({ ...c, africastalking: { ...c.africastalking, username: e.target.value } }))}
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
                  value={config.africastalking.apiKey}
                  onChange={e => setConfig(c => ({ ...c, africastalking: { ...c.africastalking, apiKey: e.target.value } }))}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Identifiant expéditeur (Sender ID)
              </label>
              <input
                type="text"
                value={config.africastalking.senderId}
                onChange={e => setConfig(c => ({ ...c, africastalking: { ...c.africastalking, senderId: e.target.value } }))}
                maxLength={11}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                placeholder="Ex: VHAGC (max 11 car.)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Nom affiché comme expéditeur. Laisser vide pour utiliser le numéro AT par défaut.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !config.africastalking.apiKey || !config.africastalking.username}
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
      )}

      {/* Identifiants — Orange */}
      {isOrange && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Key className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Identifiants Orange Côte d'Ivoire</h3>
              <p className="text-sm text-gray-500">Depuis ta console développeur Orange (My Apps)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.orange.clientId}
                onChange={e => setConfig(c => ({ ...c, orange: { ...c.orange, clientId: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none font-mono"
                placeholder="23dpLUejZ2Ds0JyqEM6w3pH9RxbVFmkg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Client Secret <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={config.orange.clientSecret}
                  onChange={e => setConfig(c => ({ ...c, orange: { ...c.orange, clientSecret: e.target.value } }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none font-mono"
                  placeholder="••••••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Numéro expéditeur (SIM Orange) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.orange.senderNumber}
                onChange={e => setConfig(c => ({ ...c, orange: { ...c.orange, senderNumber: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none font-mono"
                placeholder="225XXXXXXXXX"
              />
              <p className="mt-1 text-xs text-gray-500">
                Visible dans l'exemple de code de ta console développeur Orange.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom d'expéditeur (Sender Name)
              </label>
              <input
                type="text"
                value={config.orange.senderName}
                onChange={e => setConfig(c => ({ ...c, orange: { ...c.orange, senderName: e.target.value } }))}
                maxLength={11}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                placeholder="Ex: AGCDJIBI3 (max 11 car.)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Doit correspondre exactement au nom approuvé par l'équipe locale Orange.
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Pas de test de connexion automatique pour Orange — le premier envoi réel validera la config.
          </p>
        </div>
      )}

      {/* Identifiants — LeTexto */}
      {isLeTexto && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Key className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Identifiants LeTexto</h3>
              <p className="text-sm text-gray-500">Depuis ton application LeTexto, section « API développeur »</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Clé API <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.letexto.apiKey}
                  onChange={e => setConfig(c => ({ ...c, letexto: { ...c.letexto, apiKey: e.target.value } }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none font-mono"
                  placeholder="••••••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom d'expéditeur (Sender) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.letexto.senderId}
                onChange={e => setConfig(c => ({ ...c, letexto: { ...c.letexto, senderId: e.target.value } }))}
                maxLength={11}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                placeholder="Ex: VHAGC (max 11 car.)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Doit correspondre à un sender créé et approuvé dans ton compte LeTexto.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !config.letexto.apiKey}
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
            <p className="text-xs text-gray-400">
              Pense à sauvegarder la configuration avant de tester.
            </p>
          </div>
        </div>
      )}

      {/* Rappels automatiques aux bergers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Rappels automatiques aux bergers</h3>
              <p className="text-sm text-gray-500">
                SMS hebdomadaire aux bergers ayant des âmes sans interaction récente
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={config.shepherdReminders.enabled}
              onChange={e => setConfig(c => ({ ...c, shepherdReminders: { ...c.shepherdReminders, enabled: e.target.checked } }))}
              className="h-4 w-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
            />
            <span className="text-sm font-medium text-gray-700">Activer</span>
          </label>
        </div>

        {config.shepherdReminders.enabled && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jour d'envoi</label>
                <select
                  value={config.shepherdReminders.dayOfWeek}
                  onChange={e => setConfig(c => ({ ...c, shepherdReminders: { ...c.shepherdReminders, dayOfWeek: parseInt(e.target.value) } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure</label>
                <select
                  value={config.shepherdReminders.hour}
                  onChange={e => setConfig(c => ({ ...c, shepherdReminders: { ...c.shepherdReminders, hour: parseInt(e.target.value) } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Seuil (jours)</label>
                <input
                  type="number"
                  min={1}
                  value={config.shepherdReminders.thresholdDays}
                  onChange={e => setConfig(c => ({ ...c, shepherdReminders: { ...c.shepherdReminders, thresholdDays: parseInt(e.target.value) || 5 } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Jours sans interaction avant rappel</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Anti-relance (jours)</label>
                <input
                  type="number"
                  min={1}
                  value={config.shepherdReminders.cooldownDays}
                  onChange={e => setConfig(c => ({ ...c, shepherdReminders: { ...c.shepherdReminders, cooldownDays: parseInt(e.target.value) || 7 } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Délai minimum entre 2 rappels au même berger</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message du rappel</label>
              <textarea
                value={config.shepherdReminders.message}
                onChange={e => setConfig(c => ({ ...c, shepherdReminders: { ...c.shepherdReminders, message: e.target.value } }))}
                rows={3}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Variables : <code className="bg-gray-100 px-1 rounded">[surnom]</code> = prénom du berger, <code className="bg-gray-100 px-1 rounded">[nombre]</code> = nombre d'âmes en retard</span>
                <span className={config.shepherdReminders.message.length > 140 ? 'text-amber-600 font-medium' : ''}>
                  {config.shepherdReminders.message.length}/160
                </span>
              </div>
            </div>
          </div>
        )}
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
