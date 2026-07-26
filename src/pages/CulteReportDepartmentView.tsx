import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, Pencil, Trash2, Search, Plus, X, BarChart3, TrendingUp, UserPlus, CalendarDays,
  Coins, GraduationCap, Wine, Radio, Sparkles, Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { CulteReportService } from '../services/culteReport.service';
import { MeetingTypeService } from '../services/meetingTypeSpeaker.service';
import EditCulteReportModal from '../components/culteReports/EditCulteReportModal';
import CulteReportPreviewModal from '../components/culteReports/CulteReportPreviewModal';
import CulteReportSubmitForm from '../components/culteReports/CulteReportSubmitForm';
import { exportCulteReportPdf } from '../utils/culteReportPdf';
import { CulteBreakdownChart, ChartBreakdown } from '../components/dashboard/stats/CulteBreakdownChart';
import {
  CulteReport,
  CulteReportType,
  CulteReportMeetingType,
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

function avg(values: number[]): number {
  return values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

interface StatCardConfig {
  label: string;
  icon: LucideIcon;
  color: 'teal' | 'green' | 'blue' | 'amber';
  compute: (reports: CulteReport[]) => string | number;
}

interface SummaryMetricConfig {
  label: string;
  compute: (reports: CulteReport[]) => number;
}

interface ColumnConfig {
  key: string;
  title: string;
  render: (report: CulteReport) => React.ReactNode;
}

interface DeptViewConfig {
  icon: LucideIcon;
  subtitle: string;
  statCards: StatCardConfig[];
  summaryMetrics: SummaryMetricConfig[];
  columns: ColumnConfig[];
  breakdowns: ChartBreakdown[];
  searchFields: (r: CulteReport) => string[];
}

const STAT_COLOR_CLASSES: Record<StatCardConfig['color'], { border: string; icon: string; value: string }> = {
  teal: { border: 'border-[#00665C]', icon: 'text-[#00665C]', value: 'text-[#00665C]' },
  green: { border: 'border-green-500', icon: 'text-green-500', value: 'text-green-600' },
  blue: { border: 'border-blue-400', icon: 'text-blue-400', value: 'text-blue-600' },
  amber: { border: 'border-amber-400', icon: 'text-amber-400', value: 'text-gray-900' },
};

function lastReportDate(reports: CulteReport[]): string {
  return reports.length > 0 ? reports[0].serviceDate : '-';
}

function defaultSearchFields(r: CulteReport): string[] {
  return [r.serviceDate, r.notes || '', r.submittedByName];
}

function actionsColumn(onView: (r: CulteReport) => void, onEdit: (r: CulteReport) => void, onDelete: (r: CulteReport) => void, onDownloadPdf: (r: CulteReport) => void): ColumnConfig {
  return {
    key: 'actions',
    title: 'Actions',
    render: (row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => onView(row)} className="p-1 text-[#00665C] hover:bg-[#00665C]/10 rounded" title="Voir">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDownloadPdf(row)} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Télécharger en PDF">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(row)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  };
}

function getConfig(reportType: CulteReportType): Omit<DeptViewConfig, 'columns'> {
  switch (reportType) {
    case 'worship':
      return {
        icon: Sparkles,
        subtitle: 'Gérez les rapports de présence et informations générales des cultes',
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Participation moy.', icon: TrendingUp, color: 'green', compute: (r) => avg(r.map((x) => (x.data as WorshipReportData).totalParticipants || 0)) },
          { label: 'Nvx membres moy.', icon: UserPlus, color: 'blue', compute: (r) => avg(r.map((x) => (x.data as WorshipReportData).totalNewMembers || 0)) },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDate },
        ],
        summaryMetrics: [
          { label: 'Total participants', compute: (r) => r.reduce((s, x) => s + ((x.data as WorshipReportData).totalParticipants || 0), 0) },
          { label: 'Total conversions', compute: (r) => r.reduce((s, x) => {
            const c = (x.data as WorshipReportData).attendance?.conversions;
            return s + (c?.men || 0) + (c?.women || 0);
          }, 0) },
          { label: 'Nouveaux membres', compute: (r) => r.reduce((s, x) => s + ((x.data as WorshipReportData).totalNewMembers || 0), 0) },
        ],
        breakdowns: [
          {
            key: 'presence', label: 'Présence',
            series: [
              { key: 'total', label: 'Total', color: '#00665C', type: 'line', extractValue: (r) => (r.data as WorshipReportData).totalParticipants || 0 },
              { key: 'adults', label: 'Adultes', color: '#3b82f6', type: 'line', extractValue: (r) => {
                const a = (r.data as WorshipReportData).attendance?.adults;
                return (a?.men || 0) + (a?.women || 0);
              } },
              { key: 'children', label: 'Enfants', color: '#F59E0B', type: 'line', extractValue: (r) => {
                const c = (r.data as WorshipReportData).attendance?.children;
                return (c?.boys || 0) + (c?.girls || 0);
              } },
            ],
          },
          {
            key: 'conversions', label: 'Conversions',
            series: [
              { key: 'conversions', label: 'Conversions', color: '#3b82f6', type: 'bar', extractValue: (r) => {
                const c = (r.data as WorshipReportData).attendance?.conversions;
                return (c?.men || 0) + (c?.women || 0);
              } },
              { key: 'newMembers', label: 'Nouveaux membres', color: '#a855f7', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).totalNewMembers || 0 },
            ],
          },
          {
            key: 'gender', label: 'H / F',
            series: [
              { key: 'men', label: 'Hommes', color: '#3b82f6', type: 'bar', stackId: 'hf', extractValue: (r) => {
                const a = (r.data as WorshipReportData).attendance;
                return (a?.adults?.men || 0) + (a?.children?.boys || 0);
              } },
              { key: 'women', label: 'Femmes', color: '#ec4899', type: 'bar', stackId: 'hf', extractValue: (r) => {
                const a = (r.data as WorshipReportData).attendance;
                return (a?.adults?.women || 0) + (a?.children?.girls || 0);
              } },
            ],
          },
        ],
        searchFields: (r) => [
          r.serviceDate,
          (r.data as WorshipReportData).messageTheme || '',
          (r.data as WorshipReportData).speakerName || '',
          r.submittedByName,
        ],
      };
    case 'finance':
      return {
        icon: Coins,
        subtitle: 'Gérez les rapports financiers des cultes',
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Moy. collectée', icon: TrendingUp, color: 'green', compute: (r) => avg(r.map((x) => (x.data as FinanceReportData).totalFinances || 0)) },
          { label: 'Moy. dîmes', icon: UserPlus, color: 'blue', compute: (r) => avg(r.map((x) => (x.data as FinanceReportData).tithes || 0)) },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDate },
        ],
        summaryMetrics: [
          { label: 'Total collecté', compute: (r) => r.reduce((s, x) => s + ((x.data as FinanceReportData).totalFinances || 0), 0) },
          { label: 'Total dîmes', compute: (r) => r.reduce((s, x) => s + ((x.data as FinanceReportData).tithes || 0), 0) },
          { label: 'Total offrandes', compute: (r) => r.reduce((s, x) => s + ((x.data as FinanceReportData).regularOfferings || 0) + ((x.data as FinanceReportData).specialOfferings || 0), 0) },
        ],
        breakdowns: [
          {
            key: 'finances', label: 'Finances',
            series: [
              { key: 'total', label: 'Total', color: '#00665C', type: 'line', extractValue: (r) => (r.data as FinanceReportData).totalFinances || 0 },
              { key: 'tithes', label: 'Dîmes', color: '#F2B636', type: 'line', extractValue: (r) => (r.data as FinanceReportData).tithes || 0 },
            ],
          },
        ],
        searchFields: defaultSearchFields,
      };
    case 'adn':
      return {
        icon: UserPlus,
        subtitle: 'Gérez les rapports de suivi des nouveaux visiteurs',
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Moy. visiteurs', icon: TrendingUp, color: 'green', compute: (r) => avg(r.map((x) => (x.data as AdnReportData).totalNewVisitors || 0)) },
          { label: 'Moy. veut rejoindre', icon: UserPlus, color: 'blue', compute: (r) => avg(r.map((x) => (x.data as AdnReportData).totalWantsToJoin || 0)) },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDate },
        ],
        summaryMetrics: [
          { label: 'Total visiteurs', compute: (r) => r.reduce((s, x) => s + ((x.data as AdnReportData).totalNewVisitors || 0), 0) },
          { label: 'Total veut rejoindre', compute: (r) => r.reduce((s, x) => s + ((x.data as AdnReportData).totalWantsToJoin || 0), 0) },
          { label: 'Total indécis', compute: (r) => r.reduce((s, x) => s + ((x.data as AdnReportData).visitorDecisions?.undecided || 0), 0) },
        ],
        breakdowns: [
          {
            key: 'visitors', label: 'Nouveaux visiteurs et décisions',
            series: [
              { key: 'visitors', label: 'Nouveaux visiteurs', color: '#00665C', type: 'line', extractValue: (r) => (r.data as AdnReportData).totalNewVisitors || 0 },
              { key: 'join', label: 'Veut rejoindre', color: '#F2B636', type: 'line', extractValue: (r) => (r.data as AdnReportData).totalWantsToJoin || 0 },
            ],
          },
        ],
        searchFields: defaultSearchFields,
      };
    case 'sainte_cene':
      return {
        icon: Wine,
        subtitle: 'Gérez les rapports de la Sainte Cène',
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Moy. pains distribués', icon: TrendingUp, color: 'green', compute: (r) => avg(r.map((x) => (x.data as SainteCeneReportData).painsDistribuees || 0)) },
          { label: 'Moy. vins distribués', icon: UserPlus, color: 'blue', compute: (r) => avg(r.map((x) => (x.data as SainteCeneReportData).vinsDistribuees || 0)) },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDate },
        ],
        summaryMetrics: [
          { label: 'Total pains distribués', compute: (r) => r.reduce((s, x) => s + ((x.data as SainteCeneReportData).painsDistribuees || 0), 0) },
          { label: 'Total vins distribués', compute: (r) => r.reduce((s, x) => s + ((x.data as SainteCeneReportData).vinsDistribuees || 0), 0) },
          { label: 'Célébrations', compute: (r) => r.length },
        ],
        breakdowns: [
          {
            key: 'distribution', label: 'Distribution',
            series: [
              { key: 'pains', label: 'Pains distribués', color: '#00665C', type: 'bar', extractValue: (r) => (r.data as SainteCeneReportData).painsDistribuees || 0 },
              { key: 'vins', label: 'Vins distribués', color: '#F2B636', type: 'bar', extractValue: (r) => (r.data as SainteCeneReportData).vinsDistribuees || 0 },
            ],
          },
        ],
        searchFields: defaultSearchFields,
      };
    case 'academie':
      return {
        icon: GraduationCap,
        subtitle: "Gérez les rapports de l'Académie d'Honneur",
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Moy. présents', icon: TrendingUp, color: 'green', compute: (r) => avg(r.map((x) => (x.data as AcademieReportData).presentStudents || 0)) },
          { label: 'Moy. inscrits', icon: UserPlus, color: 'blue', compute: (r) => avg(r.map((x) => (x.data as AcademieReportData).actualStudents || 0)) },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDate },
        ],
        summaryMetrics: [
          { label: 'Total présents', compute: (r) => r.reduce((s, x) => s + ((x.data as AcademieReportData).presentStudents || 0), 0) },
          { label: 'Total inscrits', compute: (r) => r.reduce((s, x) => s + ((x.data as AcademieReportData).actualStudents || 0), 0) },
          { label: 'Cours dispensés', compute: (r) => r.length },
        ],
        breakdowns: [
          {
            key: 'presence', label: 'Présence',
            series: [{ key: 'present', label: 'Étudiants présents', color: '#00665C', type: 'line', extractValue: (r) => (r.data as AcademieReportData).presentStudents || 0 }],
          },
        ],
        searchFields: defaultSearchFields,
      };
    case 'sono':
      return {
        icon: Radio,
        subtitle: 'Gérez les rapports de sonorisation et communication',
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDate },
          { label: '', icon: BarChart3, color: 'teal', compute: () => '' },
          { label: '', icon: BarChart3, color: 'teal', compute: () => '' },
        ],
        summaryMetrics: [{ label: 'Rapports soumis', compute: (r) => r.length }],
        breakdowns: [
          {
            key: 'reports', label: 'Rapports soumis',
            series: [{ key: 'count', label: 'Rapports soumis', color: '#00665C', type: 'bar', extractValue: () => 1 }],
          },
        ],
        searchFields: defaultSearchFields,
      };
    default:
      return { icon: BarChart3, subtitle: '', statCards: [], summaryMetrics: [], breakdowns: [], searchFields: defaultSearchFields };
  }
}

function getColumns(
  reportType: CulteReportType,
  onView: (r: CulteReport) => void,
  onEdit: (r: CulteReport) => void,
  onDelete: (r: CulteReport) => void,
  onDownloadPdf: (r: CulteReport) => void
): ColumnConfig[] {
  const base: ColumnConfig[] = [{ key: 'serviceDate', title: 'Date', render: (r) => r.serviceDate }];

  switch (reportType) {
    case 'worship':
      return [
        ...base,
        { key: 'theme', title: 'Thème', render: (r) => (r.data as WorshipReportData).messageTheme || '-' },
        { key: 'speaker', title: 'Orateur', render: (r) => (r.data as WorshipReportData).speakerName || '-' },
        { key: 'total', title: 'Total', render: (r) => (r.data as WorshipReportData).totalParticipants || 0 },
        { key: 'new', title: 'Nouveaux', render: (r) => (r.data as WorshipReportData).totalNewMembers || 0 },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'finance':
      return [
        ...base,
        { key: 'total', title: 'Total', render: (r) => (r.data as FinanceReportData).totalFinances || 0 },
        { key: 'tithes', title: 'Dîmes', render: (r) => (r.data as FinanceReportData).tithes || 0 },
        { key: 'submittedByName', title: 'Soumis par', render: (r) => r.submittedByName },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'adn':
      return [
        ...base,
        { key: 'visitors', title: 'Nouveaux visiteurs', render: (r) => (r.data as AdnReportData).totalNewVisitors || 0 },
        { key: 'join', title: 'Veut rejoindre', render: (r) => (r.data as AdnReportData).totalWantsToJoin || 0 },
        { key: 'submittedByName', title: 'Soumis par', render: (r) => r.submittedByName },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'sainte_cene':
      return [
        ...base,
        { key: 'pains', title: 'Pains distribués', render: (r) => (r.data as SainteCeneReportData).painsDistribuees || 0 },
        { key: 'vins', title: 'Vins distribués', render: (r) => (r.data as SainteCeneReportData).vinsDistribuees || 0 },
        { key: 'submittedByName', title: 'Soumis par', render: (r) => r.submittedByName },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'academie':
      return [
        ...base,
        { key: 'className', title: 'Classe', render: (r) => (r.data as AcademieReportData).className || '-' },
        { key: 'present', title: 'Présents', render: (r) => (r.data as AcademieReportData).presentStudents || 0 },
        { key: 'submittedByName', title: 'Soumis par', render: (r) => r.submittedByName },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    default:
      return [
        ...base,
        { key: 'submittedByName', title: 'Soumis par', render: (r) => r.submittedByName },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
  }
}

export default function CulteReportDepartmentView() {
  const { reportType } = useParams<{ reportType: string }>();
  const type = reportType as CulteReportType;
  const departmentName = DEPARTMENT_NAME_BY_REPORT_TYPE[type];

  const { confirm, confirmModalProps } = useConfirmModal();
  const [reports, setReports] = useState<CulteReport[]>([]);
  const [allReports, setAllReports] = useState<CulteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRange, setFilterRange] = useState({ startDate: '', endDate: '' });
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('');
  const [meetingTypes, setMeetingTypes] = useState<CulteReportMeetingType[]>([]);
  const [chartRange, setChartRange] = useState({ startDate: daysAgo(90), endDate: today() });
  const [chartReports, setChartReports] = useState<CulteReport[]>([]);
  const [editingReport, setEditingReport] = useState<CulteReport | null>(null);
  const [viewingReport, setViewingReport] = useState<CulteReport | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { MeetingTypeService.list().then(setMeetingTypes); }, []);

  useEffect(() => {
    if (!departmentName) return;
    supabase
      .from('departments')
      .select('id, name')
      .eq('church_id', getChurchId())
      .then((res: { data: { id: string; name: string }[] | null }) => {
        const data = res.data;
        const normalized = departmentName.toUpperCase().trim().replace(/\s+/g, ' ');
        const match = (data ?? []).find((d: any) => d.name.toUpperCase().trim().replace(/\s+/g, ' ') === normalized);
        setDepartmentId(match?.id || null);
      });
  }, [departmentName]);

  const loadReports = useCallback(async () => {
    if (!departmentName) return;
    setLoading(true);
    try {
      const data = await CulteReportService.getHistory({
        reportType: type,
        startDate: filterRange.startDate || undefined,
        endDate: filterRange.endDate || undefined,
        meetingTypeName: meetingTypeFilter || undefined,
      });
      setReports(data);
    } catch (error) {
      console.error('Error loading department reports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  }, [type, departmentName, filterRange, meetingTypeFilter]);

  const loadChartReports = useCallback(async () => {
    if (!departmentName) return;
    try {
      const data = await CulteReportService.getHistory({ reportType: type, startDate: chartRange.startDate, endDate: chartRange.endDate });
      setChartReports(data);
    } catch (error) {
      console.error('Error loading chart reports:', error);
    }
  }, [type, departmentName, chartRange]);

  const loadAllReports = useCallback(async () => {
    if (!departmentName) return;
    try {
      const data = await CulteReportService.getHistory({ reportType: type });
      setAllReports(data);
    } catch (error) {
      console.error('Error loading all department reports:', error);
    }
  }, [type, departmentName]);

  useEffect(() => { loadReports(); }, [loadReports]);
  useEffect(() => { loadChartReports(); }, [loadChartReports]);
  useEffect(() => { loadAllReports(); }, [loadAllReports]);

  if (!departmentName) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">Type de rapport inconnu.</div>;
  }

  const handleDelete = async (report: CulteReport) => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await CulteReportService.deleteReport(report.id);
        toast.success('Rapport supprimé');
        loadReports();
        loadChartReports();
        loadAllReports();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const config = getConfig(type);
  const columns = getColumns(type, setViewingReport, setEditingReport, handleDelete, exportCulteReportPdf);

  const filtered = reports.filter((r) =>
    !searchTerm || config.searchFields(r).some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const Icon = config.icon;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon className="w-6 h-6 text-[#00665C]" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{CULTE_REPORT_TYPE_LABELS[type]}</h1>
            <p className="text-sm text-gray-500">{config.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Fermer le formulaire' : 'Nouveau rapport'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {config.statCards.map((sc, i) => {
          const colors = STAT_COLOR_CLASSES[sc.color];
          return (
            <div key={i} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${colors.border}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sc.label}</h3>
                <sc.icon className={`h-4 w-4 ${colors.icon} opacity-70`} />
              </div>
              <p className={`text-2xl font-bold ${colors.value}`}>{sc.compute(allReports.length > 0 ? allReports : reports)}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
          <Search className="absolute left-3 top-1/2 translate-y-1 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par thème, source, prédicateur..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 h-9 text-sm border border-gray-200 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
          <input type="date" value={filterRange.startDate} onChange={(e) => setFilterRange((p) => ({ ...p, startDate: e.target.value }))} className="h-9 px-2 text-sm border border-gray-200 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
          <input type="date" value={filterRange.endDate} onChange={(e) => setFilterRange((p) => ({ ...p, endDate: e.target.value }))} className="h-9 px-2 text-sm border border-gray-200 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type de rencontre</label>
          <select
            value={meetingTypeFilter}
            onChange={(e) => setMeetingTypeFilter(e.target.value)}
            className="h-9 px-2 text-sm border border-gray-200 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Sélectionner un type</option>
            {meetingTypes.map((mt) => (
              <option key={mt.id} value={mt.name}>{mt.name}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-400 sm:ml-auto">{paginated.length} / {filtered.length}</span>
      </div>

      {showForm && (
        <CulteReportSubmitForm
          reportType={type}
          departmentId={departmentId}
          departmentName={departmentName}
          onCancel={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); loadReports(); loadChartReports(); loadAllReports(); }}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#00665C]" /> Évolution — {CULTE_REPORT_TYPE_LABELS[type]}
        </h2>

        {config.summaryMetrics.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-${config.summaryMetrics.length} gap-3`}>
            {config.summaryMetrics.map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{m.compute(chartReports)}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex gap-1 flex-wrap">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setChartRange({ startDate: daysAgo(preset.days), endDate: today() })}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setChartRange({ startDate: '2020-01-01', endDate: today() })}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Tout
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={chartRange.startDate} onChange={(e) => setChartRange((p) => ({ ...p, startDate: e.target.value }))} className="h-9 px-2 text-sm border border-gray-200 rounded-md" />
            <input type="date" value={chartRange.endDate} onChange={(e) => setChartRange((p) => ({ ...p, endDate: e.target.value }))} className="h-9 px-2 text-sm border border-gray-200 rounded-md" />
          </div>
        </div>

        <CulteBreakdownChart reports={chartReports} breakdowns={config.breakdowns} />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      ) : (
        <>
          <CustomTable data={paginated} columns={columns.map((c) => ({ key: c.key, title: c.title, render: (_: any, row: CulteReport) => c.render(row) }))} />

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
          isOpen={true}
          onClose={() => setEditingReport(null)}
          onSuccess={() => { setEditingReport(null); loadReports(); loadChartReports(); loadAllReports(); }}
        />
      )}
      {viewingReport && (
        <CulteReportPreviewModal
          report={viewingReport}
          isOpen={true}
          onClose={() => setViewingReport(null)}
        />
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
