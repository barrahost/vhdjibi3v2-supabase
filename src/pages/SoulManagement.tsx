import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { Soul } from '../types/database.types';
import { Plus, FileSpreadsheet, Search, Pencil, Trash2, User as UserIcon, Upload, RotateCcw, UserCheck, Shield, MoreVertical } from 'lucide-react';
import ImportSoulsModal from '../components/souls/ImportSoulsModal';
import { exportData } from '../utils/exportUtils';
import SoulForm from '../components/souls/SoulForm';
import { CustomTable } from '../components/ui/CustomTable';
import { formatDate } from '../utils/dateUtils';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import { CustomPagination } from '../components/ui/CustomPagination';
import { CollapsibleFilters } from '../components/ui/CollapsibleFilters';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import EditSoulModal from '../components/souls/EditSoulModal';
import PromoteToServantModal from '../components/souls/PromoteToServantModal';
import ShepherdFilter from '../components/souls/filters/ShepherdFilter';
import AssignToShepherdModal from '../components/souls/AssignToShepherdModal';
import PickEvangelizedSoulModal from '../components/evangelizedSouls/PickEvangelizedSoulModal';
import AdnCulteLinksBar from '../components/souls/AdnCulteLinksBar';
import ImportToSoulModal from '../components/evangelizedSouls/ImportToSoulModal';
import { EvangelizedSoul } from '../types/evangelized.types';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser, isADNUser } from '../utils/roleHelpers';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { Modal } from '../components/ui/Modal';

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
  dateRange: (() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: fmt(start), endDate: fmt(end) };
  })(),
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

interface SoulManagementProps {
  /** Masque le titre de page quand affiché sous un onglet (ex: SoulsHub) */
  embedded?: boolean;
}

export default function SoulManagement({ embedded = false }: SoulManagementProps = {}) {
  const initialFilters = loadPersistedFilters();
  const { confirm, confirmModalProps } = useConfirmModal();
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
  const [promotingSoul, setPromotingSoul] = useState<Soul | null>(null);
  const [sortConfig, setSortConfig] = useState(initialFilters.sortConfig);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(initialFilters.statusFilter);
  const [unassignedFamilyOnly, setUnassignedFamilyOnly] = useState(false);

  // Multi-selection
  const [selectedSoulIds, setSelectedSoulIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPickEvangelizedModal, setShowPickEvangelizedModal] = useState(false);
  const [newSoulInitialName, setNewSoulInitialName] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [selectedCulteEvent, setSelectedCulteEvent] = useState<{ id: string; label: string } | null>(null);
  const [receivingEvangelizedSoul, setReceivingEvangelizedSoul] = useState<EvangelizedSoul | null>(null);

  const { hasPermission } = usePermissions();
  const { user, userRole } = useAuth();
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

  const isDefaultMonth = (() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return dateRange.startDate === s && dateRange.endDate === e;
  })();
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedShepherdId !== null ||
    !isDefaultMonth ||
    statusFilter !== 'active';
  const activeFiltersCount = [
    searchTerm !== '',
    selectedShepherdId !== null,
    !isDefaultMonth,
    statusFilter !== 'active',
    unassignedFamilyOnly,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedShepherdId(null);
    const _now = new Date();
    const _start = new Date(_now.getFullYear(), _now.getMonth(), 1);
    const _end = new Date(_now.getFullYear(), _now.getMonth() + 1, 0);
    const _fmt = (d: Date) => d.toISOString().split('T')[0];
    setDateRange({ startDate: _fmt(_start), endDate: _fmt(_end) });
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

  // Apply URL filters (one-shot on mount)
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
      const newUrl = url.pathname + (newSearch ? '?' + newSearch : '') + url.hash;
      window.history.replaceState(window.history.state, '', newUrl);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toutes les casquettes détenues comptent (plus de bascule de profil)
  const canImport = isAdminUser({ role: userRole as string, businessProfiles: (user as any)?.businessProfiles })
    || isADNUser({ role: userRole as string, businessProfiles: (user as any)?.businessProfiles });
  const canDelete = userRole === 'super_admin' || hasPermission(PERMISSIONS.MANAGE_SOULS);
  const canAssign = hasPermission(PERMISSIONS.MANAGE_SOULS);

  const loadShepherdNames = useCallback(async (souls: Soul[]) => {
    const shepherdIds = [...new Set(souls.map(soul => soul.shepherdId).filter(Boolean))] as string[];
    if (shepherdIds.length === 0) {
      setShepherdNames({});
      return;
    }
    const names: Record<string, string> = {};
    try {
      // Match by Supabase id (new assignments) AND by uid (migrated Firestore data)
      const { data: byId } = await supabase
        .from('users')
        .select('id, uid, full_name')
        .eq('church_id', getChurchId())
        .eq('church_id', getChurchId())
        .in('id', shepherdIds);
      (byId || []).forEach((u: any) => {
        if (u.full_name) {
          names[u.id] = u.full_name;
          if (u.uid) names[u.uid] = u.full_name; // also map by Firebase UID
        }
      });
      // For shepherd_ids not matched by Supabase UUID, try matching by uid column
      const unmatchedIds = shepherdIds.filter(sid => !names[sid]);
      if (unmatchedIds.length > 0) {
        const { data: byUid } = await supabase
          .from('users')
          .select('id, uid, full_name')
          .eq('church_id', getChurchId())
          .eq('church_id', getChurchId())
          .in('uid', unmatchedIds);
        (byUid || []).forEach((u: any) => {
          if (u.full_name) {
            names[u.id] = u.full_name;
            if (u.uid) names[u.uid] = u.full_name;
          }
        });
      }
    } catch (error) {
      console.error('Error loading shepherd names:', error);
    }
    setShepherdNames(names);
  }, []);

  useEffect(() => {
    loadShepherdNames(souls);
  }, [souls, loadShepherdNames]);

  // Selection handlers
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
            title="Tout selectionner sur cette page"
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
        title: 'Nom et Prenoms',
        render: (value: string, soul: Soul) => (
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            {soul.isUndecided && (
              <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Indecis(e)
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
        title: 'Telephone',
        render: (value: string) => <span className="text-gray-600">{value}</span>
      },
      {
        key: 'location',
        title: "Lieu d'habitation",
        render: (value: string) => <span className="text-gray-600">{value}</span>
      },
      {
        key: 'firstVisitDate',
        title: 'Date de premiere visite',
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
            {soul.spiritualProfile?.isBornAgain && soul.spiritualProfile?.isBaptized && (
              <button
                onClick={(e) => { e.stopPropagation(); setPromotingSoul(soul); }}
                className="p-1 text-[#00665C] hover:bg-[#00665C]/10 rounded transition-colors"
                title="Promouvoir en B.O.S.S"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
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
              Assigne(e)
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Non assigne(e)
            </span>
          )
        )
      }
    ];
  };

  const handleDelete = async (soulId: string) => {
    if (await confirm('Etes-vous sur de vouloir supprimer cette ame ?')) {
      try {
        const { error } = await supabase.from('souls').delete().eq('id', soulId);
        if (error) throw error;
        setSouls(prev => prev.filter(s => s.id !== soulId));
        toast.success('Ame supprimee avec succes');
      } catch (error) {
        console.error('Error deleting soul:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSoulIds.length === 0) return;
    const count = selectedSoulIds.length;
    const confirmed = await confirm(
      `Etes-vous sur de vouloir supprimer definitivement ${count} ame${count > 1 ? 's' : ''} ? Cette action est irreversible.`
    );
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('souls').delete().in('id', selectedSoulIds);
      if (error) throw error;
      setSouls(prev => prev.filter(s => !selectedSoulIds.includes(s.id)));
      setSelectedSoulIds([]);
      toast.success(`${count} ame${count > 1 ? 's' : ''} supprimee${count > 1 ? 's' : ''} avec succes`);
    } catch (error) {
      console.error('Error bulk deleting souls:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const fetchSouls = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('souls').select('*').eq('church_id', getChurchId()).order('created_at', { ascending: false });

      if (selectedShepherdId === 'unassigned') {
        q = q.is('shepherd_id', null);
      } else if (selectedShepherdId) {
        // Look up the shepherd's uid too (migrated souls may use Firebase UID)
        try {
          const { data: sUser } = await supabase
            .from('users')
            .select('id, uid')
            .eq('church_id', getChurchId())
            .eq('church_id', getChurchId())
            .eq('id', selectedShepherdId)
            .limit(1)
            .single();
          if (sUser?.uid && sUser.uid !== sUser.id) {
            // Filter by Supabase id OR Firebase uid
            (q as any) = (q as any).or(`shepherd_id.eq.${sUser.id},shepherd_id.eq.${sUser.uid}`);
          } else {
            q = q.eq('shepherd_id', selectedShepherdId);
          }
        } catch {
          q = q.eq('shepherd_id', selectedShepherdId);
        }
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          // Include souls with status='active' OR null status (migrated data may lack status)
          (q as any) = (q as any).or('status.eq.active,status.is.null');
        } else {
          q = q.eq('status', statusFilter);
        }
      }

      const { data, error } = await q;
      if (error) throw error;

      const soulsData: Soul[] = (data || [])
        .filter((row: any) => !row.is_servant && !row.is_undecided)
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
          spiritualProfile: row.spiritual_profile || row.spiritualProfile || {},
          email: row.email ?? undefined,
          profession: row.profession ?? undefined,
          attendedCommunity: row.attended_community ?? undefined,
          isRegular: row.is_regular ?? null,
          ageRange: row.age_range ?? undefined,
          maritalStatus: row.marital_status ?? undefined,
          decision: row.decision ?? undefined,
          wantsToGiveLife: row.wants_to_give_life ?? null,
          wantsToBecomeMember: row.wants_to_become_member ?? null,
          prayerRequest: row.prayer_request ?? undefined,
        } as Soul));
      setSouls(soulsData);
    } catch (error) {
      console.error('Error loading souls:', error);
      toast.error('Erreur lors du chargement des ames');
    } finally {
      setLoading(false);
    }
  }, [selectedShepherdId, statusFilter]);

  useEffect(() => {
    fetchSouls();

    const channel = supabase
      .channel('souls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'souls' }, () => {
        fetchSouls();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSouls]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

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
        <div className="text-gray-500">Chargement des ames...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {!embedded && <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Gestion des Ames</h1>}
        <div className={`flex items-center gap-1.5 ${embedded ? 'sm:ml-auto' : ''}`}>
          <button
            onClick={() => { setSelectedCulteEvent(null); canImport ? setShowPickEvangelizedModal(true) : setShowForm(true); }}
            className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Ajouter
          </button>

          {/* Actions avancées (Export/Import) — repliées par défaut */}
          {(hasPermission(PERMISSIONS.EXPORT_DATA) || canImport) && (
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(v => !v)}
                className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                title="Plus d'actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMoreActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMoreActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border z-20 py-1">
                    {hasPermission(PERMISSIONS.EXPORT_DATA) && (
                      <button
                        onClick={() => { exportData({ data: sortedSouls, type: 'souls', format: 'xlsx' }); setShowMoreActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#00665C]" /> Exporter Excel
                      </button>
                    )}
                    {canImport && (
                      <button
                        onClick={() => { setShowImportModal(true); setShowMoreActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4 text-[#00665C]" /> Importer Excel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {canImport && (
        <AdnCulteLinksBar
          onSelect={(eventId, label) => {
            setSelectedCulteEvent({ id: eventId, label });
            setShowPickEvangelizedModal(true);
          }}
        />
      )}

      {selectedCulteEvent && (
        <div className="flex items-center justify-between gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-700">
          <span>Ajout rattaché à : <strong>{selectedCulteEvent.label}</strong></span>
          <button onClick={() => setSelectedCulteEvent(null)} className="text-xs font-medium hover:underline">Retirer</button>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setNewSoulInitialName(''); setSelectedCulteEvent(null); }}
        title="Ajouter une âme"
      >
        <SoulForm
          onClose={() => { setShowForm(false); setNewSoulInitialName(''); setSelectedCulteEvent(null); }}
          initialFullName={newSoulInitialName}
          eventId={selectedCulteEvent?.id ?? null}
        />
      </Modal>

      <div className="space-y-4">
        <CollapsibleFilters
          activeCount={activeFiltersCount}
          storageKey="filters:souls:open"
          resetButton={
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] rounded-lg hover:bg-[#00665C] hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reinitialiser les filtres
            </button>
          }
        >

          <DateRangePicker
            label="Date de première visite"
            value={dateRange}
            onChange={setDateRange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="active">Actives uniquement</option>
              <option value="inactive">Inactives uniquement</option>
              <option value="all">Toutes les ames</option>
            </select>
          </div>

          <ShepherdFilter value={selectedShepherdId} onChange={setSelectedShepherdId} />

          {unassignedFamilyOnly && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-900">
              <span>Filtre actif : ames sans famille de service</span>
              <button
                onClick={() => setUnassignedFamilyOnly(false)}
                className="text-amber-900 hover:underline font-medium"
              >
                Retirer
              </button>
            </div>
          )}



          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une ame par nom, telephone ou lieu d'habitation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
                />
              </div>

            </div>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSouls.length} resultat{filteredSouls.length !== 1 ? 's' : ''} trouve{filteredSouls.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CollapsibleFilters>

        {canAssign && selectedSoulIds.length > 0 && (
          <div className="flex items-center justify-between bg-[#00665C]/5 border border-[#00665C]/30 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-[#00665C]">
              {selectedSoulIds.length} ame{selectedSoulIds.length > 1 ? 's' : ''} selectionnee{selectedSoulIds.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSoulIds([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Deselectionner tout
              </button>
              {userRole === 'super_admin' && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer la selection
                </button>
              )}
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Assigner a un berger
              </button>
            </div>
          </div>
        )}

        <CustomTable
          data={paginatedSouls}
          columns={columns(paginatedSouls)}
          mobileCard={(soul: Soul) => (
            <div
              className="flex items-center gap-3 px-4 py-3"
              onClick={() => setEditingSoul(soul)}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {soul.photoURL
                  ? <img src={soul.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-brand-700">{soul.fullName?.charAt(0)?.toUpperCase() || '?'}</span>
                }
              </div>

              {/* Info principale */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">{soul.fullName}</span>
                  {soul.isUndecided && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">Indécis</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{soul.phone || '—'}</span>
                  <span className="text-gray-300">·</span>
                  <span>{formatDate(soul.firstVisitDate)}</span>
                </div>
                {soul.shepherdId && shepherdNames[soul.shepherdId] && (
                  <p className="text-xs text-brand-700 mt-0.5 truncate">{shepherdNames[soul.shepherdId]}</p>
                )}
              </div>

              {/* Indicateur statut + action */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${soul.shepherdId ? 'bg-brand-700' : 'bg-gray-300'}`} />
                <Pencil className="w-3.5 h-3.5 text-gray-300" />
              </div>
            </div>
          )}
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

      {promotingSoul && (
        <PromoteToServantModal
          isOpen={!!promotingSoul}
          onClose={() => setPromotingSoul(null)}
          soul={promotingSoul}
          onSuccess={() => { setPromotingSoul(null); fetchSouls(); }}
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
        onCreateNew={(name) => { setNewSoulInitialName(name); setShowForm(true); }}
        showEmergencyWarning={!selectedCulteEvent}
      />

      {receivingEvangelizedSoul && (
        <ImportToSoulModal
          soul={receivingEvangelizedSoul}
          isOpen={!!receivingEvangelizedSoul}
          onClose={() => { setReceivingEvangelizedSoul(null); setSelectedCulteEvent(null); }}
          onImported={() => { setReceivingEvangelizedSoul(null); setSelectedCulteEvent(null); }}
          eventId={selectedCulteEvent?.id ?? null}
        />
      )}

      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
