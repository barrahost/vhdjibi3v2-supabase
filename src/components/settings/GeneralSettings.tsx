import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Globe, Clock, AlertTriangle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMEZONES = [
  { value: 'Africa/Abidjan',      label: 'Abidjan (GMT+0)' },
  { value: 'Africa/Dakar',        label: 'Dakar (GMT+0)' },
  { value: 'Africa/Lagos',        label: 'Lagos (GMT+1)' },
  { value: 'Africa/Douala',       label: 'Douala (GMT+1)' },
  { value: 'Africa/Kinshasa',     label: 'Kinshasa (GMT+1)' },
  { value: 'Africa/Nairobi',      label: 'Nairobi (GMT+3)' },
  { value: 'Europe/Paris',        label: 'Paris (GMT+1/+2)' },
  { value: 'America/New_York',    label: 'New York (GMT-5/-4)' },
  { value: 'America/Montreal',    label: 'Montréal (GMT-5/-4)' },
];

interface GeneralConfig {
  churchName: string;
  timezone: string;
  maintenanceMode: boolean;
}

const DEFAULTS: GeneralConfig = {
  churchName: "Vases d'Honneur Assemblée Grâce Confondante",
  timezone: 'Africa/Abidjan',
  maintenanceMode: false,
};

export default function GeneralSettings() {
  const [config, setConfig] = useState<GeneralConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'general')
          .single();
        if (!error && data?.value) {
          setConfig({ ...DEFAULTS, ...(data.value as GeneralConfig) });
        }
      } catch (e) {
        console.error('Erreur chargement paramètres généraux:', e);
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
        .upsert({ key: 'general', value: config, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Paramètres généraux sauvegardés');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-gray-500 text-sm">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nom de l'église */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-[#00665C]/10 rounded-lg">
            <Building2 className="w-5 h-5 text-[#00665C]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Identité de l'église</h3>
            <p className="text-sm text-gray-500">Nom affiché dans l'application</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom de l'église
          </label>
          <input
            type="text"
            value={config.churchName}
            onChange={e => setConfig(c => ({ ...c, churchName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none"
            placeholder="Ex: Assemblée de Dieu - Abidjan"
          />
        </div>
      </div>

      {/* Fuseau horaire */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Fuseau horaire</h3>
            <p className="text-sm text-gray-500">Utilisé pour les dates et heures dans l'application</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fuseau horaire
          </label>
          <select
            value={config.timezone}
            onChange={e => setConfig(c => ({ ...c, timezone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] outline-none bg-white"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode maintenance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Mode maintenance</h3>
            <p className="text-sm text-gray-500">Bloque l'accès à l'application pour tous les utilisateurs sauf les super admins</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {config.maintenanceMode ? 'Maintenance activée' : 'Application en ligne'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.maintenanceMode
                ? 'Les utilisateurs voient une page de maintenance'
                : "L'application est accessible normalement"}
            </p>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, maintenanceMode: !c.maintenanceMode }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              config.maintenanceMode ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {config.maintenanceMode && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ Le mode maintenance est actif. Seuls les super admins peuvent se connecter.
          </div>
        )}
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
