import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SMSTemplate } from '../../types/sms.types';
import { SMSService } from '../../services/sms.service';
import { PhotoUpload } from '../ui/PhotoUpload';
import { StorageService } from '../../services/storage.service';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/input';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { LocationField } from './form/LocationField';
import ShepherdSelect from './ShepherdSelect';
import {
  CheckCircle2, Plus, List, AlertTriangle,
  Heart, UserCheck, HelpCircle, Check, ChevronRight, ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LastAddedSoul {
  fullName: string;
  nickname?: string;
  phone?: string;
  serviceFamilyName?: string;
  originSource?: 'culte' | 'evangelisation';
  smsSent: boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const AGE_RANGES = ['10-15', '16-20', '21-27', '28-35', '36-45', '46-59', '60+'];
const MARITAL_STATUSES = [
  { value: 'marie', label: 'Marié(e)' },
  { value: 'concubinage', label: 'Concubinage' },
  { value: 'fiance', label: 'Fiancé(e)' },
  { value: 'seul', label: 'Seul(e)' },
];
const DECISIONS = [
  { value: 'give_life', icon: Heart, label: 'Je veux donner ma vie à Jésus-Christ' },
  { value: 'member', icon: UserCheck, label: "Je décide d'être membre" },
  { value: 'undecided', icon: HelpCircle, label: "Indécis(e) pour l'instant" },
] as const;
const STEP_LABELS = ['Identité', 'Contact', 'Décision'];

const initialFormData = {
  general: {
    gender: '',
    fullName: '',
    nickname: '',
    phone: '',
    location: '',
    coordinates: null as { latitude: number; longitude: number } | null,
    firstVisitDate: new Date().toISOString().split('T')[0],
    shepherdId: undefined as string | undefined,
    isUndecided: false,
    photo: null as File | null,
    status: 'active' as 'active' | 'inactive',
    originSource: '' as '' | 'culte' | 'evangelisation',
    serviceFamilyId: undefined as string | undefined,
    email: '',
    profession: '',
    attendedCommunity: '',
    isRegular: null as boolean | null,
    ageRange: '',
    maritalStatus: '',
    decision: '' as '' | 'give_life' | 'member' | 'undecided',
    prayerRequest: '',
  },
  spiritual: {
    isBornAgain: false,
    isBaptized: false,
    isEnrolledInAcademy: false,
    isEnrolledInLifeBearers: false,
    departments: [] as { name: string; startDate: Date }[],
  },
};

// ─── Indicateur de progression ───────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${
                done ? 'bg-brand-700 text-white' :
                active ? 'bg-brand-700 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-brand-700' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-2">
        Étape {step}/3 — {STEP_LABELS[step - 1]}
      </p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function SoulForm() {
  const navigate = useNavigate();
  const { activeRole, userRole } = useAuth();
  const { families, loading: loadingFamilies } = useServiceFamilies(true);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [lastAddedSoul, setLastAddedSoul] = useState<LastAddedSoul | null>(null);

  // Rôle courant
  const isAdnOnly = (activeRole === 'adn' || userRole === 'adn') && activeRole !== 'admin' && activeRole !== 'super_admin';
  const canEditAdnFields =
    activeRole === 'admin' || activeRole === 'super_admin' ||
    userRole === 'admin' || userRole === 'super_admin' || isAdnOnly;

  useEffect(() => {
    SMSService.getTemplates('Bienvenue')
      .then(setTemplates)
      .catch(() => toast.error('Erreur lors du chargement des modèles'))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const updateGeneral = (patch: Partial<typeof formData.general>) =>
    setFormData(prev => ({ ...prev, general: { ...prev.general, ...patch } }));

  // ─── Validation par étape ─────────────────────────────────────────────────
  const advanceStep = () => {
    setStepError(null);
    if (step === 1) {
      if (!formData.general.gender) { setStepError('Veuillez sélectionner un genre.'); return; }
      if (!formData.general.fullName.trim()) { setStepError('Le nom est obligatoire.'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!formData.general.phone) { setStepError('Le numéro de téléphone est obligatoire.'); return; }
      if (!formData.general.location.trim()) { setStepError("Le quartier est obligatoire."); return; }
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStepError(null);
    setStep(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const buildLastAdded = (smsSent: boolean): LastAddedSoul => ({
    fullName: formData.general.fullName.trim(),
    nickname: formData.general.nickname.trim() || undefined,
    phone: formData.general.phone || undefined,
    serviceFamilyName: formData.general.serviceFamilyId
      ? families.find(f => f.id === formData.general.serviceFamilyId)?.name
      : undefined,
    originSource: (formData.general.originSource || undefined) as 'culte' | 'evangelisation' | undefined,
    smsSent,
  });

  const resetFormState = () => {
    setFormData(initialFormData);
    setSelectedTemplate('');
    setStep(1);
    setStepError(null);
  };

  // ─── Submit (logique identique à l'original) ──────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (!selectedTemplate) { setStepError('Veuillez sélectionner un modèle de message de bienvenue.'); return; }
    if (!formData.general.fullName.trim()) { setStepError('Le nom est obligatoire.'); return; }
    if (!formData.general.gender) { setStepError('Le genre est obligatoire.'); return; }
    if (!formData.general.location.trim()) { setStepError("Le lieu d'habitation est obligatoire."); return; }

    try {
      const effectiveOriginSource = formData.general.originSource || 'culte';
      const soulId = `soul_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const soulData = {
        id: soulId,
        full_name: formData.general.fullName.trim(),
        nickname: formData.general.nickname.trim() || null,
        gender: formData.general.gender,
        phone: formData.general.phone,
        is_undecided: formData.general.decision === 'undecided',
        location: formData.general.location.trim(),
        coordinates: formData.general.coordinates,
        first_visit_date: new Date(formData.general.firstVisitDate).toISOString(),
        shepherd_id: formData.general.shepherdId || null,
        origin_source: effectiveOriginSource,
        service_family_id: formData.general.serviceFamilyId || null,
        spiritual_profile: formData.spiritual,
        status: 'active',
        email: formData.general.email.trim() || null,
        profession: formData.general.profession.trim() || null,
        attended_community: formData.general.attendedCommunity.trim() || null,
        is_regular: formData.general.isRegular,
        age_range: formData.general.ageRange || null,
        marital_status: formData.general.maritalStatus || null,
        decision: formData.general.decision || null,
        prayer_request: formData.general.prayerRequest.trim() || null,
      };

      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('Session expirée. Veuillez vous reconnecter.');
      const user = JSON.parse(userStr);

      let photoURL: string | undefined;
      if (formData.general.photo) {
        const photoId = `soul_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        photoURL = await StorageService.uploadProfilePhoto(photoId, formData.general.photo);
      }

      const { data: insertedSoul, error: insertErr } = await supabase
        .from('souls')
        .insert({ church_id: getChurchId(), ...soulData, created_by: user.id, photo_url: photoURL || null })
        .select('id')
        .single();

      if (insertErr) throw new Error(insertErr.message || "Erreur lors de l'ajout de l'âme");

      const docRef = { id: insertedSoul?.id ?? soulId };
      if (!docRef.id) throw new Error("Erreur lors de l'ajout de l'âme");

      let smsSent = false;
      try {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) throw new Error('Modèle de message non trouvé');

        const creditCheck = await SMSService.checkSufficientCredits();
        if (!creditCheck.sufficient) {
          toast.error("Crédit SMS insuffisant. Le SMS de bienvenue n'a pas été envoyé.");
          setLastAddedSoul(buildLastAdded(false));
          resetFormState();
          toast.success('Âme ajoutée avec succès');
          return;
        }

        await SMSService.sendSMS(soulData.phone.replace('+225', ''), template.content, soulData.full_name, soulData.nickname || undefined);
        await SMSService.createSMSInteraction(user.id, docRef.id, template.content, new Date());
        smsSent = true;
      } catch (smsError) {
        if (smsError instanceof Error && smsError.message.includes('Crédit SMS insuffisant')) {
          toast.error("Crédit SMS insuffisant. Le SMS de bienvenue n'a pas été envoyé.");
        } else {
          toast.error("Le SMS de bienvenue n'a pas pu être envoyé. L'âme a bien été ajoutée.");
        }
      }

      setLastAddedSoul(buildLastAdded(smsSent));
      resetFormState();
      toast.success('Âme ajoutée avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout de l'âme");
    }
  };

  // ─── Confirmation post-ajout ──────────────────────────────────────────────
  if (lastAddedSoul) {
    const Row = ({ label, value }: { label: string; value?: string }) =>
      value ? (
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 py-2 border-b border-gray-100 last:border-b-0">
          <dt className="text-sm font-medium text-gray-500 sm:w-40">{label}</dt>
          <dd className="text-sm text-gray-900 sm:flex-1">{value}</dd>
        </div>
      ) : null;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-green-900">Âme enregistrée avec succès</h2>
            <p className="text-sm text-green-700 mt-0.5">Les informations ont bien été ajoutées.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <dl>
            <Row label="Nom complet" value={lastAddedSoul.fullName} />
            <Row label="Surnom" value={lastAddedSoul.nickname} />
            <Row label="Téléphone" value={lastAddedSoul.phone} />
            <Row label="Famille de service" value={lastAddedSoul.serviceFamilyName} />
            <Row label="Provenance" value={lastAddedSoul.originSource === 'culte' ? 'Culte' : lastAddedSoul.originSource === 'evangelisation' ? 'Évangélisation' : undefined} />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 py-2">
              <dt className="text-sm font-medium text-gray-500 sm:w-40">SMS de bienvenue</dt>
              <dd className="text-sm sm:flex-1">
                {lastAddedSoul.smsSent
                  ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="w-4 h-4" /> Envoyé</span>
                  : <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="w-4 h-4" /> Non envoyé</span>
                }
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setLastAddedSoul(null)}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-4 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Enregistrer une autre âme
          </button>
          <button
            type="button"
            onClick={() => navigate('/ames')}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-4 text-sm font-semibold text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 rounded-xl transition-colors"
          >
            <List className="w-4 h-4" />
            Voir la liste
          </button>
        </div>
      </div>
    );
  }

  // ─── Wizard ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={step === 3 ? handleSubmit : e => e.preventDefault()} className="space-y-0">
      <StepIndicator step={step} />

      {/* ── Étape 1 : Identité ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <GenderRadioGroup
            value={formData.general.gender}
            onChange={gender => updateGeneral({ gender })}
          />

          <Input
            label="Nom et Prénoms"
            id="fullName"
            type="text"
            required
            placeholder="ex: Patrice Tano"
            value={formData.general.fullName}
            onChange={e => updateGeneral({ fullName: e.target.value })}
          />

          <Input
            label="Surnom"
            id="nickname"
            type="text"
            placeholder="ex: Pat (optionnel)"
            value={formData.general.nickname}
            onChange={e => updateGeneral({ nickname: e.target.value })}
          />

          <PhotoUpload
            onChange={photo => updateGeneral({ photo })}
          />

          <Input
            label="Date de première visite"
            id="firstVisitDate"
            type="date"
            required
            value={formData.general.firstVisitDate}
            onChange={e => updateGeneral({ firstVisitDate: e.target.value })}
          />
        </div>
      )}

      {/* ── Étape 2 : Contact & Situation ──────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">+225</span>
              <input
                type="tel"
                required
                placeholder="0757000203"
                value={formData.general.phone}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  updateGeneral({ phone: v });
                }}
                className="w-full h-12 pl-16 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors"
                maxLength={10}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">10 chiffres sans indicatif</p>
          </div>

          <LocationField
            location={formData.general.location}
            coordinates={formData.general.coordinates}
            onLocationChange={location => updateGeneral({ location })}
            onCoordinatesChange={coordinates => updateGeneral({ coordinates })}
          />

          <Input
            label="E-mail"
            id="email"
            type="email"
            placeholder="ex: nom@email.com (optionnel)"
            value={formData.general.email}
            onChange={e => updateGeneral({ email: e.target.value })}
          />

          <Input
            label="Profession"
            id="profession"
            type="text"
            placeholder="ex: Aide ménagère (optionnel)"
            value={formData.general.profession}
            onChange={e => updateGeneral({ profession: e.target.value })}
          />

          <Input
            label="Communauté fréquentée"
            id="attendedCommunity"
            type="text"
            placeholder="ex: Oloivah (optionnel)"
            value={formData.general.attendedCommunity}
            onChange={e => updateGeneral({ attendedCommunity: e.target.value })}
          />

          {/* Régulier ? */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Y êtes-vous régulier(e) ?</label>
            <div className="flex gap-2">
              {[{ val: true, label: 'Oui' }, { val: false, label: 'Non' }].map(({ val, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => updateGeneral({ isRegular: formData.general.isRegular === val ? null : val })}
                  className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                    formData.general.isRegular === val
                      ? 'border-brand-700 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tranche d'âge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tranche d'âge</label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map(range => (
                <button
                  type="button"
                  key={range}
                  onClick={() => updateGeneral({ ageRange: formData.general.ageRange === range ? '' : range })}
                  className={`px-3 py-2 text-sm rounded-xl border-2 font-medium transition-all ${
                    formData.general.ageRange === range
                      ? 'border-brand-700 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Situation matrimoniale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situation matrimoniale</label>
            <select
              value={formData.general.maritalStatus}
              onChange={e => updateGeneral({ maritalStatus: e.target.value })}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors bg-white"
            >
              <option value="">-- Sélectionner --</option>
              {MARITAL_STATUSES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Étape 3 : Décision & Suivi ─────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Cartes décision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Ma décision aujourd'hui</label>
            <div className="space-y-3">
              {DECISIONS.map(({ value, icon: Icon, label }) => {
                const selected = formData.general.decision === value;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => updateGeneral({
                      decision: value,
                      isUndecided: value === 'undecided',
                      shepherdId: value === 'undecided' ? undefined : formData.general.shepherdId,
                    })}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? 'border-brand-700 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-brand-700' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${selected ? 'text-brand-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    {selected && <Check className="w-4 h-4 text-brand-700 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {formData.general.decision === 'undecided' && (
              <p className="mt-2 text-xs text-gray-500">Une âme indécise ne peut pas être assignée à un berger.</p>
            )}
          </div>

          {/* Berger — caché si ADN seul ou indécis */}
          {!isAdnOnly && formData.general.decision !== 'undecided' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berger(e) ou Stagiaire assigné(e)</label>
              <ShepherdSelect
                value={formData.general.shepherdId}
                onChange={id => updateGeneral({ shepherdId: id === '' ? undefined : id })}
                disabled={formData.general.isUndecided}
              />
            </div>
          )}

          {/* Famille de service — visible si ADN ou admin */}
          {canEditAdnFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Famille de service</label>
              <select
                value={formData.general.serviceFamilyId || ''}
                onChange={e => updateGeneral({ serviceFamilyId: e.target.value || undefined })}
                disabled={loadingFamilies}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors bg-white"
              >
                <option value="">-- Sélectionner une famille --</option>
                {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {isAdnOnly && (
                <p className="mt-1 text-xs text-gray-500">Le responsable de famille assignera ensuite l'âme à un berger.</p>
              )}
            </div>
          )}

          {/* Provenance */}
          {canEditAdnFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provenance de l'âme <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[{ value: 'culte', label: 'Culte' }, { value: 'evangelisation', label: 'Évangélisation' }].map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => updateGeneral({ originSource: opt.value as 'culte' | 'evangelisation' })}
                    className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.general.originSource === opt.value
                        ? 'border-brand-700 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Besoin de prière */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observations ou besoin de prière</label>
            <textarea
              rows={3}
              value={formData.general.prayerRequest}
              onChange={e => updateGeneral({ prayerRequest: e.target.value })}
              placeholder="Notes, sujets de prière... (optionnel)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors resize-none"
            />
          </div>

          {/* Modèle SMS de bienvenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message de bienvenue <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              disabled={loadingTemplates}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors bg-white"
            >
              <option value="">Sélectionner un modèle</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            {loadingTemplates && <p className="mt-1 text-xs text-gray-400">Chargement des modèles...</p>}
            {!loadingTemplates && templates.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">Aucun modèle disponible dans la catégorie "Bienvenue"</p>
            )}
          </div>

          {isAdnOnly && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-sm text-brand-700">
              En tant qu'ADN, vous assignez une <strong>famille de service</strong>. Le responsable attribuera ensuite l'âme à un berger.
            </div>
          )}
        </div>
      )}

      {/* ── Erreur ─────────────────────────────────────────────────────── */}
      {stepError && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{stepError}</p>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 h-12 px-5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 h-12 px-5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={advanceStep}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl transition-colors"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 h-12 px-5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Enregistrer l'âme
          </button>
        )}
      </div>
    </form>
  );
}
