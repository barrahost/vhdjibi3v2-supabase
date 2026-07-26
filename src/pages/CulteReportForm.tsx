import { useState, useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CulteReportType, DEPARTMENT_NAME_BY_REPORT_TYPE } from '../types/culteReport.types';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import CulteReportSubmitForm from '../components/culteReports/CulteReportSubmitForm';

interface DeptInfo {
  id: string;
  name: string;
  reportType: CulteReportType;
}

const DEPARTMENT_TO_REPORT_TYPE: Record<string, CulteReportType> = Object.fromEntries(
  (Object.entries(DEPARTMENT_NAME_BY_REPORT_TYPE) as [CulteReportType, string][]).map(([type, name]) => [name, type])
);

function normalizeDeptName(name: string): string {
  return name.toUpperCase().trim().replace(/\s+/g, ' ');
}

export default function CulteReportForm() {
  const { user } = useAuth();
  const [ledDepartments, setLedDepartments] = useState<DeptInfo[]>([]);
  const [loadingDept, setLoadingDept] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.businessProfiles) {
      setLoadingDept(false);
      return;
    }
    const load = async () => {
      const profile = (user.businessProfiles as any[]).find((p) => p.type === 'department_leader');
      const departmentIds = getProfileDepartmentIds(profile);
      if (departmentIds.length === 0) {
        setLoadingDept(false);
        return;
      }
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .eq('church_id', getChurchId())
        .in('id', departmentIds);

      const withReportType = (data || [])
        .map((d: { id: string; name: string }) => {
          const reportType = DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(d.name)];
          return reportType ? { id: d.id, name: d.name, reportType } : null;
        })
        .filter((d: DeptInfo | null): d is DeptInfo => d !== null);

      setLedDepartments(withReportType);
      if (withReportType.length === 1) setSelectedDeptId(withReportType[0].id);
      setLoadingDept(false);
    };
    load();
  }, [user]);

  const selectedDept = useMemo(
    () => ledDepartments.find((d) => d.id === selectedDeptId) || null,
    [ledDepartments, selectedDeptId]
  );

  if (loadingDept) {
    return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Chargement...</div>;
  }

  if (ledDepartments.length === 0) {
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
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
          Rapport de culte{selectedDept ? ` — ${selectedDept.name}` : ''}
        </h1>
      </div>

      {ledDepartments.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pour quel département soumettez-vous ce rapport ?
          </label>
          <div className="flex flex-wrap gap-2">
            {ledDepartments.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDeptId(d.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedDeptId === d.id ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDept && (
        <CulteReportSubmitForm
          reportType={selectedDept.reportType}
          departmentId={selectedDept.id}
          departmentName={selectedDept.name}
        />
      )}
    </div>
  );
}
