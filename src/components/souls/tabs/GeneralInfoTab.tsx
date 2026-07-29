import { Input } from '../../ui/input';
import { LocationField } from '../form/LocationField';
import { GenderRadioGroup } from '../../ui/GenderRadioGroup';
import { PhoneInput } from '../../ui/PhoneInput';
import ShepherdSelect from '../ShepherdSelect';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useServiceFamilies } from '../../../hooks/useServiceFamilies';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';

interface GeneralInfoTabProps {
  data: {
    gender: string;
    fullName: string;
    nickname: string;
    phone: string;
    location: string;
    coordinates: { latitude: number; longitude: number; } | null;
    firstVisitDate: string;
    shepherdId: string | undefined;
    isUndecided: boolean;
    status: 'active' | 'inactive';
    photo: File | null;
    originSource?: 'culte' | 'evangelisation' | '';
    serviceFamilyId?: string;
    // Champs carte de bienvenue
    email?: string;
    profession?: string;
    attendedCommunity?: string;
    isRegular?: boolean | null;
    ageRange?: string;
    maritalStatus?: string;
    decision?: '' | 'give_life' | 'member' | 'undecided';
    prayerRequest?: string;
  };
  onChange: (data: any) => void;
  isShepherd?: boolean;
  currentShepherdId?: string | undefined;
}

const AGE_RANGES = ['10-15', '16-20', '21-27', '28-35', '36-45', '46-59', '60+'];
const MARITAL_STATUSES: { value: string; label: string }[] = [
  { value: 'marie', label: 'Marié(e)' },
  { value: 'concubinage', label: 'Concubinage' },
  { value: 'fiance', label: 'Fiancé(e)' },
  { value: 'seul', label: 'Célibataire' },
];

export function GeneralInfoTab({ data, onChange, isShepherd, currentShepherdId }: GeneralInfoTabProps) {
  const [shepherdName, setShepherdName] = useState<string | null>(null);
  const [shepherdRole, setShepherdRole] = useState<string | null>(null);
  const { families, loading: loadingFamilies } = useServiceFamilies(true);
  const { activeRole, userRole } = useAuth();

  // Un ADN n'assigne pas le berger : il assigne une famille de service
  const isAdnOnly = (activeRole === 'adn' || userRole === 'adn') && activeRole !== 'admin' && activeRole !== 'super_admin';

  // Seuls ADN, admin et super_admin peuvent modifier la provenance et la famille de service
  const canEditAdnFields =
    activeRole === 'admin' || activeRole === 'super_admin' ||
    userRole === 'admin' || userRole === 'super_admin' ||
    isAdnOnly;

  // Charger le nom du berger si une âme est assignée
  useEffect(() => {
    const loadShepherdName = async () => {
      if (!data.shepherdId) {
        setShepherdName(null);
        setShepherdRole(null);
        return;
      }

      try {
        const userDoc = await supabase.from('users').select('*').eq('church_id', getChurchId()).eq('id', data.shepherdId).single();
        if (userDoc.exists()) {
          setShepherdName(userDoc.data().fullName);
          setShepherdRole(userDoc.data().role);
        } else {
          setShepherdName('Berger non trouvé');
          setShepherdRole(null);
        }
      } catch (error) {
        console.error('Error loading shepherd name:', error);
        setShepherdName('Erreur de chargement');
        setShepherdRole(null);
      }
    };

    loadShepherdName();
  }, [data.shepherdId]);

  const handleShepherdChange = (shepherdId: string | undefined) => {
    if (isShepherd && shepherdId !== currentShepherdId) {
      toast.error('En tant que berger, vous ne pouvez pas modifier l\'assignation');
      return;
    }
    onChange({ ...data, shepherdId: shepherdId === '' ? undefined : shepherdId });
  };

  return (
    <div className="space-y-4">
      <GenderRadioGroup
        value={data.gender}
        onChange={(gender) => onChange({ ...data, gender })}
      />

      <Input
        label="Nom et Prénoms"
        id="fullName"
        type="text"
        required
        placeholder="ex: Patrice Tano"
        value={data.fullName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, fullName: e.target.value })}
      />

      <Input
        label="Surnom"
        id="nickname"
        type="text"
        placeholder="ex: Pat"
        value={data.nickname}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, nickname: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone
        </label>
        <PhoneInput
          required
          placeholder="0757000203"
          value={data.phone}
          onChange={(phone) => onChange({ ...data, phone })}
        />
      </div>

      <LocationField
        location={data.location}
        coordinates={data.coordinates}
        onLocationChange={(location) => onChange({ ...data, location })}
        onCoordinatesChange={(coordinates) => onChange({ ...data, coordinates })}
      />

      <Input
        label="E-mail"
        id="email"
        type="email"
        placeholder="ex: nom@email.com"
        value={data.email || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, email: e.target.value })}
      />

      <Input
        label="Profession"
        id="profession"
        type="text"
        placeholder="ex: Aide ménagère"
        value={data.profession || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, profession: e.target.value })}
      />

      <Input
        label="Communauté fréquentée"
        id="attendedCommunity"
        type="text"
        placeholder="ex: Oloivah"
        value={data.attendedCommunity || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, attendedCommunity: e.target.value })}
      />

      {/* Régulier ? */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Y êtes-vous régulier(e) ?
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isRegular"
              checked={data.isRegular === true}
              onChange={() => onChange({ ...data, isRegular: true })}
              className="text-[#00665C] focus:ring-[#00665C]"
            />
            <span className="text-sm text-gray-700">Oui</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isRegular"
              checked={data.isRegular === false}
              onChange={() => onChange({ ...data, isRegular: false })}
              className="text-[#00665C] focus:ring-[#00665C]"
            />
            <span className="text-sm text-gray-700">Non</span>
          </label>
        </div>
      </div>

      {/* Tranche d'âge */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tranche d'âge
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((range) => (
            <button
              type="button"
              key={range}
              onClick={() => onChange({ ...data, ageRange: data.ageRange === range ? '' : range })}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                data.ageRange === range
                  ? 'bg-[#00665C] text-white border-[#00665C]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Situation matrimoniale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Situation matrimoniale
        </label>
        <select
          value={data.maritalStatus || ''}
          onChange={(e) => onChange({ ...data, maritalStatus: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="">-- Sélectionner --</option>
          {MARITAL_STATUSES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Provenance de l'âme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provenance de l'âme <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className={`flex items-center gap-2 ${canEditAdnFields ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="radio"
              name="originSource"
              value="culte"
              checked={data.originSource === 'culte'}
              onChange={() => canEditAdnFields && onChange({ ...data, originSource: 'culte' })}
              disabled={!canEditAdnFields}
              className="text-[#00665C] focus:ring-[#00665C]"
            />
            <span className="text-sm text-gray-700">Culte</span>
          </label>
          <label className={`flex items-center gap-2 ${canEditAdnFields ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="radio"
              name="originSource"
              value="evangelisation"
              checked={data.originSource === 'evangelisation'}
              onChange={() => canEditAdnFields && onChange({ ...data, originSource: 'evangelisation' })}
              disabled={!canEditAdnFields}
              className="text-[#00665C] focus:ring-[#00665C]"
            />
            <span className="text-sm text-gray-700">Campagne d'évangélisation</span>
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {canEditAdnFields ? "Précisez d'où vient cette âme" : "Défini par l'ADN — lecture seule"}
        </p>
      </div>

      {/* Famille de service */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Famille de service
        </label>
        <select
          value={data.serviceFamilyId || ''}
          onChange={(e) => onChange({ ...data, serviceFamilyId: e.target.value || undefined })}
          disabled={loadingFamilies || !canEditAdnFields}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C] ${!canEditAdnFields ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        >
          <option value="">-- Sélectionner une famille --</option>
          {families.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {!canEditAdnFields
            ? "Défini par l'ADN — lecture seule"
            : isAdnOnly
              ? "Le responsable de famille assignera ensuite l'âme à un berger"
              : "Optionnel : assigner l'âme à une famille de service"}
        </p>
      </div>

      {/* Ma décision aujourd'hui (pilote isUndecided) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ma décision aujourd'hui
        </label>
        <div className="space-y-2">
          {[
            { value: 'give_life', label: 'Je veux donner ma vie à Jésus-Christ' },
            { value: 'member', label: "Je décide d'être membre" },
            { value: 'undecided', label: 'Indécis(e)' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 ${isShepherd ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <input
                type="radio"
                name="decision"
                value={opt.value}
                checked={data.decision === opt.value}
                disabled={isShepherd || false}
                onChange={() => {
                  const isUndecided = opt.value === 'undecided';
                  onChange({
                    ...data,
                    decision: opt.value,
                    isUndecided,
                    shepherdId: isUndecided ? undefined : data.shepherdId,
                  });
                }}
                className="text-[#00665C] focus:ring-[#00665C]"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Une âme « Indécis(e) » n'est pas encore prête à être suivie et ne peut pas être assignée à un berger.
        </p>
      </div>

      {/* Observations ou besoin de prière */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observations ou besoin de prière
        </label>
        <textarea
          rows={3}
          value={data.prayerRequest || ''}
          onChange={(e) => onChange({ ...data, prayerRequest: e.target.value })}
          placeholder="Notes, sujets de prière..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Statut de l'âme
        </label>
        <select
          value={data.status}
          onChange={(e) => onChange({ ...data, status: e.target.value as 'active' | 'inactive' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={isShepherd || false}
        >
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <p className="text-sm text-gray-500">
          Une âme inactive n'apparaîtra plus dans les listes principales
        </p>
        {isShepherd && (
          <p className="mt-1 text-sm text-gray-500">
            En tant que berger(e), vous ne pouvez pas modifier le statut des âmes
          </p>
        )}
      </div>

      <Input
        label="Date de première visite"
        id="firstVisitDate"
        type="date"
        required
        value={data.firstVisitDate}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, firstVisitDate: e.target.value })}
      />

      {/* Sélection berger : caché pour ADN seul (sauf admin) */}
      {!isAdnOnly && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Berger(e) ou Stagiaire assigné(e)
          </label>
          <ShepherdSelect
            value={data.shepherdId}
            onChange={handleShepherdChange}
            disabled={isShepherd || data.isUndecided}
          />
          {isShepherd && (
            <p className="mt-1 text-sm text-gray-500">
              En tant que berger(e) ou stagiaire, vous êtes automatiquement assigné(e) aux âmes que vous modifiez
            </p>
          )}
          {shepherdName && !isShepherd && (
            <p className="mt-1 text-sm text-gray-500">
              {shepherdRole === 'intern' ? 'Stagiaire' : 'Berger(e)'} actuel(le): {shepherdName}
            </p>
          )}
        </div>
      )}

      {isAdnOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
          ℹ️ En tant qu'ADN, vous assignez une <strong>famille de service</strong>.
          Le responsable de cette famille se chargera ensuite d'attribuer l'âme à un berger.
        </div>
      )}
    </div>
  );
}
