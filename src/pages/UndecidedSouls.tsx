import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { Soul } from '../types/database.types';
import { Search, AlertTriangle, MessageCircle, RotateCcw } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { CollapsibleFilters } from '../components/ui/CollapsibleFilters';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { formatDate } from '../utils/dateUtils';
import EditSoulModal from '../components/souls/EditSoulModal';
import UndecidedSoulMessageModal from '../components/souls/UndecidedSoulMessageModal.tsx';
import { CustomPagination } from '../components/ui/CustomPagination';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

interface UndecidedSoulsProps {
  /** Masque le titre de page quand affiché sous un onglet (ex: SoulsHub) */
  embedded?: boolean;
}

export default function UndecidedSouls({ embedded = false }: UndecidedSoulsProps = {}) {
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSoul, setEditingSoul] = useState<Soul | null>(null);
  const [messagingSoul, setMessagingSoul] = useState<Soul | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const activeFiltersCount = [
    searchTerm !== '',
    dateRange.startDate !== '' || dateRange.endDate !== '',
    statusFilter !== 'active',
    sortBy !== 'recent',
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearchTerm('');
    setDateRange({ startDate: '', endDate: '' });
    setStatusFilter('active');
    setSortBy('recent');
    setCurrentPage(1);
  };

  // Revenir en page 1 quand un filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange, statusFilter, sortBy]);

  const columns = [
    {
      key: 'fullName',
      title: 'Nom et Prénoms',
      render: (value: string, soul: Soul) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {soul.nickname && (
            <span className="ml-2 text-sm text-gray-500">
              ({soul.nickname})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Téléphone',
      render: (value: string) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      key: 'location',
      title: 'Lieu d\'habitation',
      render: (value: string) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      key: 'firstVisitDate',
      title: 'Date de première visite',
      render: (value: Date) => (
        <span className="text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, soul: Soul) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMessagingSoul(soul);
            }}
            className="p-1 text-[#00665C] hover:bg-[#00665C]/10 rounded"
            title="Envoyer un message"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const fetchSouls = async () => {
    try {
      const { data, error } = await supabase
        .from('souls')
        .select('*')
        .eq('church_id', getChurchId());

      if (error) {
        console.error('Error loading undecided souls:', error);
        toast.error('Erreur lors du chargement des âmes indécises');
        return;
      }

      const soulsData = (data ?? [])
        .map((row: any) => ({
          ...row,
          id: row.id,
          fullName: row.fullName || row.full_name || '',
          phone: row.phone || '',
          location: row.location || '',
          gender: row.gender || 'male',
          isUndecided: row.isUndecided ?? row.is_undecided ?? false,
          wantsToGiveLife: row.wants_to_give_life ?? null,
          wantsToBecomeMember: row.wants_to_become_member ?? null,
          shepherdId: row.shepherdId || row.shepherd_id,
          evangelistId: row.evangelistId || row.evangelist_id,
          status: row.status || 'active',
          photoURL: row.photoURL || row.photo_url,
          firstVisitDate: row.firstVisitDate
            ? new Date(row.firstVisitDate)
            : row.first_visit_date
            ? new Date(row.first_visit_date)
            : undefined,
          createdAt: row.createdAt || row.created_at,
        } as Soul))
        .filter((s: any) => s.isUndecided === true)
        .sort((a: any, b: any) => {
          const aDate = a.createdAt || 0;
          const bDate = b.createdAt || 0;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

      setSouls(soulsData);
    } catch (error) {
      console.error('Error loading undecided souls:', error);
      toast.error('Erreur lors du chargement des âmes indécises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSouls();

    const channel = supabase
      .channel('undecided-souls-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'souls' }, () => {
        fetchSouls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtrer les âmes (recherche + statut + période de première visite), puis trier
  const filteredSouls = souls
    .filter(soul => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (soul.fullName || '').toLowerCase().includes(term) ||
        (soul.phone || '').toLowerCase().includes(term) ||
        (soul.location || '').toLowerCase().includes(term);
      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && soul.status !== statusFilter) return false;

      if (dateRange.startDate || dateRange.endDate) {
        if (!soul.firstVisitDate) return false;
        const visit = new Date(soul.firstVisitDate).getTime();
        if (dateRange.startDate && visit < new Date(dateRange.startDate).getTime()) return false;
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate);
          end.setHours(23, 59, 59, 999);
          if (visit > end.getTime()) return false;
        }
      }
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return (a.fullName || '').localeCompare(b.fullName || '', 'fr');
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  // Pagination
  const totalPages = Math.ceil(filteredSouls.length / ITEMS_PER_PAGE);
  const paginatedSouls = filteredSouls.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des âmes indécises...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {!embedded && (
        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Âmes Indécises</h1>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">À propos des âmes indécises</h3>
            <p className="mt-1 text-sm text-amber-700">
              Les âmes indécises sont des personnes qui ne sont pas encore prêtes à être suivies par un(e) berger(e).
              Elles nécessitent un suivi spécial de l'équipe ADN avant d'être assignées à un(e) berger(e).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <CollapsibleFilters
          activeCount={activeFiltersCount}
          storageKey="filters:undecided-souls:open"
          resetButton={
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] rounded-lg hover:bg-[#00665C] hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser les filtres
            </button>
          }
        >
          <DateRangePicker
            label="Date de première visite"
            value={dateRange}
            onChange={setDateRange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              >
                <option value="active">Actives uniquement</option>
                <option value="inactive">Inactives uniquement</option>
                <option value="all">Toutes les âmes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tri</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              >
                <option value="recent">Plus récentes d'abord</option>
                <option value="name">Nom (A → Z)</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une âme indécise par nom, téléphone ou lieu d'habitation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSouls.length} résultat{filteredSouls.length !== 1 ? 's' : ''} trouvé{filteredSouls.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CollapsibleFilters>

        <CustomTable
          data={paginatedSouls}
          columns={columns}
          mobileCard={(soul: Soul) => (
            <div
              className="flex items-center gap-3 px-4 py-3"
              onClick={() => setEditingSoul(soul)}
            >
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-amber-700">{soul.fullName?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">{soul.fullName}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">Indécis</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{soul.phone || '—'}</span>
                  {soul.firstVisitDate && <><span className="text-gray-300">·</span><span>{formatDate(soul.firstVisitDate)}</span></>}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setMessagingSoul(soul); }}
                className="flex-shrink-0 p-1.5 text-[#00665C] hover:bg-[#00665C]/10 rounded"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          onRowClick={(soul: any) => setEditingSoul(soul)}
        />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredSouls.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>

      {editingSoul && (
        <EditSoulModal
          soul={editingSoul}
          isOpen={!!editingSoul}
          onClose={() => setEditingSoul(null)}
        />
      )}

      {messagingSoul && (
        <UndecidedSoulMessageModal
          soul={messagingSoul}
          isOpen={!!messagingSoul}
          onClose={() => setMessagingSoul(null)}
        />
      )}
    </div>
  );
}
