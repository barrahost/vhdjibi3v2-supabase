import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Search, CheckCircle2, Loader2, UserPlus, HandHeart } from 'lucide-react';
import { useChurch } from '../contexts/ChurchContext';
import { getChurchId } from '../lib/churchId';
import { ReceptionService, CheckinSearchResult } from '../services/reception.service';
import { RecurringScheduleService } from '../services/culteEvent.service';
import { GenderRadioGroup } from '../components/ui/GenderRadioGroup';
import { PhoneInput } from '../components/ui/PhoneInput';
import { PlannedService, PLANNED_SERVICE_TO_MEETING_TYPE } from '../types/evangelized.types';

type PageState = 'loading' | 'ready' | 'submitting' | 'done';
type DoneKind = 'confirmed' | 'new';

// Devine le culte en cours aujourd'hui (1er/2e culte dimanche, RDV mercredi...) à partir du
// programme récurrent : le dernier culte déjà commencé, sinon le prochain à venir. Silencieux
// si aucun culte n'est programmé aujourd'hui (ex: page ouverte un jour quelconque).
async function detectCurrentPlannedService(): Promise<PlannedService | ''> {
  try {
    const schedules = await RecurringScheduleService.list();
    const now = new Date();
    const dow = now.getDay();
    const reverse = Object.entries(PLANNED_SERVICE_TO_MEETING_TYPE) as [PlannedService, string][];

    const todays = schedules
      .filter(s => s.isActive && s.dayOfWeek === dow && s.startTime)
      .map(s => {
        const match = reverse.find(([, name]) => name === s.meetingTypeName);
        return match ? { planned: match[0], startTime: s.startTime as string } : null;
      })
      .filter((x): x is { planned: PlannedService; startTime: string } => !!x)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todays.length === 0) return '';

    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const started = todays.filter(s => toMinutes(s.startTime) <= nowMinutes);
    return (started.length > 0 ? started[started.length - 1] : todays[0]).planned;
  } catch {
    return '';
  }
}

export default function ReceptionCheckIn() {
  const { loading: churchLoading } = useChurch();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [plannedService, setPlannedService] = useState<PlannedService | ''>('');
  const [doneInfo, setDoneInfo] = useState<{ kind: DoneKind; name: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CheckinSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [gender, setGender] = useState<'' | 'male' | 'female'>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (churchLoading) return;
    detectCurrentPlannedService().then(setPlannedService).finally(() => setPageState('ready'));
  }, [churchLoading]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = searchTerm.trim();
    if (term.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await ReceptionService.search(getChurchId(), term);
        setResults(found);
      } catch {
        // silencieux : une recherche ratée ne doit pas bloquer l'auto-enregistrement
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const handleConfirm = async (person: CheckinSearchResult) => {
    setPageState('submitting');
    try {
      await ReceptionService.confirmArrival(person.id, getChurchId(), plannedService);
      setDoneInfo({ kind: 'confirmed', name: person.fullName });
      setPageState('done');
    } catch (e: any) {
      toast.error(e.message || "Erreur, réessaie ou préviens l'équipe d'accueil.");
      setPageState('ready');
    }
  };

  const handleSubmitNew = async () => {
    if (!gender) { setFormError('Le genre est obligatoire.'); return; }
    if (!fullName.trim()) { setFormError('Le nom est obligatoire.'); return; }
    if (!location.trim()) { setFormError('Le lieu de résidence est obligatoire.'); return; }
    setFormError(null);
    setPageState('submitting');
    try {
      await ReceptionService.submitNewVisitor(getChurchId(), fullName, gender, phone, location, plannedService);
      setDoneInfo({ kind: 'new', name: fullName.trim() });
      setPageState('done');
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'envoi. Réessaie.");
      setPageState('ready');
    }
  };

  const handleReset = () => {
    setSearchTerm(''); setResults([]); setShowNewForm(false);
    setGender(''); setFullName(''); setPhone(''); setLocation(''); setFormError(null);
    setDoneInfo(null);
    setPageState('ready');
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00665C] animate-spin" />
      </div>
    );
  }

  if (pageState === 'done' && doneInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-14 h-14 text-[#00665C] mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Bienvenue{doneInfo.name ? `, ${doneInfo.name.split(' ')[0]}` : ''} !</h1>
          <p className="text-sm text-gray-600">
            {doneInfo.kind === 'confirmed'
              ? "C'est noté — l'équipe d'accueil t'attend."
              : 'Ta fiche a bien été enregistrée.'}
          </p>
          <p className="text-xs text-gray-400">Présente-toi à la table de réception, quelqu'un va t'accueillir.</p>
          <button
            onClick={handleReset}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-xl"
          >
            <UserPlus className="w-4 h-4" /> Enregistrer une autre personne
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-[#00665C] text-white px-4 pt-10 pb-6">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-white/60 mb-1 uppercase tracking-wide">
              Vases d'Honneur — Assemblée Grâce Confondante (AGC)
            </p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <HandHeart className="w-5 h-5" />
              Bienvenue !
            </h1>
            <p className="text-sm text-white/80 mt-1.5 leading-snug">
              Première visite ou déjà rencontré(e) par l'un de nous ? Dis-nous qui tu es.
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5 pb-32">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">As-tu déjà rencontré quelqu'un de notre équipe ?</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tape ton nom..."
                autoFocus
                className="w-full h-12 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 animate-spin" />}
            </div>

            {results.length > 0 && (
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleConfirm(r)}
                    disabled={pageState === 'submitting'}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#00665C]/5 transition-colors flex items-center justify-between gap-2 disabled:opacity-50"
                  >
                    <span>
                      <span className="text-sm text-gray-800 font-medium">{r.fullName}</span>
                      {r.location && <span className="block text-xs text-gray-400">{r.location}</span>}
                    </span>
                    <span className="text-xs font-medium text-[#00665C] flex-shrink-0">C'est moi →</span>
                  </button>
                ))}
              </div>
            )}

            {searchTerm.trim().length >= 2 && !searching && results.length === 0 && (
              <p className="text-xs text-gray-400">Aucun résultat pour « {searchTerm.trim()} ».</p>
            )}

            {!showNewForm && (
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full flex items-center justify-center gap-1.5 h-10 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#00665C]/50 hover:text-[#00665C] transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Je ne me trouve pas — c'est ma première fois
              </button>
            )}
          </div>

          {showNewForm && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Faisons connaissance</h2>

              <GenderRadioGroup value={gender} onChange={setGender} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom et Prénoms <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                <PhoneInput value={phone} onChange={setPhone} placeholder="0757000203" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu de résidence <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                />
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <button
                onClick={handleSubmitNew}
                disabled={pageState === 'submitting'}
                className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-40 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {pageState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
                {pageState === 'submitting' ? 'Enregistrement...' : 'Valider'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
