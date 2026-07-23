import { useState, useEffect } from 'react';
import { Soul } from '../../types/database.types';
import { Modal } from '../ui/Modal';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { validateSoulData } from '../../utils/validation/soulValidation';
import { sanitizeSoulData } from '../../utils/validation/soulSanitizer';
import { formatDateForInput } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { PhotoUpload } from '../ui/PhotoUpload';
import { StorageService } from '../../services/storage.service';
import { isShepherdUser } from '../../utils/roleHelpers';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { LocationField } from './form/LocationField';
import ShepherdSelect from './ShepherdSelect';
import { ProgressionForm } from './progression/ProgressionForm';
import { ProgressionTimeline } from './progression/ProgressionTimeline';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import { Input } from '../ui/input';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import {
  Check, ChevronLeft, ChevronRight,
  Heart, HelpCircle, UserCheck,
} from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────────────────────
const AGE_RANGES = ['10-15', '16-20', '21-27', '28-35', '36-45', '46-59', '60+'];
const MARITAL_STATUSES = [
  { value: 'marie', label: 'Marié(e)' },
  { value: 'concubinage', label: 'Concubinage' },
  { value: 'fiance', label: 'Fiancé(e)' },
  { value: 'seul', label: 'Célibataire' },
];
const DECISIONS = [
  { value: 'give_life', icon: Heart, label: 'Je veux donner ma vie à Jésus-Christ' },
  { value: 'member', icon: UserCheck, label: "Je décide d'être membre" },
  { value: 'undecided', icon: HelpCircle, label: "Indécis(e) pour l'instant" },
] as const;
const STEP_LABELS = ['Identité', 'Contact', 'Décision', 'Spirituel'];

// ─── Indicateur de progression (4 étapes) ────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((_, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                done ? 'bg-brand-700 text-white' :
                active ? 'bg-brand-700 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-brand-700' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-1.5">
        Étape {step}/4 — {STEP_LABELS[step - 1]}
      </p>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface EditSoulModalProps {
  soul: Soul;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EditSoulModal({ soul, isOpen, onClose, onUpdate }: EditSoulModalProps) {
  const { user, userRole, activeRole } = useAuth();
  const { families, loading: loadingFamilies } = useServiceFamilies(true);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentShepherdId, setCurrentShepherdId] = useState<string | undefined>(undefined);
  const [userExplicitlyRemovedPhoto, setUserExplicitlyRemovedPhoto] = useState(false);

  const [formData, setFormData] = useState({
    general: {
      gender: 'male' as 'male' | 'female',
      fullName: '',
      nickname: '',
      phone: '',
      location: '',
      isUndecided: false,
      coordinates: null as { latitude: number; longitude: number } | null,
      firstVisitDate: '',
      shepherdId: undefined as string | undefined,
      status: 'active' as 'active' | 'inactive',
      photo: null as File | null,
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
    spiritual: {} as Soul['spiritualProfile'],
  });

  // Rôle
  const isAdnOnly = (activeRole === 'adn' || userRole === 'adn') && activeRole !== 'admin' && activeRole !== 'super_admin';
  const canEditAdnFields = activeRole === 'admin' || activeRole === 'super_admin' || userRole === 'admin' || userRole === 'super_admin' || isAdnOnly;

  const updateGeneral = (patch: Partial<typeof formData.general>) =>
    setFormData(prev => ({ ...prev, general: { ...prev.general, ...patch } }));

  // Réinitialiser l'étape à chaque ouverture
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  // Charger berger courant
  useEffect(() => {
    const loadShepherdInfo = async () => {
      if (!user || userRole !== 'shepherd') return;
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (currentUserId) {
          const { data: rows } = await supabase
            .from('users')
            .select('id, role')
            .eq('church_id', getChurchId())
            .eq('id', currentUserId)
            .eq('status', 'active')
            .limit(1);
          if (rows && rows.length > 0 && isShepherdUser(rows[0])) {
            setCurrentShepherdId(rows[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading shepherd info:', error);
      }
    };
    loadShepherdInfo();
  }, [user, userRole]);

  // Charger les données de l'âme
  useEffect(() => {
    if (soul && isOpen) {
      setFormData({
        general: {
          gender: soul.gender,
          fullName: soul.fullName,
          nickname: soul.nickname || '',
          phone: soul.phone.replace('+225', ''),
          location: soul.location,
          isUndecided: soul.isUndecided || false,
          coordinates: soul.coordinates ?? null,
          firstVisitDate: formatDateForInput(soul.firstVisitDate),
          shepherdId: soul.shepherdId,
          status: soul.status || 'active',
          photo: null,
          originSource: (soul.originSource as 'culte' | 'evangelisation') || '',
          serviceFamilyId: soul.serviceFamilyId,
          email: soul.email || '',
          profession: soul.profession || '',
          attendedCommunity: soul.attendedCommunity || '',
          isRegular: soul.isRegular ?? null,
          ageRange: soul.ageRange || '',
          maritalStatus: soul.maritalStatus || '',
          decision: (soul.decision as '' | 'give_life' | 'member' | 'undecided')
            || (soul.isUndecided ? 'undecided' : ''),
          prayerRequest: soul.prayerRequest || '',
        },
        spiritual: soul.spiritualProfile,
      });
      setUserExplicitlyRemovedPhoto(false);
    }
  }, [soul, isOpen]);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => setStep(prev => (prev < 4 ? (prev + 1) as 1 | 2 | 3 | 4 : prev));
  const goBack = () => setStep(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 | 4 : prev));

  // ─── Submit (logique 100% identique à l'original) ─────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    try {
      setIsSubmitting(true);

      if (userRole === 'shepherd') {
        if (soul.shepherdId !== currentShepherdId) {
          toast.error('Vous ne pouvez modifier que les âmes qui vous sont assignées');
          return;
        }
      }

      const phoneValidation = validatePhoneNumber(formData.general.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error ?? 'Numéro de téléphone invalide');
        return;
      }

      const { originSource: rawOrigin, ...restGeneral } = formData.general;
      const dataToValidate = {
        ...restGeneral,
        firstVisitDate: new Date(formData.general.firstVisitDate),
        phone: phoneValidation.formattedNumber as string,
        shepherdId: formData.general.shepherdId ?? undefined,
        originSource: rawOrigin === '' ? undefined : rawOrigin,
        ageRange: (restGeneral.ageRange || undefined) as Soul['ageRange'],
        maritalStatus: (restGeneral.maritalStatus || undefined) as Soul['maritalStatus'],
        decision: (restGeneral.decision || undefined) as Soul['decision'],
        spiritualProfile: formData.spiritual,
      };

      const validation = validateSoulData(dataToValidate);
      if (!validation.isValid) {
        toast.error(validation.error ?? 'Erreur de validation des données');
        return;
      }

      if (userRole === 'shepherd' && currentShepherdId) {
        dataToValidate.shepherdId = currentShepherdId;
      }

      let photoURL = soul.photoURL;

      if (userExplicitlyRemovedPhoto && photoURL) {
        try {
          await StorageService.deleteProfilePhoto(photoURL);
          photoURL = undefined;
        } catch (deleteError) {
          console.error('Error deleting photo:', deleteError);
        }
      }

      if (formData.general.photo) {
        try {
          if (photoURL) await StorageService.deleteProfilePhoto(photoURL);
          photoURL = await StorageService.uploadProfilePhoto(soul.id, formData.general.photo);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erreur lors du téléchargement de la photo');
          return;
        }
      }

      const updateData = sanitizeSoulData({
        ...dataToValidate,
        shepherdId: formData.general.isUndecided ? undefined : dataToValidate.shepherdId,
        createdAt: soul.createdAt || new Date(),
        photoURL,
      });

      updateData.is_undecided = formData.general.isUndecided;

      const { error: _updateErr } = await supabase.from('souls').update(updateData).eq('id', soul.id);
      if (_updateErr) throw _updateErr;

      toast.success('Modifications enregistrées avec succès');
      if (onUpdate) onUpdate();
      onClose();
      if (onUpdate) onUpdate();
      success = true;
    } catch (error) {
      console.error('Error updating soul:', error);
      toast.error('Erreur lors de la modification: Vérifiez les données saisies');
    } finally {
      setIsSubmitting(false);
    }
    return success;
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier une âme">
      <form onSubmit={step === 4 ? handleSubmit : e => e.preventDefault()} className="flex flex-col h-[calc(100vh-180px)] max-h-[680px]">
        {/* Indicateur */}
        <div className="px-6 pt-4 pb-3 border-b flex-shrink-0">
          <StepIndicator step={step} />
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Étape 1 : Identité ─────────────────────────────────────── */}
          {step === 1 && (
            <>
              <PhotoUpload
                onChange={file => updateGeneral({ photo: file })}
                currentPhotoURL={soul.photoURL}
                setUserExplicitlyRemovedPhoto={setUserExplicitlyRemovedPhoto}
              />

              <GenderRadioGroup
                value={formData.general.gender}
                onChange={gender => updateGeneral({ gender })}
              />

              <Input
                label="Nom et Prénoms"
                id="edit-fullName"
                type="text"
                required
                value={formData.general.fullName}
                onChange={e => updateGeneral({ fullName: e.target.value })}
              />

              <Input
                label="Surnom"
                id="edit-nickname"
                type="text"
                placeholder="optionnel"
                value={formData.general.nickname}
                onChange={e => updateGeneral({ nickname: e.target.value })}
              />

              <Input
                label="Date de première visite"
                id="edit-firstVisitDate"
                type="date"
                required
                value={formData.general.firstVisitDate}
                onChange={e => updateGeneral({ firstVisitDate: e.target.value })}
              />

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <div className="flex gap-2">
                  {[{ val: 'active', label: 'Actif(ve)' }, { val: 'inactive', label: 'Inactif(ve)' }].map(opt => (
                    <button
                      type="button"
                      key={opt.val}
                      onClick={() => updateGeneral({ status: opt.val as 'active' | 'inactive' })}
                      className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                        formData.general.status === opt.val
                          ? 'border-brand-700 bg-brand-50 text-brand-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Étape 2 : Contact ──────────────────────────────────────── */}
          {step === 2 && (
            <>
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
                    value={formData.general.phone}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateGeneral({ phone: v });
                    }}
                    className="w-full h-12 pl-16 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors"
                    maxLength={10}
                  />
                </div>
              </div>

              <LocationField
                location={formData.general.location}
                coordinates={formData.general.coordinates}
                onLocationChange={location => updateGeneral({ location })}
                onCoordinatesChange={coordinates => updateGeneral({ coordinates })}
              />

              <Input
                label="E-mail"
                id="edit-email"
                type="email"
                placeholder="optionnel"
                value={formData.general.email}
                onChange={e => updateGeneral({ email: e.target.value })}
              />

              <Input
                label="Profession"
                id="edit-profession"
                type="text"
                placeholder="optionnel"
                value={formData.general.profession}
                onChange={e => updateGeneral({ profession: e.target.value })}
              />

              <Input
                label="Communauté fréquentée"
                id="edit-community"
                type="text"
                placeholder="optionnel"
                value={formData.general.attendedCommunity}
                onChange={e => updateGeneral({ attendedCommunity: e.target.value })}
              />

              {/* Régulier */}
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
            </>
          )}

          {/* ── Étape 3 : Décision ─────────────────────────────────────── */}
          {step === 3 && (
            <>
              {/* Cartes décision */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Décision</label>
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
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-brand-700' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-4 h-4 ${selected ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-sm font-medium ${selected ? 'text-brand-700' : 'text-gray-700'}`}>
                          {label}
                        </span>
                        {selected && <Check className="w-4 h-4 text-brand-700 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Berger */}
              {!isAdnOnly && userRole !== 'shepherd' && formData.general.decision !== 'undecided' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berger(e) assigné(e)</label>
                  <ShepherdSelect
                    value={formData.general.shepherdId}
                    onChange={id => updateGeneral({ shepherdId: id === '' ? undefined : id })}
                    disabled={formData.general.isUndecided}
                  />
                </div>
              )}

              {/* Famille de service */}
              {canEditAdnFields && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Famille de service</label>
                  <select
                    value={formData.general.serviceFamilyId || ''}
                    onChange={e => updateGeneral({ serviceFamilyId: e.target.value || undefined })}
                    disabled={loadingFamilies}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors bg-white"
                  >
                    <option value="">-- Sélectionner --</option>
                    {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              {/* Provenance */}
              {canEditAdnFields && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provenance</label>
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

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observations / besoin de prière</label>
                <textarea
                  rows={3}
                  value={formData.general.prayerRequest}
                  onChange={e => updateGeneral({ prayerRequest: e.target.value })}
                  placeholder="Notes, sujets de prière... (optionnel)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors resize-none"
                />
              </div>
            </>
          )}

          {/* ── Étape 4 : Profil spirituel ──────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-brand-700 mb-3 uppercase tracking-wide">Mettre à jour le profil</h3>
                <ProgressionForm
                  value={formData.spiritual}
                  onChange={spiritualData => setFormData(prev => ({ ...prev, spiritual: spiritualData }))}
                  soul={soul}
                  onSoulUpdate={onUpdate}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-700 mb-3 uppercase tracking-wide">Progression spirituelle</h3>
                <ProgressionTimeline spiritualProfile={formData.spiritual} />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-shrink-0 border-t px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={step > 1 ? goBack : onClose}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 h-11 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              {step > 1 ? 'Retour' : 'Annuler'}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-1.5 h-11 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl transition-colors"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1.5 h-11 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
