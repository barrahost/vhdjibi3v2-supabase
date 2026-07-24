import { useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Megaphone, Loader2, CheckCircle2, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { useChurch } from '../contexts/ChurchContext';
import { GenderRadioGroup } from '../components/ui/GenderRadioGroup';
import { useServiceFamilies } from '../hooks/useServiceFamilies';
import {
  GAVE_LIFE_OPTIONS, WILL_JOIN_VH_OPTIONS, PLANNED_SERVICE_OPTIONS,
  type GaveLifeToJesus, type WillJoinVH, type PlannedService,
} from '../types/evangelized.types';

type PageState = 'ready' | 'submitting' | 'done';
const STEP_LABELS = ['Identité & contact', 'Décision', 'Compléments'];

const initial = {
  gender: '' as '' | 'male' | 'female',
  fullName: '',
  phone: '',
  location: '',
  attendedCommunity: '',
  gaveLifeToJesus: '' as '' | GaveLifeToJesus,
  willJoinVH: '' as '' | WillJoinVH,
  plannedService: '' as '' | PlannedService,
  prayerTopics: '',
  interviewerName: '',
  serviceFamilyId: '',
};

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1 mb-1.5">
        {STEP_LABELS.map((_, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                done || active ? 'bg-white text-[#00665C]' : 'bg-white/20 text-white/70'
              }`}>
                {done ? <Check className="w-3 h-3" /> : n}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
        Étape {step}/3 — {STEP_LABELS[step - 1]}
      </p>
    </div>
  );
}

export default function EvangelizationForm() {
  const { loading: churchLoading } = useChurch();
  const { families } = useServiceFamilies(true);
  const [pageState, setPageState] = useState<PageState>('ready');
  const [data, setData] = useState(initial);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [navLocked, setNavLocked] = useState(false);
  const navLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAssignFamily = data.willJoinVH === 'yes' && data.plannedService !== '' && data.plannedService !== 'undecided';

  const lockNav = () => {
    setNavLocked(true);
    if (navLockTimer.current) clearTimeout(navLockTimer.current);
    navLockTimer.current = setTimeout(() => setNavLocked(false), 500);
  };

  const goNext = () => {
    if (step === 1) {
      if (!data.gender) { setStepError('Le genre est obligatoire.'); return; }
      if (!data.fullName.trim()) { setStepError('Le nom est obligatoire.'); return; }
      if (!data.location.trim()) { setStepError('Le lieu de résidence est obligatoire.'); return; }
    }
    setStepError(null);
    lockNav();
    setStep(prev => (prev < 3 ? (prev + 1) as 1 | 2 | 3 : prev));
  };

  const goBack = () => {
    setStepError(null);
    setStep(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : prev));
  };

  const handleSubmit = async () => {
    if (pageState === 'submitting' || navLocked) return;
    setPageState('submitting');
    try {
      const { error } = await supabase.rpc('submit_evangelized_soul', {
        p_church_id: getChurchId(),
        p_full_name: data.fullName.trim(),
        p_gender: data.gender,
        p_phone: data.phone.trim(),
        p_location: data.location.trim(),
        p_attended_community: data.attendedCommunity.trim(),
        p_gave_life_to_jesus: data.gaveLifeToJesus,
        p_will_join_vh: data.willJoinVH,
        p_planned_service: data.plannedService,
        p_prayer_topics: data.prayerTopics.trim(),
        p_interviewer_name: data.interviewerName.trim(),
        p_service_family_id: canAssignFamily ? data.serviceFamilyId : '',
      });
      if (error) throw new Error(error.message);
      setPageState('done');
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi. Réessaie.");
      setPageState('ready');
    }
  };

  const handleReset = () => {
    setData(initial);
    setStep(1);
    setStepError(null);
    setNavLocked(false);
    setPageState('ready');
  };

  if (churchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00665C] animate-spin" />
      </div>
    );
  }

  if (pageState === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-14 h-14 text-[#00665C] mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Fiche enregistrée !</h1>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#00665C]">{data.fullName}</span> a bien été enregistré(e).
          </p>
          <p className="text-xs text-gray-400">L'équipe d'évangélisation assurera le suivi.</p>
          <button
            onClick={handleReset}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Enregistrer une autre fiche
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-[#00665C] text-white px-4 pt-10 pb-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-white/60 mb-1 uppercase tracking-wide">
              Vases d'Honneur — Assemblée Grâce Confondante (AGC)
            </p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Fiche d'évangélisation
            </h1>
            <p className="text-sm text-white/80 mt-1.5 leading-snug">
              À remplir juste après l'entretien avec l'âme rencontrée.
            </p>
            <StepIndicator step={step} />
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5 pb-32">

          {/* Étape 1 — Identité & contact */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <GenderRadioGroup
                value={data.gender as 'male' | 'female' | ''}
                onChange={g => setData(d => ({ ...d, gender: g }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom et Prénoms <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={data.fullName}
                  onChange={e => setData(d => ({ ...d, fullName: e.target.value }))}
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
                  placeholder="0757000203"
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu de résidence <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={data.location}
                  onChange={e => setData(d => ({ ...d, location: e.target.value }))}
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Communauté fréquentée</label>
                <input
                  type="text"
                  value={data.attendedCommunity}
                  onChange={e => setData(d => ({ ...d, attendedCommunity: e.target.value }))}
                  placeholder="Église ou communauté actuelle (optionnel)"
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>
            </div>
          )}

          {/* Étape 2 — Décision */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">L'âme a donné sa vie à Jésus</label>
                <div className="flex flex-wrap gap-1.5">
                  {GAVE_LIFE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setData(d => ({ ...d, gaveLifeToJesus: opt.value }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors ${
                        data.gaveLifeToJesus === opt.value
                          ? 'border-[#00665C] bg-[#00665C]/5 text-[#00665C]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">L'âme rejoindra l'église AGC</label>
                <div className="flex flex-wrap gap-1.5">
                  {WILL_JOIN_VH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setData(d => ({ ...d, willJoinVH: opt.value }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors ${
                        data.willJoinVH === opt.value
                          ? 'border-[#00665C] bg-[#00665C]/5 text-[#00665C]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">À quel culte pensez-vous venir ?</label>
                <select
                  value={data.plannedService}
                  onChange={e => setData(d => ({ ...d, plannedService: e.target.value as PlannedService | '' }))}
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C] bg-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {PLANNED_SERVICE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {canAssignFamily && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Famille orientée</label>
                  <select
                    value={data.serviceFamilyId}
                    onChange={e => setData(d => ({ ...d, serviceFamilyId: e.target.value }))}
                    className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C] bg-white"
                  >
                    <option value="">-- Sélectionner --</option>
                    {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Étape 3 — Compléments */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires / Sujets de prière</label>
                <textarea
                  rows={3}
                  value={data.prayerTopics}
                  onChange={e => setData(d => ({ ...d, prayerTopics: e.target.value }))}
                  placeholder="Notes, sujets de prière partagés par l'âme... (optionnel)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personne ayant conduit l'entretien</label>
                <input
                  type="text"
                  value={data.interviewerName}
                  onChange={e => setData(d => ({ ...d, interviewerName: e.target.value }))}
                  placeholder="Ton nom (optionnel)"
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>
            </div>
          )}

          {stepError && (
            <p className="text-xs text-red-500 flex items-start gap-1.5 px-1">{stepError}</p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={step > 1 ? goBack : undefined}
              disabled={step === 1}
              className="flex items-center gap-1.5 h-12 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            {step < 3 ? (
              <button
                onClick={goNext}
                className="flex-1 h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={pageState === 'submitting' || navLocked}
                className="flex-1 h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-40 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {pageState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
                {pageState === 'submitting' ? 'Envoi en cours...' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
