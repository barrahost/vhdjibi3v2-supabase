import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, Pencil, Trash2, Search, Plus, BarChart3, TrendingUp, UserPlus, CalendarDays,
  Coins, GraduationCap, Wine, Radio, Sparkles, Download, Users, BookOpen,
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
import CulteReportSubmitModal from '../components/culteReports/CulteReportSubmitModal';
import { exportCulteReportPdf } from '../utils/culteReportPdf';
import { CulteBreakdownChart, ChartBreakdown } from '../components/dashboard/stats/CulteBreakdownChart';
import {
  CulteReport,
  CulteReportType,
  CulteReportMeetingType,
  DEPARTMENT_NAME_BY_REPORT_TYPE,
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  AcademieReportData,
  SonoReportData,
} from '../types/culteReport.types';

const ITEMS_PER_PAGE = 10;

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function toIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

function monthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return toIso(d);
}

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const r = new Date(d);
  r.setDate(r.getDate() + diff);
  return r;
}

interface PeriodPreset {
  id: string;
  label: string;
  getRange: () => { startDate: string; endDate: string };
}

const WORSHIP_STYLE_PRESETS: PeriodPreset[] = [
  { id: '1m', label: '1 mois', getRange: () => ({ startDate: monthsAgo(1), endDate: today() }) },
  { id: '3m', label: '3 mois', getRange: () => ({ startDate: monthsAgo(3), endDate: today() }) },
  { id: '6m', label: '6 mois', getRange: () => ({ startDate: monthsAgo(6), endDate: today() }) },
  { id: '1a', label: '1 an', getRange: () => ({ startDate: monthsAgo(12), endDate: today() }) },
  { id: 'all', label: 'Tout', getRange: () => ({ startDate: '2020-01-01', endDate: today() }) },
];

const FINANCE_STYLE_PRESETS: PeriodPreset[] = [
  { id: 'today', label: "Aujourd'hui", getRange: () => ({ startDate: today(), endDate: today() }) },
  { id: 'week', label: 'Cette semaine', getRange: () => {
    const now = new Date();
    const start = startOfWeekMonday(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { startDate: toIso(start), endDate: toIso(end) };
  } },
  { id: 'month', label: 'Ce mois', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: toIso(start), endDate: toIso(end) };
  } },
  { id: '3m', label: '3 mois', getRange: () => ({ startDate: monthsAgo(3), endDate: today() }) },
  { id: 'year', label: 'Cette année', getRange: () => {
    const now = new Date();
    return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31` };
  } },
  { id: 'all', label: 'Tout', getRange: () => ({ startDate: '2020-01-01', endDate: today() }) },
];

function avg(values: number[]): number {
  return values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

interface StatCardConfig {
  label: string;
  icon: LucideIcon;
  color: 'teal' | 'green' | 'blue' | 'amber' | 'purple' | 'purpleGray';
  compute: (reports: CulteReport[]) => string | number;
  /** Optional exact hex override (border+icon+value all use this color) when the old app used a bespoke palette instead of the shared bucket — e.g. ADN's #0F6E56/#185FA5/#534AB7/#BA7517. */
  hex?: string;
  /** Optional border-left-only hex override — keeps the bucket's icon/value Tailwind classes but matches an exact inline-style border color (e.g. Finance's #10B981/#3B82F6). */
  borderHex?: string;
}

interface SummaryMetricConfig {
  label: string;
  compute: (reports: CulteReport[]) => number;
  /** Optional override for the box background + value classes (defaults to the plain gray box). Used by Sono's colored score boxes. */
  bgClass?: string;
  valueClass?: (value: number) => string;
  suffix?: string;
}

interface ColumnConfig {
  key: string;
  title: string;
  render: (report: CulteReport) => React.ReactNode;
}

interface DeptViewConfig {
  icon: LucideIcon;
  /** Exact page h1 text from the old app's desktop view — distinct from CULTE_REPORT_TYPE_LABELS (used for dropdowns/PDF titles, which have different phrasing). */
  pageTitle: string;
  subtitle: string;
  statCards: StatCardConfig[];
  summaryMetrics: SummaryMetricConfig[];
  columns: ColumnConfig[];
  breakdowns: ChartBreakdown[];
  searchFields: (r: CulteReport) => string[];
  searchPlaceholder: string;
  /** 'all' = stat-cards computed on the full history (old app default). 'chart' = computed on the chart's period-filtered reports (Finance only, matches old app). */
  statsSource: 'all' | 'chart';
  evolutionTitle: string;
  evolutionIcon: LucideIcon;
  periodPresets: PeriodPreset[];
  defaultPeriodPresetId: string;
  /** 'simple' = flat buttons (Worship/ADN/…). 'boxed' = bordered box with "Période :" label (Finance, matches old app). */
  periodSelectorStyle: 'simple' | 'boxed';
  /** Finance's chart aggregates reports by month (matches FinanceTrendChart.tsx); all other types plot per-report. */
  chartAggregation: 'report' | 'month';
  /** When true, shows a toggle letting the user switch the chart between per-report and monthly-aggregated (Finance only). */
  allowAggregationToggle: boolean;
}

const STAT_COLOR_CLASSES: Record<StatCardConfig['color'], { border: string; icon: string; value: string }> = {
  teal: { border: 'border-[#00665C]', icon: 'text-[#00665C]', value: 'text-[#00665C]' },
  green: { border: 'border-green-500', icon: 'text-green-500', value: 'text-green-600' },
  blue: { border: 'border-blue-400', icon: 'text-blue-400', value: 'text-blue-600' },
  amber: { border: 'border-amber-400', icon: 'text-amber-400', value: 'text-gray-900' },
  purple: { border: 'border-[#8B5CF6]', icon: 'text-[#8B5CF6]', value: 'text-[#00665C]' },
  purpleGray: { border: 'border-[#8B5CF6]', icon: 'text-[#8B5CF6]', value: 'text-gray-900' },
};

function lastReportDateShort(reports: CulteReport[]): string {
  return reports.length > 0 ? new Date(reports[0].serviceDate).toLocaleDateString('fr-FR') : '-';
}

function lastReportDateFull(reports: CulteReport[]): string {
  if (reports.length === 0) return '-';
  return new Date(`${reports[0].serviceDate}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function defaultSearchFields(r: CulteReport): string[] {
  return [r.serviceDate, r.notes || '', r.submittedByName];
}

function computeSonoScores(r: CulteReport): { avant: number; pendant: number; apres: number; global: number } {
  const d = r.data as SonoReportData;
  const bs = d.beforeService;
  const ds = d.duringService;
  const as_ = d.afterService;
  const okV = (v?: string) => (v === 'OK' ? 1 : 0);
  const effectV = (v?: string) => (v === 'EFFECTUEE' ? 1 : 0);
  const satV = (v?: string) => (v === 'SATISFAISANT' ? 1 : 0);
  const qualV = (v?: string) => (v === 'BONNE' ? 1 : v === 'MOYENNE' ? 0.5 : 0);
  const ouiV = (v?: string) => (v === 'OUI' ? 1 : 0);
  const vidV = (v?: string) => (v === 'OK' ? 1 : v === 'EN_COURS' ? 0.5 : 0);

  const avantVals = [okV(bs?.materialCheck), okV(bs?.soundQualityTest), okV(bs?.liveStreamingTest), okV(bs?.onlineSoundTest), okV(bs?.onlineVideoTest), okV(bs?.photoEquipmentPrep)];
  const pendantVals = [okV(ds?.proclamationLaunch), satV(ds?.roomSoundQuality), ouiV(ds?.liveStreaming), qualV(ds?.onlineSoundQuality), qualV(ds?.onlineVideoQuality), ouiV(ds?.photoshootDuringService)];
  const apresVals = [effectV(as_?.servantsPhotos), effectV(as_?.photoMasking), okV(as_?.audioReplayPublication), vidV(as_?.videoReplayPublication), okV(as_?.fileArchiving)];

  const avg = (vals: number[]) => Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100);
  const avant = avg(avantVals);
  const pendant = avg(pendantVals);
  const apres = avg(apresVals);
  return { avant, pendant, apres, global: Math.round((avant + pendant + apres) / 3) };
}

function scoreValueClass(v: number): string {
  return v >= 80 ? 'text-green-700' : v >= 60 ? 'text-amber-700' : 'text-red-700';
}

function rateColorClass(v: number): string {
  return v >= 90 ? 'text-green-700' : v >= 70 ? 'text-amber-700' : 'text-red-700';
}

function aggregateFinanceByMonth(reports: CulteReport[]): CulteReport[] {
  const map = new Map<string, { tithes: number; regularOfferings: number; specialOfferings: number; totalFinances: number }>();
  reports.forEach((r) => {
    const d = new Date(r.serviceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const data = r.data as FinanceReportData;
    const existing = map.get(key) || { tithes: 0, regularOfferings: 0, specialOfferings: 0, totalFinances: 0 };
    existing.tithes += data.tithes || 0;
    existing.regularOfferings += data.regularOfferings || 0;
    existing.specialOfferings += data.specialOfferings || 0;
    existing.totalFinances += data.totalFinances || 0;
    map.set(key, existing);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, totals]) => ({
      id: key,
      churchId: '',
      reportType: 'finance' as CulteReportType,
      departmentId: null,
      departmentName: '',
      worshipReportId: null,
      eventId: null,
      serviceDate: `${key}-01`,
      meetingTypeId: null,
      meetingTypeName: null,
      submittedBy: null,
      submittedByName: '',
      data: totals as FinanceReportData,
      notes: null,
      needsNotes: null,
      legacyFirestoreId: null,
      createdAt: '',
      updatedAt: '',
    }));
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

const MONTH_ABBR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Carte compacte pour la vue mobile (< sm) : badge date colore, valeur phare, le reste des
 * colonnes en detail, actions en icones larges (cible tactile) -- inspire de l'ancienne app
 * dont la plupart des utilisateurs se servaient depuis leur telephone. */
function renderMobileReportCard(
  row: CulteReport,
  columns: ColumnConfig[],
  onView: (r: CulteReport) => void,
  onEdit: (r: CulteReport) => void,
  onDelete: (r: CulteReport) => void,
  onDownloadPdf: (r: CulteReport) => void
): React.ReactNode {
  const d = new Date(`${row.serviceDate}T00:00:00`);
  const detailColumns = columns.filter((c) => c.key !== 'serviceDate' && c.key !== 'actions');
  const [headlineColumn, ...restColumns] = detailColumns;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#00665C]/10 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-[#00665C] leading-none">{d.getDate()}</span>
          <span className="text-[10px] font-medium text-[#00665C]/80 uppercase leading-none mt-0.5">{MONTH_ABBR[d.getMonth()]}</span>
        </div>
        <div className="flex-1 min-w-0">
          {headlineColumn && (
            <p className="text-sm font-semibold text-gray-900 truncate">{headlineColumn.render(row)}</p>
          )}
          <p className="text-xs text-gray-400">{row.meetingTypeName || '—'}</p>
        </div>
      </div>

      {restColumns.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {restColumns.map((c) => (
            <div key={c.key} className="min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase truncate">{c.title}</p>
              <div className="text-sm text-gray-700 truncate">{c.render(row)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 -mx-1">
        <button onClick={() => onView(row)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[#00665C] active:bg-[#00665C]/10 rounded-md text-xs font-medium">
          <Eye className="w-4 h-4" /> Voir
        </button>
        <button onClick={() => onEdit(row)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-blue-600 active:bg-blue-50 rounded-md text-xs font-medium">
          <Pencil className="w-4 h-4" /> Modifier
        </button>
        <button onClick={() => onDownloadPdf(row)} className="flex items-center justify-center p-2.5 text-gray-500 active:bg-gray-100 rounded-md">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(row)} className="flex items-center justify-center p-2.5 text-red-600 active:bg-red-50 rounded-md">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function getConfig(reportType: CulteReportType): Omit<DeptViewConfig, 'columns'> {
  switch (reportType) {
    case 'worship':
      return {
        icon: Sparkles,
        pageTitle: 'Gestion de Culte',
        subtitle: 'Gérez les rapports de présence et informations générales des cultes',
        statCards: [
          { label: 'Total rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Participation moy.', icon: TrendingUp, color: 'green', compute: (r) => avg(r.map((x) => (x.data as WorshipReportData).totalParticipants || 0)) },
          { label: 'Nvx membres moy.', icon: UserPlus, color: 'blue', compute: (r) => avg(r.map((x) => (x.data as WorshipReportData).totalNewMembers || 0)) },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', compute: lastReportDateShort },
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
        searchPlaceholder: 'Rechercher par thème, source, prédicateur...',
        statsSource: 'chart',
        evolutionTitle: 'Évolution du culte',
        evolutionIcon: Users,
        periodPresets: WORSHIP_STYLE_PRESETS,
        defaultPeriodPresetId: '3m',
        periodSelectorStyle: 'simple',
        chartAggregation: 'report',
        allowAggregationToggle: false,
      };
    case 'finance':
      return {
        icon: Coins,
        pageTitle: 'Emmeraude',
        subtitle: 'Gérez les rapports financiers des cultes',
        statCards: [
          { label: 'Total Rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Total Dîmes', icon: TrendingUp, color: 'green', borderHex: '#10B981', compute: (r) => `${r.reduce((s, x) => s + ((x.data as FinanceReportData).tithes || 0), 0).toLocaleString('fr-FR')} FCFA` },
          { label: 'Total Offrandes', icon: UserPlus, color: 'blue', borderHex: '#3B82F6', compute: (r) => `${r.reduce((s, x) => s + ((x.data as FinanceReportData).regularOfferings || 0) + ((x.data as FinanceReportData).specialOfferings || 0), 0).toLocaleString('fr-FR')} FCFA` },
          { label: 'Total Général', icon: Coins, color: 'purple', compute: (r) => `${r.reduce((s, x) => s + ((x.data as FinanceReportData).totalFinances || 0), 0).toLocaleString('fr-FR')} FCFA` },
        ],
        summaryMetrics: [],
        breakdowns: [
          {
            key: 'global', label: 'Vue globale',
            series: [
              { key: 'tithes', label: 'Dîmes', color: '#10B981', type: 'bar', stackId: 'fin', extractValue: (r) => (r.data as FinanceReportData).tithes || 0 },
              { key: 'regularOfferings', label: 'Offrandes ord.', color: '#3B82F6', type: 'bar', stackId: 'fin', extractValue: (r) => (r.data as FinanceReportData).regularOfferings || 0 },
              { key: 'specialOfferings', label: 'Offrandes spé.', color: '#F59E0B', type: 'bar', stackId: 'fin', extractValue: (r) => (r.data as FinanceReportData).specialOfferings || 0 },
              { key: 'total', label: 'Total', color: '#8B5CF6', type: 'line', extractValue: (r) => (r.data as FinanceReportData).totalFinances || 0 },
            ],
          },
          {
            key: 'tithes', label: 'Dîmes',
            series: [
              { key: 'tithes', label: 'Dîmes', color: '#10B981', type: 'line', extractValue: (r) => (r.data as FinanceReportData).tithes || 0 },
            ],
          },
          {
            key: 'offerings', label: 'Offrandes',
            series: [
              { key: 'regularOfferings', label: 'Offrandes ordinaires', color: '#3B82F6', type: 'bar', extractValue: (r) => (r.data as FinanceReportData).regularOfferings || 0 },
              { key: 'specialOfferings', label: 'Offrandes spéciales', color: '#F59E0B', type: 'bar', extractValue: (r) => (r.data as FinanceReportData).specialOfferings || 0 },
            ],
          },
        ],
        searchFields: defaultSearchFields,
        searchPlaceholder: 'Rechercher par date ou notes...',
        statsSource: 'chart',
        evolutionTitle: 'Évolution des finances',
        evolutionIcon: TrendingUp,
        periodPresets: FINANCE_STYLE_PRESETS,
        defaultPeriodPresetId: '3m',
        periodSelectorStyle: 'boxed',
        chartAggregation: 'month',
        allowAggregationToggle: true,
      };
    case 'adn':
      return {
        icon: UserPlus,
        pageTitle: 'ADN',
        subtitle: 'Gérez les rapports de suivi des nouveaux visiteurs',
        statCards: [
          { label: 'Total Rapports', icon: BarChart3, color: 'teal', hex: '#0F6E56', compute: (r) => r.length },
          { label: 'Visiteurs moy.', icon: TrendingUp, color: 'blue', hex: '#185FA5', compute: (r) => avg(r.map((x) => (x.data as AdnReportData).totalNewVisitors || 0)) },
          { label: 'Taux conversion', icon: UserPlus, color: 'purple', hex: '#534AB7', compute: (r) => {
            const totalVisitors = r.reduce((s, x) => s + ((x.data as AdnReportData).totalNewVisitors || 0), 0);
            const totalJoin = r.reduce((s, x) => s + ((x.data as AdnReportData).totalWantsToJoin || 0), 0);
            return totalVisitors > 0 ? `${Math.round((totalJoin / totalVisitors) * 100)}%` : '0%';
          } },
          { label: 'Dernier rapport', icon: CalendarDays, color: 'amber', hex: '#BA7517', compute: lastReportDateShort },
        ],
        summaryMetrics: [],
        breakdowns: [
          {
            key: 'visitors', label: 'Évolution des nouveaux visiteurs',
            series: [
              { key: 'total', label: 'Total nouveaux visiteurs', color: '#8B5CF6', type: 'line', extractValue: (r) => (r.data as AdnReportData).totalNewVisitors || 0 },
            ],
          },
          {
            key: 'gender', label: 'Nouveaux visiteurs par genre',
            series: [
              { key: 'men', label: 'Hommes', color: '#8B5CF6', type: 'bar', extractValue: (r) => (r.data as AdnReportData).newVisitors?.men || 0 },
              { key: 'women', label: 'Femmes', color: '#F59E0B', type: 'bar', extractValue: (r) => (r.data as AdnReportData).newVisitors?.women || 0 },
              { key: 'total', label: 'Total', color: '#DC2626', type: 'line', extractValue: (r) => (r.data as AdnReportData).totalNewVisitors || 0 },
            ],
          },
          {
            key: 'decisions', label: 'Évolution des décisions',
            series: [
              { key: 'undecided', label: 'Indécis', color: '#F59E0B', type: 'bar', extractValue: (r) => (r.data as AdnReportData).visitorDecisions?.undecided || 0 },
              { key: 'wantsToJoin', label: 'Veulent rejoindre', color: '#10B981', type: 'bar', extractValue: (r) => (r.data as AdnReportData).totalWantsToJoin || 0 },
              { key: 'wantsToGiveLifeToJesus', label: 'Vie à Jésus', color: '#8B5CF6', type: 'bar', extractValue: (r) => (r.data as AdnReportData).totalWantsToGiveLifeToJesus || 0 },
            ],
          },
        ],
        searchFields: defaultSearchFields,
        searchPlaceholder: 'Rechercher par date ou notes...',
        statsSource: 'chart',
        evolutionTitle: 'Courbes de tendances ADN',
        evolutionIcon: UserPlus,
        periodPresets: WORSHIP_STYLE_PRESETS,
        defaultPeriodPresetId: '3m',
        periodSelectorStyle: 'simple',
        chartAggregation: 'report',
        allowAggregationToggle: false,
      };
    case 'sainte_cene':
      return {
        icon: Wine,
        pageTitle: 'Rapports Sainte Cène',
        subtitle: 'Gérez les rapports de la Sainte Cène',
        statCards: [
          { label: 'Total Rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Pains Totaux Distribués', icon: TrendingUp, color: 'green', borderHex: '#10B981', compute: (r) => r.reduce((s, x) => s + ((x.data as SainteCeneReportData).painsDistribuees || 0), 0) },
          { label: 'Vins Totaux Distribués', icon: UserPlus, color: 'blue', borderHex: '#3B82F6', compute: (r) => r.reduce((s, x) => s + ((x.data as SainteCeneReportData).vinsDistribuees || 0), 0) },
          { label: 'Dernier Rapport', icon: CalendarDays, color: 'purpleGray', compute: lastReportDateFull },
        ],
        summaryMetrics: [
          { label: 'Pains distribués', bgClass: 'bg-amber-50', valueClass: () => 'text-amber-700', compute: (r) => r.reduce((s, x) => s + ((x.data as SainteCeneReportData).painsDistribuees || 0), 0) },
          { label: 'Vins distribués', bgClass: 'bg-purple-50', valueClass: () => 'text-purple-700', compute: (r) => r.reduce((s, x) => s + ((x.data as SainteCeneReportData).vinsDistribuees || 0), 0) },
          { label: 'Taux moy. pains', bgClass: 'bg-blue-50', suffix: '%', valueClass: rateColorClass, compute: (r) => avg(r.map((x) => {
            const d = x.data as SainteCeneReportData;
            return d.painsPreparees > 0 ? Math.round((d.painsDistribuees / d.painsPreparees) * 100) : 0;
          })) },
          { label: 'Taux moy. vins', bgClass: 'bg-green-50', suffix: '%', valueClass: rateColorClass, compute: (r) => avg(r.map((x) => {
            const d = x.data as SainteCeneReportData;
            return d.vinsPreparees > 0 ? Math.round((d.vinsDistribuees / d.vinsPreparees) * 100) : 0;
          })) },
        ],
        breakdowns: [
          {
            key: 'distribution', label: 'Distribution',
            series: [
              { key: 'painsPrep', label: 'Pains préparés', color: '#fbbf24', type: 'bar', extractValue: (r) => (r.data as SainteCeneReportData).painsPreparees || 0 },
              { key: 'painsDist', label: 'Pains distribués', color: '#d97706', type: 'bar', extractValue: (r) => (r.data as SainteCeneReportData).painsDistribuees || 0 },
              { key: 'vinsPrep', label: 'Vins préparés', color: '#a78bfa', type: 'bar', extractValue: (r) => (r.data as SainteCeneReportData).vinsPreparees || 0 },
              { key: 'vinsDist', label: 'Vins distribués', color: '#7c3aed', type: 'bar', extractValue: (r) => (r.data as SainteCeneReportData).vinsDistribuees || 0 },
            ],
          },
          {
            key: 'taux', label: 'Taux %',
            series: [
              { key: 'tauxPains', label: 'Taux pains %', color: '#d97706', type: 'line', extractValue: (r) => {
                const d = r.data as SainteCeneReportData;
                return d.painsPreparees > 0 ? Math.round((d.painsDistribuees / d.painsPreparees) * 100) : 0;
              } },
              { key: 'tauxVins', label: 'Taux vins %', color: '#7c3aed', type: 'line', extractValue: (r) => {
                const d = r.data as SainteCeneReportData;
                return d.vinsPreparees > 0 ? Math.round((d.vinsDistribuees / d.vinsPreparees) * 100) : 0;
              } },
            ],
          },
        ],
        searchFields: defaultSearchFields,
        searchPlaceholder: 'Rechercher par date…',
        statsSource: 'chart',
        evolutionTitle: 'Évolution Sainte Cène',
        evolutionIcon: Wine,
        periodPresets: WORSHIP_STYLE_PRESETS,
        defaultPeriodPresetId: '3m',
        periodSelectorStyle: 'simple',
        chartAggregation: 'report',
        allowAggregationToggle: false,
      };
    case 'academie':
      return {
        icon: GraduationCap,
        pageTitle: 'Rapports Académie',
        subtitle: "Gérez les rapports de l'Académie d'Honneur",
        statCards: [],
        summaryMetrics: [
          { label: 'Total présents', compute: (r) => r.reduce((s, x) => s + ((x.data as AcademieReportData).presentStudents || 0), 0) },
          { label: 'Total inscrits', compute: (r) => r.reduce((s, x) => s + ((x.data as AcademieReportData).actualStudents || 0), 0) },
          { label: 'Taux moyen', compute: (r) => {
            if (r.length === 0) return 0;
            const rates = r.map((x) => {
              const d = x.data as AcademieReportData;
              return d.actualStudents > 0 ? Math.round((d.presentStudents / d.actualStudents) * 100) : 0;
            });
            return Math.round(rates.reduce((s, v) => s + v, 0) / rates.length);
          } },
        ],
        breakdowns: [
          {
            key: 'presence', label: 'Présence',
            series: [
              { key: 'inscrits', label: 'Inscrits', color: '#3B82F6', type: 'line', extractValue: (r) => (r.data as AcademieReportData).actualStudents || 0 },
              { key: 'presents', label: 'Présents', color: '#00665C', type: 'line', extractValue: (r) => (r.data as AcademieReportData).presentStudents || 0 },
            ],
          },
          {
            key: 'taux', label: 'Taux (%)',
            series: [{ key: 'taux', label: 'Taux de présence', color: '#00665C', type: 'line', extractValue: (r) => {
              const d = r.data as AcademieReportData;
              return d.actualStudents > 0 ? Math.round((d.presentStudents / d.actualStudents) * 100) : 0;
            } }],
          },
        ],
        searchFields: defaultSearchFields,
        searchPlaceholder: 'Rechercher par date, classe ou modérateur…',
        statsSource: 'chart',
        evolutionTitle: 'Évolution de la présence',
        evolutionIcon: BookOpen,
        periodPresets: WORSHIP_STYLE_PRESETS,
        defaultPeriodPresetId: '3m',
        periodSelectorStyle: 'simple',
        chartAggregation: 'report',
        allowAggregationToggle: false,
      };
    case 'sono':
      return {
        icon: Radio,
        pageTitle: 'Communication & Sono',
        subtitle: 'Gérez les rapports de sonorisation et communication',
        statCards: [
          { label: 'Total Rapports', icon: BarChart3, color: 'teal', compute: (r) => r.length },
          { label: 'Matériel OK', icon: TrendingUp, color: 'green', borderHex: '#10B981', compute: (r) => r.filter((x) => (x.data as SonoReportData).beforeService?.materialCheck === 'OK').length },
          { label: 'Lives Effectués', icon: UserPlus, color: 'blue', borderHex: '#3B82F6', compute: (r) => r.filter((x) => (x.data as SonoReportData).duringService?.liveStreaming === 'OUI').length },
          { label: 'Dernier Rapport', icon: CalendarDays, color: 'purpleGray', compute: lastReportDateFull },
        ],
        summaryMetrics: [
          { label: 'Score global moy.', bgClass: 'bg-indigo-50', valueClass: scoreValueClass, suffix: '%', compute: (r) => avg(r.map((x) => computeSonoScores(x).global)) },
          { label: 'Score avant', bgClass: 'bg-blue-50', valueClass: scoreValueClass, suffix: '%', compute: (r) => avg(r.map((x) => computeSonoScores(x).avant)) },
          { label: 'Score pendant', bgClass: 'bg-green-50', valueClass: scoreValueClass, suffix: '%', compute: (r) => avg(r.map((x) => computeSonoScores(x).pendant)) },
          { label: 'Score après', bgClass: 'bg-amber-50', valueClass: scoreValueClass, suffix: '%', compute: (r) => avg(r.map((x) => computeSonoScores(x).apres)) },
        ],
        breakdowns: [
          {
            key: 'global', label: 'Score global',
            series: [{ key: 'global', label: 'Score global', color: '#4f46e5', type: 'line', extractValue: (r) => computeSonoScores(r).global }],
          },
          {
            key: 'detail', label: 'Détail',
            series: [
              { key: 'avant', label: 'Avant', color: '#3b82f6', type: 'bar', extractValue: (r) => computeSonoScores(r).avant },
              { key: 'pendant', label: 'Pendant', color: '#22c55e', type: 'bar', extractValue: (r) => computeSonoScores(r).pendant },
              { key: 'apres', label: 'Après', color: '#f59e0b', type: 'bar', extractValue: (r) => computeSonoScores(r).apres },
            ],
          },
        ],
        searchFields: defaultSearchFields,
        searchPlaceholder: 'Rechercher par date ou observations…',
        statsSource: 'chart',
        evolutionTitle: 'Évolution Sono & Communication',
        evolutionIcon: Radio,
        periodPresets: WORSHIP_STYLE_PRESETS,
        defaultPeriodPresetId: '3m',
        periodSelectorStyle: 'simple',
        chartAggregation: 'report',
        allowAggregationToggle: false,
      };
    default:
      return {
        icon: BarChart3, pageTitle: '', subtitle: '', statCards: [], summaryMetrics: [], breakdowns: [],
        searchFields: defaultSearchFields, searchPlaceholder: 'Rechercher...', statsSource: 'all',
        evolutionTitle: 'Évolution', evolutionIcon: BarChart3,
        periodPresets: WORSHIP_STYLE_PRESETS, defaultPeriodPresetId: '3m', periodSelectorStyle: 'simple',
        chartAggregation: 'report',
        allowAggregationToggle: false,
      };
  }
}

function getColumns(
  reportType: CulteReportType,
  onView: (r: CulteReport) => void,
  onEdit: (r: CulteReport) => void,
  onDelete: (r: CulteReport) => void,
  onDownloadPdf: (r: CulteReport) => void
): ColumnConfig[] {
  const base: ColumnConfig[] = [{ key: 'serviceDate', title: 'Date', render: (r) => new Date(r.serviceDate).toLocaleDateString('fr-FR') }];

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
        { key: 'tithes', title: 'Dîmes', render: (r) => `${((r.data as FinanceReportData).tithes || 0).toLocaleString('fr-FR')} FCFA` },
        { key: 'regularOfferings', title: 'Offrandes ordinaires', render: (r) => `${((r.data as FinanceReportData).regularOfferings || 0).toLocaleString('fr-FR')} FCFA` },
        { key: 'specialOfferings', title: 'Offrandes spéciales', render: (r) => `${((r.data as FinanceReportData).specialOfferings || 0).toLocaleString('fr-FR')} FCFA` },
        { key: 'total', title: 'Total', render: (r) => `${((r.data as FinanceReportData).totalFinances || 0).toLocaleString('fr-FR')} FCFA` },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'adn':
      return [
        ...base,
        { key: 'visitors', title: 'Nouveaux visiteurs', render: (r) => (r.data as AdnReportData).totalNewVisitors || 0 },
        { key: 'ratio', title: 'Ratio H/F', render: (r) => {
          const d = r.data as AdnReportData;
          return `${d.newVisitors?.men || 0}H / ${d.newVisitors?.women || 0}F`;
        } },
        { key: 'undecided', title: 'Indécis', render: (r) => (r.data as AdnReportData).visitorDecisions?.undecided || 0 },
        { key: 'join', title: 'Veut rejoindre', render: (r) => (r.data as AdnReportData).totalWantsToJoin || 0 },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'sainte_cene':
      return [
        { key: 'serviceDate', title: 'Date', render: (r) => new Date(`${r.serviceDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        { key: 'painsPrep', title: 'Pains Préparés', render: (r) => (r.data as SainteCeneReportData).painsPreparees || 0 },
        { key: 'vinsPrep', title: 'Vins Préparés', render: (r) => (r.data as SainteCeneReportData).vinsPreparees || 0 },
        { key: 'pains', title: 'Pains Distribués', render: (r) => (r.data as SainteCeneReportData).painsDistribuees || 0 },
        { key: 'vins', title: 'Vins Distribués', render: (r) => (r.data as SainteCeneReportData).vinsDistribuees || 0 },
        { key: 'painsRest', title: 'Pains Restants', render: (r) => (r.data as SainteCeneReportData).painsRestantes || 0 },
        { key: 'vinsRest', title: 'Vins Restants', render: (r) => (r.data as SainteCeneReportData).vinsRestantes || 0 },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'academie':
      return [
        ...base,
        { key: 'className', title: 'Classe', render: (r) => (r.data as AcademieReportData).className || '-' },
        { key: 'moderator', title: 'Modérateur', render: (r) => (r.data as AcademieReportData).moderator || '-' },
        { key: 'course', title: 'Cours du jour', render: (r) => (r.data as AcademieReportData).courseOfTheDay || '-' },
        { key: 'present', title: 'Présents', render: (r) => {
          const d = r.data as AcademieReportData;
          return `${d.presentStudents || 0} / ${d.actualStudents || 0}`;
        } },
        actionsColumn(onView, onEdit, onDelete, onDownloadPdf),
      ];
    case 'sono':
      return [
        { key: 'serviceDate', title: 'Date', render: (r) => new Date(`${r.serviceDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        { key: 'materialCheck', title: 'Matériel Sono', render: (r) => {
          const v = (r.data as SonoReportData).beforeService?.materialCheck;
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v}</span>;
        } },
        { key: 'liveStreaming', title: 'Live Streaming', render: (r) => {
          const v = (r.data as SonoReportData).duringService?.liveStreaming;
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v === 'OUI' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{v}</span>;
        } },
        { key: 'audioReplay', title: 'Audio Replay', render: (r) => {
          const v = (r.data as SonoReportData).afterService?.audioReplayPublication;
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v}</span>;
        } },
        { key: 'videoReplay', title: 'Vidéo Replay', render: (r) => {
          const v = (r.data as SonoReportData).afterService?.videoReplayPublication;
          const cls = v === 'OK' ? 'bg-green-100 text-green-800' : v === 'EN_COURS' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{v === 'EN_COURS' ? 'En cours' : v}</span>;
        } },
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
  const config = getConfig(type);

  const { confirm, confirmModalProps } = useConfirmModal();
  const [allReports, setAllReports] = useState<CulteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  // Periode + type de rencontre pilotent a la fois le graphique et la liste des rapports --
  // un seul filtre partage, plus besoin de deux selecteurs de date qui se ressemblent.
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('');
  const [meetingTypes, setMeetingTypes] = useState<CulteReportMeetingType[]>([]);
  const [chartPresetId, setChartPresetId] = useState(config.defaultPeriodPresetId);
  const [chartRange, setChartRange] = useState(
    (config.periodPresets.find((p) => p.id === config.defaultPeriodPresetId) || config.periodPresets[0]).getRange()
  );
  const [chartReports, setChartReports] = useState<CulteReport[]>([]);
  const [aggregationMode, setAggregationMode] = useState<'report' | 'month'>(config.chartAggregation);
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

  const loadChartReports = useCallback(async () => {
    if (!departmentName) return;
    setLoading(true);
    try {
      const data = await CulteReportService.getHistory({
        reportType: type,
        startDate: chartRange.startDate,
        endDate: chartRange.endDate,
        meetingTypeName: meetingTypeFilter || undefined,
      });
      setChartReports(data);
    } catch (error) {
      console.error('Error loading chart reports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  }, [type, departmentName, chartRange, meetingTypeFilter]);

  const loadAllReports = useCallback(async () => {
    if (!departmentName) return;
    try {
      const data = await CulteReportService.getHistory({ reportType: type });
      setAllReports(data);
    } catch (error) {
      console.error('Error loading all department reports:', error);
    }
  }, [type, departmentName]);

  useEffect(() => { loadChartReports(); }, [loadChartReports]);
  useEffect(() => { loadAllReports(); }, [loadAllReports]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, chartRange, meetingTypeFilter]);

  if (!departmentName) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">Type de rapport inconnu.</div>;
  }

  const handleDelete = async (report: CulteReport) => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await CulteReportService.deleteReport(report.id);
        toast.success('Rapport supprimé');
        loadChartReports();
        loadAllReports();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const columns = getColumns(type, setViewingReport, setEditingReport, handleDelete, exportCulteReportPdf);

  const filtered = chartReports.filter((r) =>
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
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{config.pageTitle}</h1>
            <p className="text-sm text-gray-500">{config.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nouveau rapport
        </button>
      </div>

      {config.statsSource === 'chart' && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium text-gray-700">Statistiques</h2>
          <span className="text-xs text-[#00665C] bg-[#00665C]/8 px-2 py-1 rounded-full">
            Période du graphique : {(config.periodPresets.find((p) => p.id === chartPresetId)?.label) || 'personnalisée'}
          </span>
        </div>
      )}

      {config.statCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {config.statCards.map((sc, i) => {
            const colors = STAT_COLOR_CLASSES[sc.color];
            return (
              <div
                key={i}
                className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 ${sc.hex || sc.borderHex ? '' : colors.border}`}
                style={sc.hex ? { borderLeftColor: sc.hex } : sc.borderHex ? { borderLeftColor: sc.borderHex } : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{sc.label}</h3>
                  <sc.icon className={`h-4 w-4 flex-shrink-0 ${sc.hex ? '' : colors.icon} opacity-70`} style={sc.hex ? { color: sc.hex } : undefined} />
                </div>
                <p className={`text-lg sm:text-2xl font-bold ${sc.hex ? '' : colors.value}`} style={sc.hex ? { color: sc.hex } : undefined}>{sc.compute(config.statsSource === 'chart' ? chartReports : (allReports.length > 0 ? allReports : chartReports))}</p>
              </div>
            );
          })}
        </div>
      )}

      {(() => {
        const chartBlock = (
          <div key="chart" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <config.evolutionIcon className="h-5 w-5 text-[#00665C]" /> {config.evolutionTitle}
            </h2>

            {config.summaryMetrics.length > 0 && (
              <div className={`grid grid-cols-2 sm:grid-cols-${config.summaryMetrics.length} gap-3`}>
                {config.summaryMetrics.map((m) => {
                  const value = m.compute(chartReports);
                  return (
                    <div key={m.label} className={`${m.bgClass || 'bg-gray-50'} rounded-lg p-3 text-center`}>
                      <p className={`text-xl font-bold ${m.valueClass ? m.valueClass(value) : 'text-gray-900'}`}>{value}{m.suffix || ''}</p>
                      <p className="text-xs text-gray-500">{m.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {config.periodSelectorStyle === 'boxed' ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                  <CalendarDays className="h-4 w-4" /> Période du graphique :
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                  {config.periodPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => { setChartPresetId(preset.id); setChartRange(preset.getRange()); }}
                      className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                        chartPresetId === preset.id ? 'bg-[#00665C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                  <input type="date" value={chartRange.startDate} onChange={(e) => { setChartPresetId(''); setChartRange((p) => ({ ...p, startDate: e.target.value })); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  <span className="text-sm text-gray-400">à</span>
                  <input type="date" value={chartRange.endDate} onChange={(e) => { setChartPresetId(''); setChartRange((p) => ({ ...p, endDate: e.target.value })); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  <select
                    value={meetingTypeFilter}
                    onChange={(e) => setMeetingTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-[#00665C] focus:border-[#00665C]"
                  >
                    <option value="">Tous les types de rencontre</option>
                    {meetingTypes.map((mt) => (
                      <option key={mt.id} value={mt.name}>{mt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-between">
                <div className="flex gap-1 overflow-x-auto -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                  {config.periodPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => { setChartPresetId(preset.id); setChartRange(preset.getRange()); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap flex-shrink-0 ${
                        chartPresetId === preset.id ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="date" value={chartRange.startDate} onChange={(e) => { setChartPresetId(''); setChartRange((p) => ({ ...p, startDate: e.target.value })); }} className="h-9 px-2 text-sm border border-gray-200 rounded-md" />
                  <input type="date" value={chartRange.endDate} onChange={(e) => { setChartPresetId(''); setChartRange((p) => ({ ...p, endDate: e.target.value })); }} className="h-9 px-2 text-sm border border-gray-200 rounded-md" />
                  <select
                    value={meetingTypeFilter}
                    onChange={(e) => setMeetingTypeFilter(e.target.value)}
                    className="h-9 px-2 text-sm border border-gray-200 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
                  >
                    <option value="">Tous les types de rencontre</option>
                    {meetingTypes.map((mt) => (
                      <option key={mt.id} value={mt.name}>{mt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {config.allowAggregationToggle && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 mr-1">Affichage :</span>
                <button
                  onClick={() => setAggregationMode('month')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    aggregationMode === 'month' ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Par mois
                </button>
                <button
                  onClick={() => setAggregationMode('report')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    aggregationMode === 'report' ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Par rapport
                </button>
              </div>
            )}

            <CulteBreakdownChart
              reports={aggregationMode === 'month' ? aggregateFinanceByMonth(chartReports) : chartReports}
              breakdowns={config.breakdowns}
              dateFormat={aggregationMode === 'month' ? 'month' : 'day'}
            />
          </div>
        );

        const filterFormBlock = (
          <div key="filters" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
              <Search className="absolute left-3 top-1/2 translate-y-1 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={config.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 h-9 text-sm border border-gray-200 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
          </div>
        );

        return <>{chartBlock}{filterFormBlock}</>;
      })()}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      ) : (
        <>
          <div className="flex items-center justify-end">
            <span className="text-xs text-gray-400">{paginated.length} / {filtered.length} rapport(s)</span>
          </div>
          <CustomTable
            data={paginated}
            columns={columns.map((c) => ({ key: c.key, title: c.title, render: (_: any, row: CulteReport) => c.render(row) }))}
            breakpoint="sm"
            mobileCard={(row: CulteReport) => renderMobileReportCard(row, columns, setViewingReport, setEditingReport, handleDelete, exportCulteReportPdf)}
          />

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
          onSuccess={() => { setEditingReport(null); loadChartReports(); loadAllReports(); }}
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
      <CulteReportSubmitModal
        isOpen={showForm}
        reportType={type}
        departmentId={departmentId}
        departmentName={departmentName}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); loadChartReports(); loadAllReports(); }}
      />
    </div>
  );
}
