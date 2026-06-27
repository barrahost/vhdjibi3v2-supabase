import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { Soul } from '../types/database.types';
import { Search, AlertTriangle, MessageCircle } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { formatDate } from '../utils/dateUtils';
import EditSoulModal from '../components/souls/EditSoulModal';
import UndecidedSoulMessageModal from '../components/souls/UndecidedSoulMessageModal.tsx';
import { CustomPagination } from '../components/ui/CustomPagination';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function UndecidedSouls() {
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSoul, setEditingSoul] = useState<Soul | null>(null);
  const [messagingSoul, setMessagingSoul] = useState<Soul | null>(null);

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
        .eq('church_id', getChurchId())
        .eq('status', 'active');

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

  // Filtrer les âmes
  const filteredSouls = souls.filter(soul =>
    (soul.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (soul.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (soul.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-between items-center">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Âmes Indécises</h1>
      </div>

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une âme indécise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <CustomTable
          data={paginatedSouls}
          columns={columns}
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
