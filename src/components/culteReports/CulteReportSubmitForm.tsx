import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { CulteReportService } from '../../services/culteReport.service';
import { MeetingTypeService, SpeakerService } from '../../services/meetingTypeSpeaker.service';
import { CulteEventService } from '../../services/culteEvent.service';
import {
  CulteReportType,
  CulteReportMeetingType,
  CulteReportSpeaker,
  CulteEvent,
} from '../../types/culteReport.types';
import { CulteReportFields } from './CulteReportFields';
import { CulteReportFormValues, blankFormValues, buildCulteReportData } from '../../utils/culteReportFormHelpers';

interface CulteReportSubmitFormProps {
  reportType: CulteReportType;
  departmentId: string | null;
  departmentName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function CulteReportSubmitForm({ reportType, departmentId, departmentName, onSuccess, onCancel }: CulteReportSubmitFormProps) {
  const { user } = useAuth();
  const [meetingTypes, setMeetingTypes] = useState<CulteReportMeetingType[]>([]);
  const [speakers, setSpeakers] = useState<CulteReportSpeaker[]>([]);
  const [notes, setNotes] = useState('');
  const [needsNotes, setNeedsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<CulteReportFormValues>(blankFormValues());

  // Culte du jour, partage entre tous les departements (worship inclus) -- plus de dependance
  // stricte envers "Gestion des Cultes" : n'importe qui peut creer l'evenement en premier.
  const [events, setEvents] = useState<CulteEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const selectedEvent = events.find((ev) => ev.id === selectedEventId) || null;

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventDate, setNewEventDate] = useState(todayISO());
  const [newEventMeetingType, setNewEventMeetingType] = useState('');
  const [isCustomMeetingType, setIsCustomMeetingType] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const today = todayISO();
      // Genere les evenements du programme recurrent (mercredi/dimanche...) pour aujourd'hui
      // s'ils n'existent pas encore, avant de charger la liste.
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
    MeetingTypeService.list().then(setMeetingTypes);
    if (reportType === 'worship') SpeakerService.list().then(setSpeakers);
  }, [reportType]);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const handleFieldChange = <K extends keyof CulteReportFormValues>(key: K, value: CulteReportFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.error(error.message || "Erreur lors de la création du culte");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) {
      toast.error('Sélectionnez (ou créez) le culte du jour auquel rattacher ce rapport');
      return;
    }

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
      setValues(blankFormValues());
      setNotes(''); setNeedsNotes(''); setSelectedEventId('');
      onSuccess?.();
      loadEvents();
    } catch (error: any) {
      console.error('Error submitting culte report:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
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
            <option key={ev.id} value={ev.id}>{ev.serviceDate} — {ev.meetingTypeName}</option>
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

      <CulteReportFields reportType={reportType} values={values} onChange={handleFieldChange} />

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Besoins à signaler (un par ligne)</label>
        <textarea rows={3} value={needsNotes} onChange={(e) => setNeedsNotes(e.target.value)} placeholder="ex: Micro HF à remplacer" className={inputCls} />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
        </button>
      </div>
    </form>
  );
}
