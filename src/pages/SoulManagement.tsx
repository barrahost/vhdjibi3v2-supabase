import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Soul } from '../types/database.types';
import { Plus, FileSpreadsheet, Search, Pencil, Trash2, User as UserIcon, Upload, RotateCcw, UserCheck } from 'lucide-react';
import ImportSoulsModal from '../components/souls/ImportSoulsModal';
import { exportData } from '../utils/exportUtils';
import SoulForm from '../components/souls/SoulForm';
import { CustomTable } from '../components/ui/CustomTable';
import { formatDate } from '../utils/dateUtils';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import { CustomPagination } from '../components/ui/CustomPagination';
import EditSoulModal from '../components/souls/EditSoulModal';
import ShepherdFilter from '../components/souls/filters/ShepherdFilter';
import AssignToShepherdModal from '../components/souls/AssignToShepherdModal';
import PickEvangelizedSoulModal from '../components/evangelizedSouls/PickEvangelizedSoulModal';
import ImportToSoulModal from '../components/evangelizedSouls/ImportToSoulModal';
import { EvangelizedSoul } from '../types/evangelized.types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;
const FILTERS_STORAGE_KEY = 'souls:filters:v1';

type PersistedFilters = {
  searchTerm: string;
  selectedShepherdId: string | null;
  dateRange: { startDate: string; endDate: string };
  statusFilter: 'all' | 'active' | 'inactive';
  sortConfig: { field: keyof Soul; direction: 'asc' | 'desc' };
  currentPage: number;
};

const DEFAULT_FILTERS: PersistedFilters = {
  searchTerm: '',
  selectedShepherdId: null,
  dateRange: { startDate: '', endDate: '' },
  statusFilter: 'active',
  sortConfig: { field: 'fullName' as keyof Soul, direction: 'asc' },
  currentPage: 1,
};

function loadPersistedFilters(): PersistedFilters {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export default function SoulManagement() {
  const initialFilters = loadPersistedFilters();
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [shepherdNames, setShepherdNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedShepherdId, setSelectedShepherdId] = useState<string | null>(initialFilters.selectedShepherdId);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage);
  const [dateRange, setDateRange] = useState(initialFilters.dateRange);
  const [editingSoul, setEditingSoul] = useState<Soul | null>(null);
  const [sortConfig, setSortConfig] = useState(initialFilters.sortConfig);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(initialFilters.statusFilter);
  const [unassignedFamilyOnly, setUnassignedFamilyOnly] = useState(false);

  // Multi-sélection
  const [selectedSoulIds, setSelectedSoulIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPickEvangelizedModal, setShowPickEvangelizedModal] = useState(false);
  const [receivingEvangelizedSoul, setReceivingEvangelizedSoul] = useState<EvangelizedSoul | null>(null);

  const { hasPermission } = usePermissions();
  const { userRole, activeRole } = useAuth();
  const [searchParams] = useSearchParams();

  // Persist filters in sessionStorage
  useEffect(() => {
    try {
      const toSave: PersistedFilters = {
        searchTerm,
        selectedShepherdId,
        dateRange,
        statusFilter,
        sortConfig,
        currentPage,
      };
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore storage errors
    }
  }, [searchTerm, selectedShepherdId, dateRange, statusFilter, sortConfig, currentPage]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedShepherdId !== null ||
    dateRange.startDate !== '' ||
    dateRange.endDate !== '' ||
    statusFilter !== 'active';

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedShepherdId(null);
    setDateRange({ startDate: '', endDate: '' });
    setStatusFilter('active');
    setSortConfig({ field: 'fullName' as keyof Soul, direction: 'asc' });
    setCurrentPage(1);
    setSelectedSoulIds([]);
    try {
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Application des filtres venant de l'URL (one-shot au montage)
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (!filter) return;

    if (filter === 'unassigned') {
      setSelectedShepherdId('unassigned');
      setStatusFilter('active');
    } else if (filter === 'this_month') {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 30);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      setDateRange({ startDate: fmt(start), endDate: fmt(today) });
      setStatusFilter('active');
    } else if (filter === 'unassigned_family') {
      setUnassignedFamilyOnly(true);
      setStatusFilter('active');
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('filter');
      const newSearch = url.searchParams.toString();
      const newUrl = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash;
      window.history.replaceState(window.history.state, '', newUrl);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canImport = ['adn', 'admin', 'super_admin'].includes(
    (activeRole || userRole || '') as string
  );
  const canDelete = userRole === 'super_admin' || hasPermission(PERMISSIONS.MANAGE_SOULS);
  const canAssign = hasPermission(PERMISSIONS.MANAGE_SOULS);

  const loadShepherdNames = useCallback(async (souls: Soul[]) => {
    const shepherdIds = new Set(souls.map(soul => soul.shepherdId).filter(Boolean));
    const names: Record<string, string> = {};
    for (const shepherdId of shepherdIds) {
      if (!shepherdId) continue;
      try {
        const userDoc = await getDoc(doc(db, 'users', shepherdId));
        if (userDoc.exists()) {
          names[shepherdId] = userDoc.data().fullName;
        } else {
          names[shepherdId] = 'Berger non trouvé';
        }
      } catch (error) {
        console.error('Error loading shepherd name:', error);
        names[shepherdId] = 'Erreur de chargement';
      }
    }
    setShepherdNames(names);
  }, []);

  useEffect(() => {
    loadShepherdNames(souls);
  }, [souls, loadShepherdNames]);

  // Gestion de la sélection
  const toggleSoulSelection = (soulId: string) => {
    setSelectedSoulIds(prev =>
      prev.includes(soulId) ? prev.filter(id => id !== soulId) : [...prev, soulId]
    );
  };

  const toggleSelectAllOnPage = (paginatedSouls: Soul[]) => {
    const pageIds = paginatedSouls.map(s => s.id);
    const allSelected = pageIds.every(id => selectedSoulIds.includes(id));
    if (allSelected) {
      setSelectedSoulIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedSoulIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const columns = (paginatedSouls: Soul[]) => {
    const pageIds = paginatedSouls.map(s => s.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedSoulIds.includes(id));

    return [
      ...(canAssign ? [{
        key: 'checkbox',
        title: (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C] cursor-pointer"
            checked={allPageSelected}
            onChange={() => toggleSelectAllOnPage(paginatedSouls)}
            title="Tout sélectionner sur cette page"
          />
        ),
        render: (_: any, soul: Soul) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C] cursor-pointer"
            checked={selectedSoulIds.includes(soul.id)}
            onChange={() => toggleSoulSelection(soul.id)}
            onClick={e => e.stopPropagation()}
          />
        ),
      }] : []),
      {
        key: 'photoURL',
        title: 'Photo',
        render: (value: string | null) => (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {value ? (
              <img
                src={value}
                alt="Photo de profil"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=?';
                }}
              />
            ) : (
              <UserIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )
      },
      {
        key: 'fullName',
        title: 'Nom et Prénoms',
        render: (value: string, soul: Soul) => (
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            {soul.isUndecided && (
              <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Indécis(e)
              </span>
            )}
            {soul.nickname && (
              <span className="ml-2 text-sm text-gray-500">({soul.nickname})</span>
            )}
          </div>
        )
      },
      {
        key: 'phone',
        title: 'Téléphone',
        render: (value: string) => <span className="text-gray-600">{value}</span>
      },
      {
        key: 'location',
        title: "Lieu d'habitation",
        render: (value: string) => <span className="text-gray-600">{value}</span>
      },
      {
        key: 'firstVisitDate',
        title: 'Date de première visite',
        render: (value: Date) => <span className="text-gray-600">{formatDate(value)}</span>
      },
      {
        key: 'shepherdId',
        title: 'Berger(e)',
        render: (value: string | null) => {
          if (!value) return <span className="text-gray-600">-</span>;
          return <span className="text-gray-900">{shepherdNames[value] || 'Chargement...'}</span>;
        }
      },
      {
        key: 'actions',
        title: 'Actions',
        render: (_: any, soul: Soul) => (
          <div className="flex justify-end space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); setEditingSoul(soul); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(soul.id); }}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
      {
        key: 'status',
        title: 'Statut',
        render: (_: any, soul: Soul) => (
          soul.shepherdId ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
              Assigné(e)
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Non assigné(e)
            </span>
          )
        )
      }
    ];
  };

  const handleDelete = async (soulId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette âme ?')) {
      try {
        await deleteDoc(doc(db, 'souls', soulId));
        toast.success('Âme supprimée avec succès');
      } catch (error) {
        console.error('Error deleting soul:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  useEffect(() => {
    let baseQuery;

    if (selectedShepherdId === 'unassigned') {
      baseQuery = query(
        collection(db, 'souls'),
        where('shepherdId', '==', null),
        orderBy('createdAt', 'desc')
      );
    } else if (selectedShepherdId) {
      baseQuery = query(
        collection(db, 'souls'),
        where('shepherdId', '==', selectedShepherdId),
        orderBy('createdAt', 'desc')
      );
    } else {
      baseQuery = query(collection(db, 'souls'), orderBy('createdAt', 'desc'));
    }

    if (statusFilter !== 'all') {
      if (selectedShepherdId === 'unassigned') {
        baseQuery = query(
          collection(db, 'souls'),
          where('status', '==', statusFilter),
          where('shepherdId', '==', null),
          orderBy('createdAt', 'desc')
        );
      } else if (selectedShepherdId) {
        baseQuery = query(
          collection(db, 'souls'),
          where('status', '==', statusFilter),
          where('shepherdId', '==', selectedShepherdId),
          orderBy('createdAt', 'desc')
        );
      } else {
        baseQuery = query(
          collection(db, 'souls'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }
    }

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const soulsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        firstVisitDate: doc.data().firstVisitDate?.toDate()
      } as Soul));
      setSouls(soulsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading souls:', error);
      toast.error('Erreur lors du chargement des âmes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedShepherdId, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

  // Réinitialiser la sélection quand on change de page ou de filtres
  useEffect(() => {
    setSelectedSoulIds([]);
  }, [currentPage, searchTerm, selectedShepherdId, statusFilter]);

  const filteredSouls = souls.filter(soul =>
    soul.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soul.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soul.location.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(soul => {
    if (dateRange.startDate && soul.firstVisitDate) {
      const startDate = new Date(dateRange.startDate);
      const soulDate = new Date(soul.firstVisitDate);
      if (soulDate < startDate) return false;
    }
    if (dateRange.endDate && soul.firstVisitDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setDate(endDate.getDate() + 1);
      const soulDate = new Date(soul.firstVisitDate);
      if (soulDate > endDate) return false;
    }
    if (unassignedFamilyOnly && (soul as any).serviceFamilyId) return false;
    return true;
  });

  const sortedSouls = [...filteredSouls].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;
    switch (field) {
      case 'firstVisitDate':
        return (new Date(a[field]).getTime() - new Date(b[field]).getTime()) * modifier;
      default:
        return String(a[field]).localeCompare(String(b[field])) * modifier;
    }
  });

  const totalPages = Math.ceil(sortedSouls.length / ITEMS_PER_PAGE);
  const paginatedSouls = sortedSouls.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des âmes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Âmes</h1>
        <div className="flex items-center space-x-3">
          {hasPermission(PERMISSIONS.EXPORT_DATA) && (
            <button
              onClick={() => exportData({ data: sortedSouls, type: 'souls', format: 'xlsx' })}
              className="flex items-center px-3 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </button>
          )}
          {canImport && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] hover:bg-[#00665C]/10 rounded-md"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer Excel
            </button>
          )}
          {canImport && (
            <button
              onClick={() => setShowPickEvangelizedModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#F2B636] hover:bg-[#F2B636]/90 rounded-md"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Recevoir une âme évangélisée
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Masquer le formulaire' : 'Ajouter une âme'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-[#00665C] mb-4">Ajouter une âme</h2>
          <SoulForm />
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de première visite (début)
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de première visite (fin)
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
          </div>

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

          <ShepherdFilter value={selectedShepherdId} onChange={setSelectedShepherdId} />

          {unassignedFamilyOnly && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-900">
              <span>Filtre actif : âmes sans famille de service</span>
              <button
                onClick={() => setUnassignedFamilyOnly(false)}
                className="text-amber-900 hover:underline font-medium"
              >
                Retirer
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Réinitialiser les dates
            </button>
          </div>

          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une âme par nom, téléphone ou lieu d'habitation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] rounded-lg hover:bg-[#00665C] hover:text-white transition-colors whitespace-nowrap"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSouls.length} résultat{filteredSouls.length !== 1 ? 's' : ''} trouvé{filteredSouls.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Barre d'actions contextuelle (sélection multiple) */}
        {canAssign && selectedSoulIds.length > 0 && (
          <div className="flex items-center justify-between bg-[#00665C]/5 border border-[#00665C]/30 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-[#00665C]">
              {selectedSoulIds.length} âme{selectedSoulIds.length > 1 ? 's' : ''} sélectionnée{selectedSoulIds.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSoulIds([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Désélectionner tout
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Assigner à un berger
              </button>
            </div>
          </div>
        )}

        <CustomTable
          data={paginatedSouls}
          columns={columns(paginatedSouls)}
        />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedSouls.length}
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

      <ImportSoulsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      <AssignToShepherdModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        soulIds={selectedSoulIds}
        onSuccess={() => setSelectedSoulIds([])}
      />

      <PickEvangelizedSoulModal
        isOpen={showPickEvangelizedModal}
        onClose={() => setShowPickEvangelizedModal(false)}
        onSelect={(soul) => setReceivingEvangelizedSoul(soul)}
      />

      {receivingEvangelizedSoul && (
        <ImportToSoulModal
          soul={receivingEvangelizedSoul}
          isOpen={!!receivingEvangelizedSoul}
          onClose={() => setReceivingEvangelizedSoul(null)}
          onImported={() => setReceivingEvangelizedSoul(null)}
        />
      )}
    </div>
  );
}
