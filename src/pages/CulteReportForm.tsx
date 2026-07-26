import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CulteReportService } from '../services/culteReport.service';
import { CulteReportType, WorshipReportData, DEPARTMENT_NAME_BY_REPORT_TYPE } from '../types/culteReport.types';
import { CulteReportFields } from '../components/culteReports/CulteReportFields';
import { CulteReportFormValues, blankFormValues, buildCulteReportData } from '../utils/culteReportFormHelpers';

interface DeptInfo {
  id: string;
  name: string;
}

const DEPARTMENT_TO_REPORT_TYPE: Record<string, CulteReportType> = Object.fromEntries(
  (Object.entries(DEPARTMENT_NAME_BY_REPORT_TYPE) as [CulteReportType, string][]).map(([type, name]) => [name, type])
);

function normalizeDeptName(name: string): string {
  return name.toUpperCase().trim().replace(/\s+/g, ' ');
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function CulteReportForm() {
  const { user } = useAuth();
  const [department, setDepartment] = useState<DeptInfo | null>(null);
  const [loadingDept, setLoadingDept] = useState(true);
  const [serviceDate, setServiceDate] = useState(todayISO());
  const [meetingTypeName, setMeetingTypeName] = useState('');
  const [notes, setNotes] = useState('');
  const [needsNotes, setNeedsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<CulteReportFormValues>(blankFormValues());

  const [worshipReports, setWorshipReports] = useState<{ id: string; label: string }[]>([]);
  const [selectedWorshipReportId, setSelectedWorshipReportId] = useState('');

  const reportType = useMemo<CulteReportType | null>(() => {
    if (!department) return null;
    return DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(department.name)] || null;
  }, [department]);

  const handleFieldChange = <K extends keyof CulteReportFormValues>(key: K, value: CulteReportFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!user?.businessProfiles) {
      setLoadingDept(false);
      return;
    }
    const load = async () => {
      const profile = (user.businessProfiles as any[]).find(
        (p) => p.type === 'department_leader' && p.departmentId
      );
      if (!profile?.departmentId) {
        setLoadingDept(false);
        return;
      }
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .eq('church_id', getChurchId())
        .eq('id', profile.departmentId)
        .limit(1);
      if (data && data.length > 0) setDepartment({ id: data[0].id, name: data[0].name });
      setLoadingDept(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!reportType || reportType === 'worship') {
      setWorshipReports([]);
      return;
    }
    CulteReportService.getWorshipReportsForDay(serviceDate).then((reports) => {
      setWorshipReports(
        reports.map((r) => ({
          id: r.id,
          label: `${r.serviceDate} — ${(r.data as WorshipReportData).messageTheme || 'Sans thème'}`,
        }))
      );
    });
  }, [reportType, serviceDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !reportType) return;

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
        departmentId: department.id,
        departmentName: department.name,
        worshipReportId: reportType === 'worship' ? null : selectedWorshipReportId,
        serviceDate,
        meetingTypeId: null,
        meetingTypeName: meetingTypeName || null,
        submittedBy: user?.id || null,
        submittedByName: user?.fullName || 'Inconnu',
        data,
        notes: notes || undefined,
        needsNotes: needsNotes || undefined,
      });

      toast.success('Rapport enregistré avec succès');
      setValues(blankFormValues());
      setNotes(''); setNeedsNotes(''); setSelectedWorshipReportId('');
    } catch (error: any) {
      console.error('Error submitting culte report:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDept) {
    return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Chargement...</div>;
  }

  if (!department || !reportType) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
        Aucun département de responsable n'est associé à votre compte, ou ce département n'a pas
        encore de type de rapport de culte configuré. Contactez un administrateur.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-[#00665C]" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Rapport de culte — {department.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date du culte</label>
            <input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type de réunion</label>
            <input type="text" placeholder="ex: Culte du dimanche" value={meetingTypeName} onChange={(e) => setMeetingTypeName(e.target.value)} className={inputCls} />
          </div>
        </div>

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
                Aucun rapport de culte trouvé pour cette date — demandez au responsable "Gestion des cultes" de le soumettre d'abord.
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
        </button>
      </form>
    </div>
  );
}
