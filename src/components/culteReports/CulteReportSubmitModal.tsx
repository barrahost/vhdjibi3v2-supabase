import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { CulteReportService } from '../../services/culteReport.service';
import { MeetingTypeService, SpeakerService } from '../../services/meetingTypeSpeaker.service';
import { CulteEventService } from '../../services/culteEvent.service';
import {
  CulteReportType,
  CulteReportMeetingType,
  CulteReportSpeaker,
  CulteEvent,
  CULTE_REPORT_TYPE_LABELS,
} from '../../types/culteReport.types';
import { CulteReportFields } from './CulteReportFields';
import { CulteReportFormValues, blankFormValues, buildCulteReportData } from '../../utils/culteReportFormHelpers';

interface CulteReportSubmitModalProps {
  isOpen: boolean;
  reportType: CulteReportType;
  departmentId: string | null;
  departmentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

type StepKey = 'event' | 'data-before' | 'data-during' | 'data-after' | 'data' | 'notes';

interface Step {
  key: StepKey;
  label: string;
}

// Date de culte au format JJ/MM/AAAA pour l'affichage
const frDate = (iso: string) => (iso || '').split('-').reverse().join('/');

export default function CulteReportSubmitModal({ isOpen, reportType, departmentId, departmentName, onClose, onSuccess }: CulteReportSubmitModalProps) {
  const { user } = useAuth();
  const [meetingTypes, setMeetingTypes] = useState<CulteReportMeetingType[]>([]);
  const [speakers, setSpeakers] = useState<CulteReportSpeaker[]>([]);
  const [notes, setNotes] = useState('');
  const [needsNotes, setNeedsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<CulteReportFormValues>(blankFormValues());
  const [stepIndex, setStepIndex] = useState(0);

  const [events, setEvents] = useState<CulteEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const selectedEvent = events.find((ev) => ev.id === selectedEventId) || null;

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventDate, setNewEventDate] = useState(todayISO());
  const [newEventMeetingType, setNewEventMeetingType] = useState('');
  const [isCustomMeetingType, setIsCustomMeetingType] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [adnPrefillCount, setAdnPrefillCount] = useState<number | null>(null);

  const steps: Step[] = useMemo(() => {
    const dataSteps: Step[] = reportType === 'sono'
      ? [
          { key: 'data-before', label: 'Avant le culte' },
          { key: 'data-during', label: 'Pendant le culte' },
          { key: 'data-after', label: 'Après le culte' },
        ]
      : [{ key: 'data', label: 'Données du rapport' }];
    return [{ key: 'event', label: 'Culte du jour' }, ...dataSteps, { key: 'notes', label: 'Notes & besoins' }];
  }, [reportType]);
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const resetState = () => {
    setValues(blankFormValues());
    setNotes(''); setNeedsNotes(''); setSelectedEventId(''); setStepIndex(0); setShowCreateEvent(false);
    setNewEventMeetingType(''); setIsCustomMeetingType(false); setAdnPrefillCount(null);
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const today = todayISO();
      await CulteEventService.ensureRecurringEventsForDate(today);
      const [recentEvents, ownReports] = await Promise.all([
        CulteEventService.getRecentEvents(30),
        CulteReportService.getHistory({ reportType }),
      ]);
      const alreadyUsed = new Set(ownReports.map((r) => r.eventId).filter((id): id is string => !!id));
      setEvents(recentEvents.filter((ev) => !alreadyUsed.has(ev.id)));
    } catch (error) {
      console.error('Error loading culte events:', error);
      toast.error('Erreur lors du chargement des cultes');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    MeetingTypeService.list().then(setMeetingTypes);
    if (reportType === 'worship') SpeakerService.list().then(setSpeakers);
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reportType]);

  const handleFieldChange = <K extends keyof CulteReportFormValues>(key: K, value: CulteReportFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // ADN uniquement : pre-remplit les compteurs a partir des ames deja rattachees a ce culte
  // (recues via les liens 1er/2e Culte) -- evite au responsable de tout ressaisir. Reste modifiable.
  useEffect(() => {
    if (reportType !== 'adn' || !selectedEventId) {
      setAdnPrefillCount(null);
      return;
    }
    let cancelled = false;
    CulteReportService.getAdnCountsForEvent(selectedEventId)
      .then((counts) => {
        if (cancelled) return;
        setAdnPrefillCount(counts.soulCount);
        setValues((prev) => ({
          ...prev,
          newVisitorMen: String(counts.newVisitors.men),
          newVisitorWomen: String(counts.newVisitors.women),
          undecided: String(counts.visitorDecisions.undecided),
          wantsToJoinMen: String(counts.visitorDecisions.wantsToJoin.men),
          wantsToJoinWomen: String(counts.visitorDecisions.wantsToJoin.women),
          wantsLifeMen: String(counts.visitorDecisions.wantsToGiveLifeToJesus.men),
          wantsLifeWomen: String(counts.visitorDecisions.wantsToGiveLifeToJesus.women),
        }));
      })
      .catch((error) => console.error('Error pre-filling ADN counts:', error));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedEventId]);

  const handleCreateEvent = async () => {
    if (!newEventMeetingType.trim()) {
      toast.error('Indiquez le type de rencontre');
      return;
    }
    setIsCreatingEvent(true);
    try {
      const event = await CulteEventService.createEvent(newEventDate, newEventMeetingType);
      toast.success('Culte créé');
      setEvents((prev) => [event, ...prev.filter((ev) => ev.id !== event.id)]);
      setSelectedEventId(event.id);
      setShowCreateEvent(false);
      setNewEventMeetingType('');
      setIsCustomMeetingType(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du culte');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const goNext = () => {
    if (currentStep.key === 'event' && !selectedEvent) {
      toast.error('Sélectionnez (ou créez) le culte du jour auquel rattacher ce rapport');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      const data = buildCulteReportData(reportType, values);
      if (!data) throw new Error('Type de rapport inconnu');

      await CulteReportService.submitReport({
        reportType,
        departmentId,
        departmentName,
        worshipReportId: null,
        eventId: selectedEvent.id,
        serviceDate: selectedEvent.serviceDate,
        meetingTypeId: null,
        meetingTypeName: selectedEvent.meetingTypeName,
        submittedBy: user?.id || null,
        submittedByName: user?.fullName || 'Inconnu',
        data,
        notes: notes || undefined,
        needsNotes: needsNotes || undefined,
      });

      toast.success('Rapport enregistré avec succès');
      resetState();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting culte report:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Nouveau rapport — ${CULTE_REPORT_TYPE_LABELS[reportType]}`}>
      {/* Progression */}
      <div className="px-6 pt-4 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 ${
                i < stepIndex ? 'bg-[#00665C] text-white' : i === stepIndex ? 'bg-[#00665C]/15 text-[#00665C] border-2 border-[#00665C]' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? 'bg-[#00665C]' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>
      <p className="px-6 pt-2 text-sm font-medium text-gray-700">
        Étape {stepIndex + 1} sur {steps.length} — {currentStep.label}
      </p>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {currentStep.key === 'event' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Culte du jour (obligatoire)</label>
              <select
                required
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className={inputCls}
                disabled={loadingEvents}
              >
                <option value="">-- Sélectionner --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{frDate(ev.serviceDate)} — {ev.meetingTypeName}</option>
                ))}
              </select>

              {!loadingEvents && events.length === 0 && !showCreateEvent && (
                <p className="mt-1 text-xs text-amber-600">
                  Aucun culte disponible — soit vous avez déjà soumis votre rapport pour tous les cultes récents, soit celui d'aujourd'hui n'a pas encore été créé.
                </p>
              )}

              {!showCreateEvent ? (
                <button
                  type="button"
                  onClick={() => setShowCreateEvent(true)}
                  className="mt-2 text-xs font-medium text-[#00665C] hover:underline"
                >
                  + Créer ce culte (s'il n'apparaît pas dans la liste)
                </button>
              ) : (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date du culte</label>
                      <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Type de rencontre</label>
                      {isCustomMeetingType ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newEventMeetingType}
                            onChange={(e) => setNewEventMeetingType(e.target.value)}
                            placeholder="ex: Veillée de Prière"
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={() => { setIsCustomMeetingType(false); setNewEventMeetingType(''); }}
                            className="px-2 text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                          >
                            Choisir dans la liste
                          </button>
                        </div>
                      ) : (
                        <select
                          value={newEventMeetingType}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') { setIsCustomMeetingType(true); setNewEventMeetingType(''); }
                            else setNewEventMeetingType(e.target.value);
                          }}
                          className={inputCls}
                        >
                          <option value="">-- Sélectionner --</option>
                          {meetingTypes.map((mt) => <option key={mt.id} value={mt.name}>{mt.name}</option>)}
                          <option value="__custom__">Autre (nouveau type)...</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      disabled={isCreatingEvent}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
                    >
                      {isCreatingEvent ? 'Création...' : 'Créer et sélectionner'}
                    </button>
                    <button type="button" onClick={() => setShowCreateEvent(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {reportType === 'worship' && (
              <div>
                <label className={labelCls}>Orateur</label>
                <select value={values.speakerName} onChange={(e) => handleFieldChange('speakerName', e.target.value)} className={inputCls}>
                  <option value="">Sélectionner un orateur</option>
                  {speakers.map((sp) => (
                    <option key={sp.id} value={sp.name}>{sp.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {currentStep.key === 'data' && (
          <>
            {reportType === 'adn' && adnPrefillCount !== null && (
              <p className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-md px-3 py-2">
                Pré-rempli à partir de {adnPrefillCount} âme{adnPrefillCount > 1 ? 's' : ''} déjà enregistrée{adnPrefillCount > 1 ? 's' : ''} pour ce culte — vérifiez avant de soumettre.
              </p>
            )}
            <CulteReportFields reportType={reportType} values={values} onChange={handleFieldChange} />
          </>
        )}
        {currentStep.key === 'data-before' && (
          <CulteReportFields reportType={reportType} values={values} onChange={handleFieldChange} sonoSection="before" />
        )}
        {currentStep.key === 'data-during' && (
          <CulteReportFields reportType={reportType} values={values} onChange={handleFieldChange} sonoSection="during" />
        )}
        {currentStep.key === 'data-after' && (
          <CulteReportFields reportType={reportType} values={values} onChange={handleFieldChange} sonoSection="after" />
        )}

        {currentStep.key === 'notes' && (
          <div className="space-y-6">
            {selectedEvent && (
              <p className="text-xs text-gray-500">
                Culte : <span className="font-medium text-gray-700">{frDate(selectedEvent.serviceDate)} — {selectedEvent.meetingTypeName}</span>
              </p>
            )}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Besoins à signaler (un par ligne)</label>
              <textarea rows={3} value={needsNotes} onChange={(e) => setNeedsNotes(e.target.value)} placeholder="ex: Micro HF à remplacer" className={inputCls} />
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-3">
        <button
          type="button"
          onClick={stepIndex === 0 ? handleClose : goBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {stepIndex === 0 ? 'Annuler' : 'Précédent'}
        </button>
        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg"
          >
            Suivant
          </button>
        )}
      </div>
    </Modal>
  );
}
