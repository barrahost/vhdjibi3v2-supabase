import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { formatDate } from '../utils/dateUtils';
import { CustomTable } from '../components/ui/CustomTable';
import { Search, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import { CustomPagination } from '../components/ui/CustomPagination';
import ShepherdFilter from '../components/souls/filters/ShepherdFilter';
import { CollapsibleFilters } from '../components/ui/CollapsibleFilters';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function AttendanceView() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [souls, setSouls] = useState<Record<string, any>>({});
  const [shepherds, setShepherds] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShepherdId, setSelectedShepherdId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const columns = [
    {
      key: 'date',
      title: 'Date',
      render: (value: Date) => (
        <span className="text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'soulId',
      title: 'Ame',
      render: (value: string) => {
        const soul = souls[value];
        return soul ? (
          <div>
            <span className="font-medium text-gray-900">{soul.full_name || soul.fullName}</span>
            <span className="ml-2 text-sm text-gray-500">{soul.phone}</span>
          </div>
        ) : (
          <span className="text-gray-500">Ame inconnue</span>
        );
      }
    },
    {
      key: 'shepherdId',
      title: 'Berger(e)',
      render: (value: string) => {
        const shepherd = shepherds[value];
        return shepherd ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
            {shepherd.fullName}
          </span>
        ) : (
          <span className="text-gray-500">Berger(e) inconnu(e)</span>
        );
      }
    },
    {
      key: 'present',
      title: 'Statut',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Present(e)' : 'Absent(e)'}
        </span>
      )
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value: string) => value || '-'
    }
  ];

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('attendances')
        .select('*')
        .eq('church_id', getChurchId())
        .order('date', { ascending: false });

      if (selectedShepherdId) {
        q = q.eq('shepherd_id', selectedShepherdId);
      } else {
        q = q.gte('date', dateRange.startDate).lte('date', dateRange.endDate);
      }

      const { data, error } = await q;
      if (error) throw error;

      const attendancesData = (data || []).map((row: any) => ({
        ...row,
        soulId: row.soulId || row.soul_id,
        shepherdId: row.shepherdId || row.shepherd_id,
        date: row.date ? new Date(row.date) : null,
      }));

      // Batch load souls and shepherds
      const uniqueSoulIds = [...new Set(attendancesData.map((a: any) => a.soulId).filter(Boolean))] as string[];
      const uniqueShepherdIds = [...new Set(attendancesData.map((a: any) => a.shepherdId).filter(Boolean))] as string[];

      const soulsData: Record<string, any> = {};
      const shepherdsData: Record<string, any> = {};

      if (uniqueSoulIds.length > 0) {
        const { data: soulsResult } = await supabase
          .from('souls')
          .select('id, full_name, phone')
          .eq('church_id', getChurchId())
          .in('id', uniqueSoulIds);
        (soulsResult || []).forEach((s: any) => { soulsData[s.id] = s; });
      }

      if (uniqueShepherdIds.length > 0) {
        const { data: shepherdsResult } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('church_id', getChurchId())
          .in('id', uniqueShepherdIds);
        (shepherdsResult || []).forEach((s: any) => { shepherdsData[s.id] = s; });
      }

      setSouls(soulsData);
      setShepherds(shepherdsData);
      setAttendances(attendancesData);
    } catch (error) {
      console.error('Error loading attendances:', error);
      toast.error('Erreur lors du chargement des presences');
    } finally {
      setLoading(false);
    }
  }, [selectedShepherdId, dateRange]);

  useEffect(() => {
    fetchAttendances();

    const channel = supabase
      .channel('attendances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => {
        fetchAttendances();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAttendances]);

  // Filter attendances
  const filteredAttendances = attendances.filter(attendance => {
    const soul = souls[attendance.soulId];
    if (!soul) return false;
    return (soul.full_name || soul.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredAttendances.length / ITEMS_PER_PAGE);
  const paginatedAttendances = filteredAttendances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des presences...</div>
      </div>
    );
  }

  const activeFilterCount = [
    selectedShepherdId !== null,
    dateRange.startDate !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateRange.endDate !== new Date().toISOString().split('T')[0],
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 sm:space-y-5">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Historique des présences</h1>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher une âme..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-4 h-9 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700"
        />
      </div>
      <p className="text-xs text-gray-400 -mt-1 px-0.5">
        {filteredAttendances.length} présence{filteredAttendances.length !== 1 ? 's' : ''}
      </p>

      {/* Filtres collapsibles */}
      <CollapsibleFilters activeCount={activeFilterCount} storageKey="filters:attendance:open">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-brand-700 focus:border-brand-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full h-9 px-2 text-sm border border-gray-200 rounded-xl focus:ring-brand-700 focus:border-brand-700"
            />
          </div>
        </div>
        <ShepherdFilter value={selectedShepherdId} onChange={setSelectedShepherdId} />
      </CollapsibleFilters>

      {/* Liste */}
      <CustomTable
        data={paginatedAttendances}
        columns={columns}
        mobileCard={(row: any) => {
          const soul = souls[row.soulId];
          const shepherd = shepherds[row.shepherdId];
          const soulName = soul?.full_name || soul?.fullName || 'Âme inconnue';
          const shepherdName = shepherd ? (shepherd.full_name || shepherd.fullName) : null;
          const isPresent = row.present;
          return (
            <div className="flex items-center gap-3 px-3 py-2.5">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPresent ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <span className={`text-xs font-bold ${isPresent ? 'text-green-700' : 'text-red-600'}`}>
                  {soulName.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900 block truncate">{soulName}</span>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <CalendarDays className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  <span className="text-[10px] text-gray-400">{formatDate(row.date)}</span>
                  {shepherdName && (
                    <>
                      <span className="text-gray-200 text-[10px]">·</span>
                      <span className="text-[10px] text-brand-700 font-medium truncate">{shepherdName}</span>
                    </>
                  )}
                </div>
                {row.notes && (
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{row.notes}</p>
                )}
              </div>
              {/* Statut */}
              {isPresent
                ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              }
            </div>
          );
        }}
      />

      {totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredAttendances.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
    </div>
  );
}
