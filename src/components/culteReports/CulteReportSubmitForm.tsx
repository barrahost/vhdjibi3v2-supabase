import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { CulteReportService } from '../../services/culteReport.service';
import { MeetingTypeService, SpeakerService } from '../../services/meetingTypeSpeaker.service';
import {
  CulteReportType,
  CulteReportMeetingType,
  CulteReportSpeaker,
  WorshipReportData,
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
  const [serviceDate, setServiceDate] = useState(todayISO());
  const [meetingTypeName, setMeetingTypeName] = useState('');
  const [meetingTypes, setMeetingTypes] = useState<CulteReportMeetingType[]>([]);
  const [speakers, setSpeakers] = useState<CulteReportSpeaker[]>([]);
  const [notes, setNotes] = useState('');
  const [needsNotes, setNeedsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<CulteReportFormValues>(blankFormValues());

  const [worshipReports, setWorshipReports] = useState<{ id: string; serviceDate: string; meetingTypeName: string | null; label: string }[]>([]);
  const [selectedWorshipReportId, setSelectedWorshipReportId] = useState('');
  const selectedWorshipReport = worshipReports.find((w) => w.id === selectedWorshipReportId) || null;

  useEffect(() => {
    MeetingTypeService.list().then(setMeetingTypes);
    if (reportType === 'worship') SpeakerService.list().then(setSpeakers);
  }, [reportType]);

  // Departements dependants : on rattache le rapport a celui du "culte du jour" deja soumis par
  // Gestion des Cultes -- pas besoin de ressaisir une date/type de rencontre, on les herite de lui.
  useEffect(() => {
    if (reportType === 'worship') {
      setWorshipReports([]);
      return;
    }
    CulteReportService.getRecentWorshipReports(20).then((reports) => {
      setWorshipReports(
        reports.map((r) => ({
          id: r.id,
          serviceDate: r.serviceDate,
          meetingTypeName: r.meetingTypeName,
          label: `${r.serviceDate} — ${r.meetingTypeName ? `${r.meetingTypeName} — ` : ''}${(r.data as WorshipReportData).messageTheme || 'Sans thème'}`,
        }))
      );
    });
  }, [reportType]);

  const handleFieldChange = <K extends keyof CulteReportFormValues>(key: K, value: CulteReportFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportType !== 'worship' && !selectedWorshipReportId) {
      toast.error('Sélectionnez le rapport de culte du jour auquel rattacher ce rapport');
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
        worshipReportId: reportType === 'worship' ? null : selectedWorshipReportId,
        serviceDate: reportType === 'worship' ? serviceDate : (selectedWorshipReport?.serviceDate || serviceDate),
        meetingTypeId: null,
        meetingTypeName: reportType === 'worship' ? (meetingTypeName || null) : (selectedWorshipReport?.meetingTypeName || null),
        submittedBy: user?.id || null,
        submittedByName: user?.fullName || 'Inconnu',
        data,
        notes: notes || undefined,
        needsNotes: needsNotes || undefined,
      });

      toast.success('Rapport enregistré avec succès');
      setValues(blankFormValues());
      setNotes(''); setNeedsNotes(''); setSelectedWorshipReportId('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting culte report:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
      {reportType === 'worship' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Type de rencontre</label>
            <select value={meetingTypeName} onChange={(e) => setMeetingTypeName(e.target.value)} className={inputCls}>
              <option value="">Sélectionner un type</option>
              {meetingTypes.map((mt) => (
                <option key={mt.id} value={mt.name}>{mt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date du culte</label>
            <input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

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

      {reportType !== 'worship' && (
        <div>
          <label className={labelCls}>Rapport de culte du jour (obligatoire)</label>
          <select required value={selectedWorshipReportId} onChange={(e) => setSelectedWorshipReportId(e.target.value)} className={inputCls}>
            <option value="">-- Sélectionner --</option>
            {worshipReports.map((w) => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
          {worshipReports.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Aucun rapport de culte trouvé — demandez au responsable "Gestion des cultes" de le soumettre d'abord.
            </p>
          )}
          {selectedWorshipReport && (
            <p className="mt-2 text-xs text-gray-500">
              Date : <span className="font-medium text-gray-700">{selectedWorshipReport.serviceDate}</span>
              {selectedWorshipReport.meetingTypeName && (
                <> · Type : <span className="font-medium text-gray-700">{selectedWorshipReport.meetingTypeName}</span></>
              )}
            </p>
          )}
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
