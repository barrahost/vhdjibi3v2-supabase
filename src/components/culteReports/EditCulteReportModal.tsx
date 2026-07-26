import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { CulteReport, CulteReportSpeaker, CULTE_REPORT_TYPE_LABELS } from '../../types/culteReport.types';
import { CulteReportFields } from './CulteReportFields';
import { CulteReportFormValues, valuesFromExistingData, buildCulteReportData } from '../../utils/culteReportFormHelpers';
import { CulteReportService } from '../../services/culteReport.service';
import { SpeakerService } from '../../services/meetingTypeSpeaker.service';

interface EditCulteReportModalProps {
  report: CulteReport;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function EditCulteReportModal({ report, isOpen, onClose, onSuccess }: EditCulteReportModalProps) {
  const [serviceDate, setServiceDate] = useState(report.serviceDate);
  const [notes, setNotes] = useState(report.notes || '');
  const [values, setValues] = useState<CulteReportFormValues>(() => valuesFromExistingData(report.reportType, report.data));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speakers, setSpeakers] = useState<CulteReportSpeaker[]>([]);

  useEffect(() => {
    if (report.reportType === 'worship') SpeakerService.list().then(setSpeakers);
  }, [report.reportType]);

  const handleFieldChange = <K extends keyof CulteReportFormValues>(key: K, value: CulteReportFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = buildCulteReportData(report.reportType, values);
      if (!data) throw new Error('Type de rapport inconnu');

      await CulteReportService.updateReport(report.id, { data, notes: notes || undefined, serviceDate });

      toast.success('Rapport modifié avec succès');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating culte report:', error);
      toast.error(error.message || 'Erreur lors de la modification du rapport');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modifier — ${CULTE_REPORT_TYPE_LABELS[report.reportType]}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
        <div>
          <label className={labelCls}>Date du culte</label>
          <input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={inputCls} />
        </div>

        {report.reportType === 'worship' && (
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

        <CulteReportFields reportType={report.reportType} values={values} onChange={handleFieldChange} />

        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
