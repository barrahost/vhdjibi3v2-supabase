import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, HandHeart, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { PrayerRequestService, PrayerRequest, PRAYER_CATEGORIES } from '../services/prayerRequest.service';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { DateRangePicker, DateRange } from '../components/ui/DateRangePicker';
import { exportPrayerRequests } from '../utils/export/prayerRequests';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';

const ITEMS_PER_PAGE = 10;

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Déblocage Spirituel': 'bg-purple-100 text-purple-700',
  'Déblocage Familial': 'bg-blue-100 text-blue-700',
  'Déblocage Professionnel': 'bg-amber-100 text-amber-700',
  'Déblocage Financier': 'bg-green-100 text-green-700',
  'Déblocage Santé': 'bg-red-100 text-red-700',
  'Autre': 'bg-gray-100 text-gray-700',
};

export default function PrayerRequestsManagement() {
  const { hasPermission } = usePermissions();
  const { confirm, confirmModalProps } = useConfirmModal();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PrayerRequestService.getAllRequests();
      setRequests(data);
    } catch {
      toast.error('Erreur lors du chargement des sujets de prière');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('prayer-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleDelete = async (id: string) => {
    if (await confirm('Supprimer ce sujet de prière ?')) {
      try {
        await PrayerRequestService.deleteRequest(id);
        setRequests(prev => prev.filter(r => r.id !== id));
        toast.success('Sujet supprimé');
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filtered = requests
    .filter(r => categoryFilter === 'all' || r.category === categoryFilter)
    .filter(r => r.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(r => !dateRange.startDate || toDateStr(r.submittedAt) >= dateRange.startDate)
    .filter(r => !dateRange.endDate || toDateStr(r.submittedAt) <= dateRange.endDate);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Aucun sujet à exporter');
      return;
    }
    exportPrayerRequests(filtered);
    toast.success('Export généré');
  };

  const columns = [
    {
      key: 'category',
      title: 'Catégorie',
      render: (value: string) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[value] ?? 'bg-gray-100 text-gray-700'}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'subject',
      title: 'Sujet',
      render: (value: string) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'submittedAt',
      title: 'Soumis le',
      render: (value: Date) => value.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, r: PrayerRequest) => (
        <div className="flex justify-end">
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (r: PrayerRequest) => (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-gray-100 text-gray-700'}`}>
            {r.category}
          </span>
          <p className="text-sm text-gray-700 mt-2">{r.subject}</p>
          <p className="text-xs text-gray-400 mt-1">
            {r.submittedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => handleDelete(r.id)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des sujets de prière...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ConfirmModal {...confirmModalProps} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Chaîne de prière</h1>
          <p className="text-sm text-gray-400">{requests.length} sujet{requests.length !== 1 ? 's' : ''}</p>
        </div>
        {hasPermission(PERMISSIONS.EXPORT_DATA) && (
          <button
            onClick={handleExport}
            className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm font-medium sm:px-4 sm:py-2 text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/10 self-start"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Exporter ({filtered.length})
          </button>
        )}
      </div>

      {/* Filtres catégorie */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'all' ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous ({requests.length})
        </button>
        {PRAYER_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === cat ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtre par date */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} label="Date de soumission" />
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher dans les sujets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <CustomTable data={paginated} columns={columns} mobileCard={renderMobileCard} />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <HandHeart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun sujet de prière trouvé</p>
        </div>
      )}
    </div>
  );
}
