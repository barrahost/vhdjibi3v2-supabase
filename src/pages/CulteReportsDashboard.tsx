import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, LayoutGrid, Users, UserPlus, Coins, TrendingUp, Download, HandHelping,
  ArrowRight, CalendarDays, Link2, Eye, CheckCircle2, Music2, BookOpen, Radio, Wheat,
} from 'lucide-react';
import { CulteBreakdownChart, ChartBreakdown } from '../components/dashboard/stats/CulteBreakdownChart';
import { CulteReportService, DashboardStats, ConsolidatedDepartment, ConsolidatedGlobalStats } from '../services/culteReport.service';
import { MeetingTypeService } from '../services/meetingTypeSpeaker.service';
import {
  CulteReport,
  CulteNeed,
  CulteReportMeetingType,
  CulteReportType,
  WorshipReportData,
  CULTE_REPORT_TYPE_COLORS,
} from '../types/culteReport.types';
import { exportCulteReports } from '../utils/export/culteReportExport';

type TabKey = 'general' | 'consolidated';

const GENERAL_RANGE_PRESETS = [
  { label: '7 j', days: 7 },
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
];

const BREAKDOWNS: ChartBreakdown[] = [
  {
    key: 'general', label: 'Évolution générale',
    series: [
      { key: 'total', label: 'Total participants', color: '#00665C', type: 'line', extractValue: (r) => (r.data as WorshipReportData).totalParticipants || 0 },
    ],
  },
  {
    key: 'adults', label: 'Évolution des Adultes',
    series: [
      { key: 'men', label: 'Hommes', color: '#00665C', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).attendance?.adults?.men || 0 },
      { key: 'women', label: 'Femmes', color: '#F2B636', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).attendance?.adults?.women || 0 },
      { key: 'total', label: 'Total', color: '#b12029', type: 'line', extractValue: (r) => {
        const a = (r.data as WorshipReportData).attendance?.adults;
        return (a?.men || 0) + (a?.women || 0);
      } },
    ],
  },
  {
    key: 'served', label: 'Évolution des Boss',
    series: [
      { key: 'men', label: 'Hommes', color: '#00665C', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).attendance?.served?.men || 0 },
      { key: 'women', label: 'Femmes', color: '#F2B636', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).attendance?.served?.women || 0 },
      { key: 'total', label: 'Total', color: '#b12029', type: 'line', extractValue: (r) => {
        const a = r.data as WorshipReportData;
        return (a.attendance?.served?.men || 0) + (a.attendance?.served?.women || 0) + (a.attendance?.blooms || 0);
      } },
    ],
  },
  {
    key: 'children', label: 'Évolution des Enfants',
    series: [
      { key: 'boys', label: 'Garçons', color: '#00665C', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).attendance?.children?.boys || 0 },
      { key: 'girls', label: 'Filles', color: '#F2B636', type: 'bar', extractValue: (r) => (r.data as WorshipReportData).attendance?.children?.girls || 0 },
      { key: 'total', label: 'Total', color: '#b12029', type: 'line', extractValue: (r) => {
        const c = (r.data as WorshipReportData).attendance?.children;
        return (c?.boys || 0) + (c?.girls || 0);
      } },
    ],
  },
  {
    key: 'men', label: 'Évolution des Hommes',
    series: [{ key: 'total', label: 'Total', color: '#b12029', type: 'line', extractValue: (r) => {
      const a = r.data as WorshipReportData;
      return (a.attendance?.adults?.men || 0) + (a.attendance?.served?.men || 0);
    } }],
  },
  {
    key: 'women', label: 'Évolution des Femmes',
    series: [{ key: 'total', label: 'Total', color: '#b12029', type: 'line', extractValue: (r) => {
      const a = r.data as WorshipReportData;
      return (a.attendance?.adults?.women || 0) + (a.attendance?.served?.women || 0);
    } }],
  },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function lastMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

const DEPT_ICONS: Record<CulteReportType, React.ElementType> = {
  worship: Music2,
  finance: Coins,
  adn: Users,
  academie: BookOpen,
  sono: Radio,
  sainte_cene: Wheat,
};

interface StatMiniCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  borderColor: string;
}

function StatMiniCard({ title, value, icon: Icon, trend, borderColor }: StatMiniCardProps) {
  return (
    <div
      className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md"
      style={{ borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: borderColor }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-base md:text-lg lg:text-2xl font-bold text-gray-900 break-words">{value}</p>
          {trend !== undefined && (
            <p className={`text-[10px] sm:text-xs md:text-sm flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div className="text-[#00665C] flex-shrink-0"><Icon className="h-5 w-5 md:h-6 md:w-6" /></div>
      </div>
    </div>
  );
}

export default function CulteReportsDashboard() {
  const [tab, setTab] = useState<TabKey>('general');

  const [generalRange, setGeneralRange] = useState({ startDate: daysAgo(30), endDate: today() });
  const [consolidatedRange, setConsolidatedRange] = useState({ startDate: lastMonth(), endDate: today() });
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('');
  const [meetingTypes, setMeetingTypes] = useState<CulteReportMeetingType[]>([]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartReports, setChartReports] = useState<CulteReport[]>([]);
  const [loadingGeneral, setLoadingGeneral] = useState(true);

  const [consolidated, setConsolidated] = useState<ConsolidatedDepartment[]>([]);
  const [globalStats, setGlobalStats] = useState<ConsolidatedGlobalStats>({ avgAttendance: 0, totalVisitors: 0, totalFinances: 0 });
  const [needs, setNeeds] = useState<CulteNeed[]>([]);
  const [loadingConsolidated, setLoadingConsolidated] = useState(true);

  useEffect(() => { MeetingTypeService.list().then(setMeetingTypes); }, []);

  const loadGeneral = useCallback(async () => {
    setLoadingGeneral(true);
    try {
      const [dashboardStats, chartData] = await Promise.all([
        CulteReportService.getDashboardSnapshotStats(),
        CulteReportService.getHistory({
          reportType: 'worship',
          startDate: generalRange.startDate,
          endDate: generalRange.endDate,
          meetingTypeName: meetingTypeFilter || undefined,
        }),
      ]);
      setStats(dashboardStats);
      setChartReports(chartData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoadingGeneral(false);
    }
  }, [generalRange, meetingTypeFilter]);

  const loadConsolidated = useCallback(async () => {
    setLoadingConsolidated(true);
    try {
      const [depts, allNeeds, globals] = await Promise.all([
        CulteReportService.getConsolidatedByDepartment(consolidatedRange.startDate, consolidatedRange.endDate),
        CulteReportService.getNeeds({ isAddressed: false }),
        CulteReportService.getConsolidatedGlobalStats(consolidatedRange.startDate, consolidatedRange.endDate),
      ]);
      setConsolidated(depts);
      setNeeds(allNeeds);
      setGlobalStats(globals);
    } catch (error) {
      console.error('Error loading consolidated view:', error);
      toast.error('Erreur lors du chargement de la vue consolidée');
    } finally {
      setLoadingConsolidated(false);
    }
  }, [consolidatedRange]);

  useEffect(() => { loadGeneral(); }, [loadGeneral]);
  useEffect(() => { loadConsolidated(); }, [loadConsolidated]);

  const handleExport = async () => {
    const reports = await CulteReportService.getHistory({
      startDate: generalRange.startDate,
      endDate: generalRange.endDate,
    });
    if (reports.length === 0) {
      toast.error('Aucun rapport à exporter sur cette période');
      return;
    }
    exportCulteReports(reports);
  };

  const needsByPriority = {
    high: needs.filter((n) => n.priority === 'high').length,
    medium: needs.filter((n) => n.priority === 'medium').length,
    low: needs.filter((n) => n.priority === 'low').length,
  };

  const worshipRecent = (stats?.worshipReports || []).filter(
    (r) => !meetingTypeFilter || r.meetingTypeName === meetingTypeFilter
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('general')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${tab === 'general' ? 'bg-white text-[#00665C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Vue générale
          </button>
          <button
            onClick={() => setTab('consolidated')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${tab === 'consolidated' ? 'bg-white text-[#00665C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Vue consolidée
          </button>
        </div>
      </div>

      {tab === 'general' && (
        <div className="space-y-4 sm:space-y-6">
          {loadingGeneral || !stats ? (
            <div className="text-center py-10 text-gray-500">Chargement...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatMiniCard
                  title="Participation moyenne"
                  value={stats.totalParticipants}
                  icon={Users}
                  trend={stats.trends.attendance}
                  borderColor="#3B82F6"
                />
                <StatMiniCard
                  title="Nouveaux membres"
                  value={stats.totalNewMembers}
                  icon={UserPlus}
                  trend={stats.trends.newMembers}
                  borderColor="#10B981"
                />
                <StatMiniCard
                  title="Moyenne présence"
                  value={Math.round(stats.averageAttendance)}
                  icon={TrendingUp}
                  borderColor="#F59E0B"
                />
                <StatMiniCard
                  title="Total entrées"
                  value={`${stats.totalFinances.toLocaleString('fr-FR')} FCFA`}
                  icon={Coins}
                  trend={stats.trends.finances}
                  borderColor="#8B5CF6"
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
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
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={generalRange.startDate}
                    onChange={(e) => setGeneralRange((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="h-9 px-2 text-sm border border-gray-200 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={generalRange.endDate}
                    onChange={(e) => setGeneralRange((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="h-9 px-2 text-sm border border-gray-200 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md sm:ml-auto"
                >
                  <Download className="w-4 h-4" /> Exporter les données
                </button>
              </div>

              <CulteBreakdownChart reports={chartReports} breakdowns={BREAKDOWNS} legendPosition="top" />

              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">Rapports récents</h2>
                  <Link to="/rapports/worship" className="text-xs font-medium text-[#00665C]">Voir tout</Link>
                </div>
                {worshipRecent.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Aucun rapport sur cette période.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {worshipRecent.map((r) => {
                      const d = r.data as WorshipReportData;
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <CalendarDays className="w-3 h-3" /> {r.serviceDate}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">{d.messageTheme || 'Sans thème'}</p>
                            {d.speakerName && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Link2 className="w-3 h-3" /> {d.speakerName}
                              </div>
                            )}
                          </div>
                          <Eye className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'consolidated' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Début</label>
              <input
                type="date"
                value={consolidatedRange.startDate}
                onChange={(e) => setConsolidatedRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fin</label>
              <input
                type="date"
                value={consolidatedRange.endDate}
                onChange={(e) => setConsolidatedRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            <button
              onClick={loadConsolidated}
              className="h-9 px-4 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg"
            >
              Actualiser
            </button>
            <div className="flex gap-1 ml-auto">
              {GENERAL_RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setConsolidatedRange({ startDate: daysAgo(preset.days), endDate: today() })}
                  className="h-9 px-3 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {loadingConsolidated ? (
            <div className="text-center py-10 text-gray-500">Chargement...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Rapports soumis', value: consolidated.reduce((s, d) => s + d.count, 0), icon: CheckCircle2, color: 'text-[#00665C]' },
                  { label: 'Moy. participants', value: globalStats.avgAttendance, icon: Users, color: 'text-indigo-600' },
                  { label: 'Total finances', value: `${globalStats.totalFinances.toLocaleString('fr-FR')} F`, icon: Coins, color: 'text-[#F2B636]' },
                  { label: 'Visiteurs accueillis', value: globalStats.totalVisitors, icon: TrendingUp, color: 'text-purple-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Par département</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consolidated.map((dept) => {
                    const colors = CULTE_REPORT_TYPE_COLORS[dept.reportType];
                    const DeptIcon = DEPT_ICONS[dept.reportType];
                    return (
                      <div key={dept.reportType} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className={`${colors.header} px-4 py-3 flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-white/20">
                              <DeptIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-sm text-white">{dept.label}</span>
                          </div>
                          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">{dept.count} rapport{dept.count !== 1 ? 's' : ''}</span>
                        </div>
                      <div className="p-4 space-y-3">
                        {dept.metrics.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">Aucun rapport sur la période</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {dept.metrics.map((m) => (
                              <div key={m.label}>
                                <p className="text-lg font-bold text-gray-900">{m.value}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
                          <span>{dept.lastReportDate ? `Dernier : ${dept.lastReportDate}` : 'Aucun rapport'}</span>
                          <Link to={`/rapports/${dept.reportType}`} className={`font-medium ${colors.accent} flex items-center gap-1`}>
                            Voir <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <HandHelping className="w-4 h-4 text-[#00665C]" /> Besoins non traités
                  </h3>
                  <Link to="/besoins-rapports" className="text-xs font-medium text-[#00665C] flex items-center gap-1">
                    Gérer <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-red-600">{needsByPriority.high}</p>
                    <p className="text-[10px] text-red-500 uppercase">Urgent</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-amber-600">{needsByPriority.medium}</p>
                    <p className="text-[10px] text-amber-600 uppercase">Moyen</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-gray-500">{needsByPriority.low}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Faible</p>
                  </div>
                </div>
                {needs.length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mt-3">
                    {needs.length} besoin{needs.length !== 1 ? 's' : ''} en attente de traitement
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
