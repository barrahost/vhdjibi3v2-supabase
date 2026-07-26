import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, Pencil, Trash2, Search } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { CulteReportService } from '../services/culteReport.service';
import EditCulteReportModal from '../components/culteReports/EditCulteReportModal';
import { CulteBreakdownChart, ChartBreakdown } from '../components/dashboard/stats/CulteBreakdownChart';
import {
  CulteReport,
  CulteReportType,
  CULTE_REPORT_TYPE_LABELS,
  DEPARTMENT_NAME_BY_REPORT_TYPE,
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  AcademieReportData,
} from '../types/culteReport.types';

const ITEMS_PER_PAGE = 10;
const RANGE_PRESETS = [
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function getBreakdowns(reportType: CulteReportType): ChartBreakdown[] {
  switch (reportType) {
    case 'worship':
      return [
        { key: 'total', label: 'Présence', extractValue: (r) => (r.data as WorshipReportData).totalParticipants || 0 },
        { key: 'adults', label: 'Adultes', extractValue: (r) => {
          const a = (r.data as WorshipReportData).attendance?.adults;
          return (a?.men || 0) + (a?.women || 0);
        } },
        { key: 'children', label: 'Enfants', extractValue: (r) => {
          const c = (r.data as WorshipReportData).attendance?.children;
          return (c?.boys || 0) + (c?.girls || 0);
        } },
        { key: 'men', label: 'Hommes', extractValue: (r) => (r.data as WorshipReportData).attendance?.adults?.men || 0 },
        { key: 'women', label: 'Femmes', extractValue: (r) => (r.data as WorshipReportData).attendance?.adults?.women || 0 },
      ];
    case 'adn':
      return [
        { key: 'visitors', label: 'Nouveaux visiteurs', extractValue: (r) => (r.data as AdnReportData).totalNewVisitors || 0 },
        { key: 'join', label: 'Veut rejoindre', extractValue: (r) => (r.data as AdnReportData).totalWantsToJoin || 0 },
      ];
    case 'finance':
      return [
        { key: 'total', label: 'Total', extractValue: (r) => (r.data as FinanceReportData).totalFinances || 0 },
        { key: 'tithes', label: 'Dîmes', extractValue: (r) => (r.data as FinanceReportData).tithes || 0 },
      ];
    case 'sainte_cene':
      return [
        { key: 'pains', label: 'Pains distribués', extractValue: (r) => (r.data as SainteCeneReportData).painsDistribuees || 0 },
        { key: 'vins', label: 'Vins distribués', extractValue: (r) => (r.data as SainteCeneReportData).vinsDistribuees || 0 },
      ];
    case 'academie':
      return [
        { key: 'present', label: 'Étudiants présents', extractValue: (r) => (r.data as AcademieReportData).presentStudents || 0 },
      ];
    case 'sono':
      return [{ key: 'count', label: 'Rapports soumis', extractValue: () => 1 }];
    default:
      return [];
  }
}

function extractRowMetric(report: CulteReport): { theme: string; total: number; extra: number } {
  switch (report.reportType) {
    case 'worship': {
      const d = report.data as WorshipReportData;
      return { theme: d.messageTheme || '-', total: d.totalParticipants || 0, extra: d.totalNewMembers || 0 };
    }
    case 'adn': {
      const d = report.data as AdnReportData;
      return { theme: '-', total: d.totalNewVisitors || 0, extra: d.totalWantsToJoin || 0 };
    }
    case 'finance': {
      const d = report.data as FinanceReportData;
      return { theme: '-', total: d.totalFinances || 0, extra: d.tithes || 0 };
    }
    case 'sainte_cene': {
      const d = report.data as SainteCeneReportData;
      return { theme: '-', total: d.painsDistribuees || 0, extra: d.vinsDistribuees || 0 };
    }
    case 'academie': {
      const d = report.data as AcademieReportData;
      return { theme: d.className || '-', total: d.presentStudents || 0, extra: d.actualStudents || 0 };
    }
    default:
      return { theme: '-', total: 0, extra: 0 };
  }
}

export default function CulteReportDepartmentView() {
  const { reportType } = useParams<{ reportType: string }>();
  const type = reportType as CulteReportType;
  const departmentName = DEPARTMENT_NAME_BY_REPORT_TYPE[type];

  const { confirm, confirmModalProps } = useConfirmModal();
  const [reports, setReports] = useState<CulteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [range, setRange] = useState({ startDate: daysAgo(90), endDate: today() });
  const [editingReport, setEditingReport] = useState<CulteReport | null>(null);

  const loadReports = useCallback(async () => {
    if (!departmentName) return;
    setLoading(true);
    try {
      const data = await CulteReportService.getHistory({ reportType: type, startDate: range.startDate, endDate: range.endDate });
      setReports(data);
    } catch (error) {
      console.error('Error loading department reports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  }, [type, departmentName, range]);

  useEffect(() => { loadReports(); }, [loadReports]);

  if (!departmentName) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">Type de rapport inconnu.</div>;
  }

  const handleDelete = async (report: CulteReport) => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await CulteReportService.deleteReport(report.id);
        toast.success('Rapport supprimé');
        loadReports();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filtered = reports.filter((r) => {
    const { theme } = extractRowMetric(r);
    return (
      r.submittedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalCount = reports.length;
  const avgTotal = totalCount > 0 ? Math.round(reports.reduce((s, r) => s + extractRowMetric(r).total, 0) / totalCount) : 0;
  const avgExtra = totalCount > 0 ? Math.round(reports.reduce((s, r) => s + extractRowMetric(r).extra, 0) / totalCount) : 0;
  const lastReportDate = reports.length > 0 ? reports[0].serviceDate : null;

  const columns = [
    { key: 'serviceDate', title: 'Date', render: (v: string) => v },
    { key: 'theme', title: 'Thème', render: (_: any, row: CulteReport) => extractRowMetric(row).theme },
    { key: 'total', title: 'Total', render: (_: any, row: CulteReport) => extractRowMetric(row).total },
    { key: 'submittedByName', title: 'Soumis par', render: (v: string) => v },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: CulteReport) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditingReport(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Eye className="w-6 h-6 text-[#00665C]" /> {CULTE_REPORT_TYPE_LABELS[type]}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total rapports</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{avgTotal}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Moyenne (principal)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{avgExtra}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Moyenne (secondaire)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-lg font-bold text-gray-900">{lastReportDate || '-'}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Dernier rapport</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 h-9 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setRange({ startDate: daysAgo(preset.days), endDate: today() })}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              {preset.label}
            </button>
          ))}
          <input type="date" value={range.startDate} onChange={(e) => setRange((p) => ({ ...p, startDate: e.target.value }))} className="h-9 px-2 text-sm border border-gray-200 rounded-xl" />
          <input type="date" value={range.endDate} onChange={(e) => setRange((p) => ({ ...p, endDate: e.target.value }))} className="h-9 px-2 text-sm border border-gray-200 rounded-xl" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      ) : (
        <>
          <CulteBreakdownChart title={`Évolution — ${CULTE_REPORT_TYPE_LABELS[type]}`} reports={reports} breakdowns={getBreakdowns(type)} />

          <CustomTable data={paginated} columns={columns} />

          {totalPages > 1 && (
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </>
      )}

      {editingReport && (
        <EditCulteReportModal
          report={editingReport}
          isOpen={!!editingReport}
          onClose={() => setEditingReport(null)}
          onSuccess={() => { setEditingReport(null); loadReports(); }}
        />
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
