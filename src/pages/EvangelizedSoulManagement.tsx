import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDocs, orderBy, getDoc, writeBatch } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import { Plus, FileSpreadsheet, Search, Pencil, Trash2, RotateCcw, Megaphone, Info, CheckCircle2, Download, Phone, UserCheck, UserX, Shuffle, AlertTriangle } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { formatDate, formatDateForExcel } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser, isADNUser, isEvangelistUser } from '../utils/roleHelpers';
import EvangelizedSoulForm from '../components/evangelizedSouls/EvangelizedSoulForm';
import EditEvangelizedSoulModal from '../components/evangelizedSouls/EditEvangelizedSoulModal';
import ImportToSoulModal from '../components/evangelizedSouls/ImportToSoulModal';
import DownloadTemplateButton from '../components/evangelizedSouls/DownloadTemplateButton';
import ImportEvangelizedSoulsFromExcel from '../components/evangelizedSouls/ImportEvangelizedSoulsFromExcel';
import InteractionModal from '../components/interactions/InteractionModal';
import LastContactBadge from '../components/interactions/LastContactBadge';
import AssignToEvangelistModal from '../components/evangelizedSouls/AssignToEvangelistModal';
import DistributeEvangelizedSoulsModal from '../components/evangelizedSouls/DistributeEvangelizedSoulsModal';
import { EvangelizedSoul, plannedServiceLabel, gaveLifeLabel } from '../types/evangelized.types';
import { formatGender } from '../utils/formatting/genderFormat';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function EvangelizedSoulManagement() {
  const { user, userRole, activeRole } = useAuth();
  const [souls, setSouls] = useState<EvangelizedSoul[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EvangelizedSoul | null>(null);
  const [importing, setImporting] = useState<EvangelizedSoul | null>(null);
  const [interactingSoul, setInteractingSoul] = useState<EvangelizedSoul | null>(null);
  const [lastContactMap, setLastContactMap] = useState<Map<string, Date>>(new Map());
  const [evangelistNames, setEvangelistNames] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [importFilter, setImportFilter] = useState<'pending' | 'imported' | 'all'>('pending');
  const [attributionFilter, setAttributionFilter] = useState<'all' | 'unassigned'>('all');
  const [evangelistFilter, setEvangelistFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSoulIds, setSelectedSoulIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // N'utiliser que le profil ACTIF pour les vérifications de rôle
  // (évite qu'un utilisateur multi-profils soit traité comme ADN quand il est en mode Évangéliste)
  const activeProfileType = (activeRole || userRole) as string;
  const activeBusinessProfiles = ((user as any)?.businessProfiles || []).filter(
    (p: any) => p?.type === activeProfileType
  );
  const roleForCheck = { role: activeProfileType, businessProfiles: activeBusinessProfiles };
  const isAdmin = isAdminUser(roleForCheck);
  const isADN = isADNUser(roleForCheck);
  const isEvangelist = isEvangelistUser(roleForCheck);

  const canImportToSouls = isAdmin || isADN; // Réservé ADN/Admin uniquement
  const canCreateEvangelized = isAdmin || isADN || isEvangelist;
  const canAssignEvangelist = isAdmin || isADN;
  const userId = user ? (user as any).id || (user as any).uid : null;
  const handleBulkDelete = async () => {
    if (selectedSoulIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const BATCH_LIMIT = 400;
      for (let i = 0; i < selectedSoulIds.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        selectedSoulIds.slice(i, i + BATCH_LIMIT).forEach(id => {
          batch.delete(doc(db, 'evangelized_souls', id));
        });
        await batch.commit();
      }
      toast.success(`${selectedSoulIds.length} âme${selectedSoulIds.length > 1 ? 's' : ''} supprimée${selectedSoulIds.length > 1 ? 's' : ''}`);
      setSelectedSoulIds([]);
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setBulkDeleting(false);
    }
  };

  const unassignedCount = souls.filter(s => !(s as any).evangelistId).length;

  // Charger les noms des évangélistes
  const loadEvangelistNames = useCallback(async (souls: EvangelizedSoul[]) => {
    const ids = new Set(souls.map(s => s.evangelistId).filter(Boolean));
    const names: Record<string, string> = {};
    for (const id of ids) {
      if (!id) continue;
      try {
        const snap = await getDoc(doc(db, 'users', id));
        names[id] = snap.exists() ? snap.data().fullName : 'Évangéliste introuvable';
      } catch {
        names[id] = 'Erreur';
      }
    }
    setEvangelistNames(names);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const constraints: any[] = [];
    if (!isAdmin && !isADN) {
      // Pour les évangélistes : une seule condition d'égalité (pas besoin d'index composite)
      // Le filtre de statut est appliqué côté client uniquement
      constraints.push(where('evangelistId', '==', userId));
    } else {
      // Pour admins/ADN : filtre status côté Firestore pour les perfs
      if (statusFilter !== 'all') constraints.push(where('status', '==', statusFilter));
    }
    const q = query(collection(db, 'evangelized_souls'), ...constraints);
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => {
          const v = d.data() as any;
          return {
            id: d.id, ...v,
            evangelizationDate: v.evangelizationDate?.toDate?.() ?? v.evangelizationDate,
            createdAt: v.createdAt?.toDate?.() ?? v.createdAt,
            updatedAt: v.updatedAt?.toDate?.() ?? v.updatedAt,
          } as EvangelizedSoul;
        });
        const sorted = data.sort((a, b) => {
          const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bT - aT;
        });
        setSouls(sorted);
        setLoading(false);
        loadEvangelistNames(sorted);
      },
      (err) => { console.error(err); toast.error('Erreur lors du chargement'); setLoading(false); }
    );
    return () => unsub();
  }, [userId, isAdmin, isADN, statusFilter, loadEvangelistNames]);

  useEffect(() => setCurrentPage(1), [searchTerm, dateRange, statusFilter, importFilter, attributionFilter, evangelistFilter]);
  useEffect(() => setSelectedSoulIds([]), [currentPage, searchTerm, statusFilter, importFilter, attributionFilter, evangelistFilter]);

  const loadLastContacts = async (soulIds: string[]) => {
    const map = new Map<string, Date>();
    for (let i = 0; i < soulIds.length; i += 10) {
      const batch = soulIds.slice(i, i + 10);
      try {
        const q = query(collection(db, 'interactions'), where('soulId', 'in', batch), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          const data = d.data() as any;
          const dt: Date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
          if (!map.has(data.soulId) || map.get(data.soulId)!.getTime() < dt.getTime()) map.set(data.soulId, dt);
        });
      } catch (e) { console.error(e); }
    }
    setLastContactMap(map);
  };

  useEffect(() => {
    if (souls.length === 0) { setLastContactMap(new Map()); return; }
    loadLastContacts(souls.map(s => s.id));
  }, [souls]);

  const filtered = souls.filter(s => {
    const isImported = !!s.importedToSoulId || s.status === 'imported';
    if (importFilter === 'pending' && isImported) return false;
    if (importFilter === 'imported' && !isImported) return false;
    if (attributionFilter === 'unassigned' && s.evangelistId) return false;
    if (evangelistFilter && (s as any).evangelistId !== evangelistFilter) return false;
    const term = searchTerm.toLowerCase();
    if (term && !s.fullName.toLowerCase().includes(term) &&
        !(s.phone || '').toLowerCase().includes(term) &&
        !(s.location || '').toLowerCase().includes(term)) return false;
    if (dateRange.startDate && s.evangelizationDate && new Date(s.evangelizationDate) < new Date(dateRange.startDate)) return false;
    if (dateRange.endDate && s.evangelizationDate) {
      const end = new Date(dateRange.endDate); end.setDate(end.getDate() + 1);
      if (new Date(s.evangelizationDate) > end) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasActiveFilters = searchTerm !== '' || dateRange.startDate !== '' || dateRange.endDate !== '' ||
    statusFilter !== 'active' || importFilter !== 'pending' || attributionFilter !== 'all' || evangelistFilter !== '';

  const resetFilters = () => {
    setSearchTerm(''); setDateRange({ startDate: '', endDate: '' });
    setStatusFilter('active'); setImportFilter('pending');
    setAttributionFilter('all'); setEvangelistFilter(''); setSelectedSoulIds([]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette âme évangélisée ?')) return;
    try { await deleteDoc(doc(db, 'evangelized_souls', id)); toast.success('Âme supprimée'); }
    catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleExport = () => {
    const rows = filtered.map(s => ({
      'Nom et Prénoms': s.fullName, 'Surnom': s.nickname || '',
      'Genre': formatGender(s.gender), 'Téléphone': (s.phone || '').replace('+225', ''),
      "Lieu d'habitation": s.location,
      "Date d'évangélisation": s.evangelizationDate ? formatDateForExcel(s.evangelizationDate) : '',
      "Lieu d'évangélisation": s.evangelizationLocation || '',
      'Communauté fréquentée': s.attendedCommunity || '',
      'A donné sa vie à Jésus': gaveLifeLabel(s.gaveLifeToJesus),
      'Culte envisagé': plannedServiceLabel(s.plannedService),
      'Sujets de prière': s.prayerTopics || '',
      "Étudiant entretien": s.interviewerName || '',
      'Commentaires': s.notes || '',
      'Évangéliste': s.evangelistId ? (evangelistNames[s.evangelistId] || s.evangelistId) : 'Non attribué',
      'Statut': s.status === 'imported' ? 'Reçue' : s.status === 'active' ? 'Actif' : 'Inactif',
      'Reçue le': s.importedAt ? formatDateForExcel(s.importedAt) : '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Âmes évangélisées');
    XLSX.writeFile(wb, `ames-evangelisees-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const toggleSoulSelection = (id: string) =>
    setSelectedSoulIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAllOnPage = () => {
    const pageIds = paginated.map(s => s.id);
    const allSelected = pageIds.every(id => selectedSoulIds.includes(id));
    setSelectedSoulIds(allSelected
      ? selectedSoulIds.filter(id => !pageIds.includes(id))
      : [...new Set([...selectedSoulIds, ...pageIds])]);
  };

  const pageIds = paginated.map(s => s.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedSoulIds.includes(id));

  const columns = [
    ...(canAssignEvangelist ? [{
      key: 'checkbox',
      title: (
        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C] cursor-pointer"
          checked={allPageSelected} onChange={toggleSelectAllOnPage} title="Tout sélectionner" />
      ),
      render: (_: any, s: EvangelizedSoul) => (
        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C] cursor-pointer"
          checked={selectedSoulIds.includes(s.id)}
          onChange={() => toggleSoulSelection(s.id)}
          onClick={e => e.stopPropagation()} />
      ),
    }] : []),
    {
      key: 'fullName', title: 'Nom et Prénoms',
      render: (value: string, s: EvangelizedSoul) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {s.nickname && <span className="ml-2 text-sm text-gray-500">({s.nickname})</span>}
        </div>
      ),
    },
    {
      key: 'gender', title: 'Genre',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
          {value === 'male' ? 'Homme' : 'Femme'}
        </span>
      ),
    },
    { key: 'phone', title: 'Téléphone', render: (v: string) => <span className="text-gray-600">{v || '-'}</span> },
    { key: 'location', title: "Lieu d'habitation", render: (v: string) => <span className="text-gray-600">{v || '-'}</span> },
    {
      key: 'evangelizationDate', title: "Date d'évangélisation",
      render: (v: Date) => <span className="text-gray-600">{v ? formatDate(v) : '-'}</span>,
    },
    {
      key: 'gaveLifeToJesus', title: 'Vie à Jésus',
      render: (v: string) => {
        if (!v) return <span className="text-gray-400">-</span>;
        const colors: Record<string, string> = { yes: 'bg-green-100 text-green-800', no: 'bg-red-100 text-red-800', not_yet: 'bg-amber-100 text-amber-800' };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[v] || 'bg-gray-100 text-gray-700'}`}>{gaveLifeLabel(v as any)}</span>;
      },
    },
    {
      key: 'plannedService', title: 'Culte envisagé',
      render: (v: string) => {
        if (!v || v === 'undecided') return <span className="text-gray-400">-</span>;
        const short: Record<string, string> = { wednesday_evening: 'Mer. 19h', sunday_first: 'Dim. 7h', sunday_second: 'Dim. 10h' };
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">{short[v] || plannedServiceLabel(v as any)}</span>;
      },
    },
    // Colonne Évangéliste (Admin/ADN uniquement)
    ...(canAssignEvangelist ? [{
      key: 'evangelistId', title: 'Évangéliste',
      render: (v: string | null) => {
        if (!v) return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <UserX className="w-3 h-3" /> Non attribué
          </span>
        );
        return <span className="text-gray-700 text-sm">{evangelistNames[v] || 'Chargement...'}</span>;
      },
    }] : []),
    {
      key: 'lastContact', title: 'Dernier contact',
      render: (_: any, s: EvangelizedSoul) => <LastContactBadge date={lastContactMap.get(s.id) || null} />,
    },
    {
      key: 'importStatus', title: 'État',
      render: (_: any, s: EvangelizedSoul) => {
        const isImported = !!s.importedToSoulId || s.status === 'imported';
        return isImported ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            title={s.importedAt ? `Reçue le ${formatDate(new Date(s.importedAt))}` : 'Reçue'}>
            <CheckCircle2 className="w-3 h-3" /> Reçue
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">En suivi</span>
        );
      },
    },
    {
      key: 'actions', title: 'Actions',
      render: (_: any, s: EvangelizedSoul) => {
        const isImported = !!s.importedToSoulId || s.status === 'imported';
        return (
          <div className="flex justify-end items-center gap-2">
            {(isAdmin || isEvangelist) && !isImported && (
              <button onClick={e => { e.stopPropagation(); setInteractingSoul(s); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
                <Phone className="w-3.5 h-3.5" /> Contacter
              </button>
            )}
            {canImportToSouls && !isImported && (
              <button onClick={e => { e.stopPropagation(); setImporting(s); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#F2B636] hover:bg-[#F2B636]/90 rounded-md">
                <Download className="w-3.5 h-3.5" /> Recevoir
              </button>
            )}
            {(isAdmin || isADN || isEvangelist) && (
              <button onClick={e => { e.stopPropagation(); setEditing(s); }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {isAdmin && !isImported && (
              <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                className="p-1 text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-500">Chargement des âmes évangélisées...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-[#00665C]" /> Âmes évangélisées
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && unassignedCount > 0 && (
            <button onClick={() => setShowDistributeModal(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 border border-amber-400 rounded-md">
              <Shuffle className="w-4 h-4 mr-1.5" /> Répartir ({unassignedCount} non attribuées)
            </button>
          )}
          <button onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel
          </button>
          <DownloadTemplateButton />
          {canCreateEvangelized && <ImportEvangelizedSoulsFromExcel />}
          {canCreateEvangelized && (
            <button onClick={() => setShowForm(!showForm)}
              data-tour="btn-add-evangelized-soul"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? 'Masquer le formulaire' : 'Ajouter une âme évangélisée'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p>Les <strong>âmes évangélisées</strong> ne sont <strong>pas comptabilisées</strong> parmi les âmes de l'église tant qu'elles n'ont pas effectué leur première visite au culte.</p>
          {canImportToSouls && <p className="mt-1">Le jour où l'âme vient au culte, cliquez sur <strong>« Recevoir »</strong> pour l'ajouter à la liste des âmes de l'église.</p>}
        </div>
      </div>

      {showForm && canCreateEvangelized && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-[#00665C] mb-4">Ajouter une âme évangélisée</h2>
          <EvangelizedSoulForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-[#00665C] hover:underline">
              <RotateCcw className="w-4 h-4" /> Réinitialiser
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation (début)</label>
            <input type="date" value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation (fin)</label>
            <input type="date" value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <Search className="w-4 h-4 absolute left-3 top-9 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Nom, téléphone, lieu..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État import</label>
            <select value={importFilter} onChange={e => setImportFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
              <option value="pending">En suivi</option>
              <option value="imported">Reçues</option>
              <option value="all">Toutes</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="all">Tous</option>
            </select>
          </div>
          {canAssignEvangelist && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attribution</label>
              <select value={attributionFilter} onChange={e => setAttributionFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
                <option value="all">Toutes</option>
                <option value="unassigned">Non attribuées uniquement</option>
              </select>
            </div>
          )}
        </div>
        {canAssignEvangelist && Object.keys(evangelistNames).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Évangéliste</label>
            <select value={evangelistFilter} onChange={e => setEvangelistFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
              <option value="">Tous les évangélistes</option>
              {Object.entries(evangelistNames)
                .sort(([, a], [, b]) => a.localeCompare(b))
                .map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
            </select>
          </div>
        )}
        <p className="text-sm text-gray-500">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          {canAssignEvangelist && souls.filter(s => !s.evangelistId).length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-gray-400">
              · <UserX className="w-3 h-3" /> {souls.filter(s => !s.evangelistId).length} non attribué(s)
            </span>
          )}
        </p>
      </div>

      {/* Barre d'actions contextuelle */}
      {selectedSoulIds.length > 0 && (
        <div className={`rounded-lg px-4 py-3 border ${showBulkDeleteConfirm ? 'bg-red-50 border-red-300' : 'bg-[#00665C]/5 border-[#00665C]/30'}`}>
          {!showBulkDeleteConfirm ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm font-medium text-[#00665C]">
                {selectedSoulIds.length} âme{selectedSoulIds.length > 1 ? 's' : ''} sélectionnée{selectedSoulIds.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setSelectedSoulIds([])} className="text-sm text-gray-500 hover:text-gray-700">
                  Désélectionner tout
                </button>
                {canAssignEvangelist && (
                  <button onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
                    <UserCheck className="w-4 h-4" /> Assigner à un évangéliste
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setShowBulkDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                    <Trash2 className="w-4 h-4" /> Supprimer ({selectedSoulIds.length})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Supprimer définitivement {selectedSoulIds.length} âme{selectedSoulIds.length > 1 ? 's' : ''} ? Cette action est irréversible.
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowBulkDeleteConfirm(false)} className="text-sm text-gray-600 hover:text-gray-800">
                  Annuler
                </button>
                <button onClick={handleBulkDelete} disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50">
                  {bulkDeleting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suppression…</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Confirmer la suppression</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <CustomTable columns={columns} data={paginated} />
        {paginated.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {hasActiveFilters ? 'Aucune âme évangélisée ne correspond à vos filtres.'
              : 'Aucune âme évangélisée pour l\'instant.'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <CustomPagination currentPage={currentPage} totalPages={totalPages}
          onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
      )}

      {editing && <EditEvangelizedSoulModal soul={editing} isOpen={!!editing} onClose={() => setEditing(null)} />}
      {importing && <ImportToSoulModal soul={importing} isOpen={!!importing} onClose={() => setImporting(null)} />}
      {interactingSoul && userId && (
        <InteractionModal isOpen={!!interactingSoul}
          onClose={() => { setInteractingSoul(null); if (souls.length > 0) loadLastContacts(souls.map(s => s.id)); }}
          soulId={interactingSoul.id} shepherdId={userId} soulName={interactingSoul.fullName}
          sourceCollection="evangelized_souls" />
      )}
      <AssignToEvangelistModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}
        soulIds={selectedSoulIds} onSuccess={() => setSelectedSoulIds([])} />
      <DistributeEvangelizedSoulsModal
        isOpen={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
        onSuccess={() => setShowDistributeModal(false)}
      />
    </div>
  );
}
