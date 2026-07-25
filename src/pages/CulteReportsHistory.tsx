import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { CollapsibleFilters } from '../components/ui/CollapsibleFilters';
import { Search, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { CulteReportService } from '../services/culteReport.service';
import { CulteReport, CulteReportType, CULTE_REPORT_TYPE_LABELS } from '../types/culteReport.types';

const ITEMS_PER_PAGE = 10;

interface DeptOption {
  id: string;
  name: string;
}

export default function CulteReportsHistory() {
  const [reports, setReports] = useState<CulteReport[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentId, setDepartmentId] = useState('');
  const [reportType, setReportType] = useState<CulteReportType | ''>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    supabase
      .from('departments')
      .select('id, name')
      .eq('church_id', getChurchId())
      .order('name', { ascending: true })
      .then((res: { data: DeptOption[] | null }) => setDepartments(res.data ?? []));
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CulteReportService.getHistory({
        departmentId: departmentId || undefined,
        reportType: (reportType as CulteReportType) || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setReports(data);
    } catch (error) {
      console.error('Error loading culte reports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  }, [departmentId, reportType, dateRange]);

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel('culte-reports-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'culte_reports' }, () => fetchReports())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  const filteredReports = reports.filter((r) =>
    r.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.submittedByName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    { key: 'serviceDate', title: 'Date', render: (v: string) => v },
    { key: 'departmentName', title: 'Département', render: (v: string) => v },
    {
      key: 'reportType',
      title: 'Type',
      render: (v: CulteReportType) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
          {CULTE_REPORT_TYPE_LABELS[v]}
        </span>
      ),
    },
    { key: 'submittedByName', title: 'Soumis par', render: (v: string) => v },
    { key: 'notes', title: 'Notes', render: (v: string) => v || '-' },
  ];

  const activeFilterCount = [
    departmentId !== '',
    reportType !== '',
    dateRange.startDate !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateRange.endDate !== new Date().toISOString().split('T')[0],
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des rapports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
        <History className="w-6 h-6 text-[#00665C]" /> Historique des rapports de culte
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un département ou un auteur..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-4 h-9 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
        />
      </div>
      <p className="text-xs text-gray-400 -mt-1 px-0.5">
        {filteredReports.length} rapport{filteredReports.length !== 1 ? 's' : ''}
      </p>

      <CollapsibleFilters activeCount={activeFilterCount} storageKey="filters:culte-reports:open">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Département</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]">
            <option value="">Tous</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type de rapport</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as CulteReportType | '')} className="w-full h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-[#00665C] focus:border-[#00665C]">
            <option value="">Tous</option>
            {(Object.keys(CULTE_REPORT_TYPE_LABELS) as CulteReportType[]).map((t) => (
              <option key={t} value={t}>{CULTE_REPORT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </CollapsibleFilters>

      <CustomTable
        data={paginatedReports}
        columns={columns}
        mobileCard={(row: CulteReport) => (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#00665C]/10">
              <span className="text-xs font-bold text-[#00665C]">{row.departmentName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 block truncate">{row.departmentName}</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-gray-400">{row.serviceDate}</span>
                <span className="text-gray-200 text-[10px]">·</span>
                <span className="text-[10px] text-[#00665C] font-medium truncate">{row.submittedByName}</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">{CULTE_REPORT_TYPE_LABELS[row.reportType]}</span>
          </div>
        )}
      />

      {totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredReports.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
    </div>
  );
}
