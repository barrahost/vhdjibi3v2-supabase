import { useState, useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CulteReportType, DEPARTMENT_NAME_BY_REPORT_TYPE } from '../types/culteReport.types';
import CulteReportSubmitForm from '../components/culteReports/CulteReportSubmitForm';

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

export default function CulteReportForm() {
  const { user } = useAuth();
  const [department, setDepartment] = useState<DeptInfo | null>(null);
  const [loadingDept, setLoadingDept] = useState(true);

  const reportType = useMemo<CulteReportType | null>(() => {
    if (!department) return null;
    return DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(department.name)] || null;
  }, [department]);

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

      <CulteReportSubmitForm reportType={reportType} departmentId={department.id} departmentName={department.name} />
    </div>
  );
}
