import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Megaphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurch } from '../../contexts/ChurchContext';
import { hasAnyRole } from '../../utils/roleHelpers';
import { loadInternReportTypes } from '../../services/internReports.service';
import { CULTE_REPORT_TYPE_LABELS, type CulteReportType } from '../../types/culteReport.types';

/** Raccourcis du stagiaire : enregistrer une âme évangélisée, faire le rapport de culte de son département. */
export default function InternShortcuts() {
  const { user, userRole } = useAuth();
  const { hasModule } = useChurch();
  const navigate = useNavigate();
  const isIntern = hasAnyRole({ role: userRole as string, businessProfiles: (user as any)?.businessProfiles }, ['intern']);
  const [reports, setReports] = useState<CulteReportType[]>([]);

  useEffect(() => {
    if (!isIntern || !user?.phone) return;
    let cancelled = false;
    loadInternReportTypes(user.phone)
      .then((types) => !cancelled && setReports(types))
      .catch((error) => console.error('Rapports du stagiaire :', error));
    return () => {
      cancelled = true;
    };
  }, [isIntern, user?.phone]);

  if (!isIntern) return null;

  const button = (key: string, onClick: () => void, icon: JSX.Element, title: string, subtitle: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-gray-50"
    >
      <span className="w-10 h-10 rounded-xl bg-[#00665C] flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-gray-900">{title}</span>
        <span className="block text-xs text-gray-500">{subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
    </button>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="intern-shortcuts">
      {hasModule('evangelization') &&
        button(
          'evangelized',
          () => navigate('/ames-evangelisees?add=1'),
          <Megaphone className="h-5 w-5 text-white" />,
          'Enregistrer une âme évangélisée',
          'Et retrouver les âmes que vous avez évangélisées',
        )}
      {reports.map((reportType) =>
        button(
          reportType,
          () => navigate(`/rapports/${reportType}?nouveau=1`),
          <FileText className="h-5 w-5 text-white" />,
          `Faire le rapport — ${CULTE_REPORT_TYPE_LABELS[reportType]}`,
          'Saisir le rapport du culte et voir les rapports déjà envoyés',
        ),
      )}
    </div>
  );
}
