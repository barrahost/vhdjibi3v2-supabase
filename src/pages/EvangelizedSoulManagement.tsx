import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Plus, FileSpreadsheet, Search, Pencil, Trash2, RotateCcw, Megaphone, Info, CheckCircle2, Download, Phone, UserCheck, UserX, Shuffle, AlertTriangle, MoreVertical, X as XIcon } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { CollapsibleFilters } from '../components/ui/CollapsibleFilters';
import { DateRangePicker } from '../components/ui/DateRangePicker';
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
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: fmt(start), endDate: fmt(end) };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSoulIds, setSelectedSoulIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const activeProfileType = (activeRole || userRole) as string;
  const activeBusinessProfiles = ((user as any)?.businessProfiles || []).filter(
    (p: any) => p?.type === activeProfileType
  );
  const roleForCheck = { role: activeProfileType, businessProfiles: activeBusinessProfiles };
  const isAdmin = isAdminUser(roleForCheck);
  const isADN = isADNUser(roleForCheck);
  const isEvangelist = isEvangelistUser(roleForCheck);

  const canImportToSouls = isAdmin || isADN;
  const canCreateEvangelized = isAdmin || isADN || isEvangelist;
  const canAssignEvangelist = isAdmin || isADN;
  const userId = user ? (user as any).id || (user as any).uid : null;

  const handleBulkDelete = async () => {
    if (selectedSoulIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('evangelized_souls')
        .delete()
        .in('id', selectedSoulIds);
      if (error) throw error;
      toast.success(selectedSoulIds.length + ' ame' + (selectedSoulIds.length > 1 ? 's' : '') + ' supprimee' + (selectedSoulIds.length > 1 ? 's' : ''));
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

  const loadEvangelistNames = useCallback(async (souls: EvangelizedSoul[]) => {
    const ids = [...new Set(souls.map(s => s.evangelistId).filter(Boolean))] as string[];
    if (ids.length === 0) { setEvangelistNames({}); return; }
    try {
      const { data, error } = await supabase.from('users').select('id, full_name').in('id', ids);
      const names: Record<string, string> = {};
      if (!error && data) {
        data.forEach((u: any) => { names[u.id] = u.full_name || u.fullName || ''; });
      }
      ids.forEach(id => { if (!names[id]) names[id] = 'Non assigné'; });
      setEvangelistNames(names);
    } catch {
      const names: Record<string, string> = {};
      ids.forEach(id => { names[id] = 'Erreur'; });
      setEvangelistNames(names);
    }
  }, []);

  const fetchSouls = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let q = supabase.from('evangelized_souls').select('*').order('created_at', { ascending: false });
      if (!isAdmin && !isADN) {
        q = q.eq('evangelist_id', userId);
      } else {
        if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      const sorted = (data || []).map((v: any) => ({
        ...v,
        id: v.id,
        fullName: v.fullName || v.full_name || '',
        phone: v.phone || '',
        location: v.location || '',
        gender: v.gender || 'male',
        soulId: v.soulId || v.soul_id,
        evangelistId: v.evangelistId || v.evangelist_id,
        shepherdId: v.shepherdId || v.shepherd_id,
        status: v.status || 'active',
        photoURL: v.photoURL || v.photo_url,
        evangelizationDate: v.evangelizationDate
          ? new Date(v.evangelizationDate)
          : v.evangelization_date
          ? new Date(v.evangelization_date)
          : null,
        createdAt: v.createdAt
          ? new Date(v.createdAt)
          : v.created_at
          ? new Date(v.created_at)
          : null,
        updatedAt: v.updatedAt
          ? new Date(v.updatedAt)
          : v.updated_at
          ? new Date(v.updated_at)
          : null,
      } as EvangelizedSoul));
      setSouls(sorted);
      loadEvangelistNames(sorted);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, isADN, statusFilter, loadEvangelistNames]);

  useEffect(() => {
    fetchSouls();
    const channel = supabase
      .channel('evangelized-souls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evangelized_souls' }, () => {
        fetchSouls();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSouls]);

  useEffect(() => setCurrentPage(1), [searchTerm, dateRange, statusFilter, importFilter, attributionFilter, evangelistFilter]);
  useEffect(() => setSelectedSoulIds([]), [currentPage, searchTerm, statusFilter, importFilter, attributionFilter, evangelistFilter]);

  const loadLastContacts = useCallback(async (soulIds: string[]) => {
    if (soulIds.length === 0) { setLastContactMap(new Map()); return; }
    try {
      const { data } = await supabase
        .from('interactions')
        .select('soul_id, date')
        .in('soul_id', soulIds)
        .order('date', { ascending: false });
      const map = new Map<string, Date>();
      (data || []).forEach((row: any) => {
        const dt = new Date(row.date);
        if (!map.has(row.soul_id) || map.get(row.soul_id)!.getTime() < dt.getTime()) {
          map.set(row.soul_id, dt);
        }
      });
      setLastContactMap(map);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (souls.length === 0) { setLastContactMap(new Map()); return; }
    loadLastContacts(souls.map(s => s.id));
  }, [souls, loadLastContacts]);

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

  const isDefaultMonth = (() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return dateRange.startDate === s && dateRange.endDate === e;
  })();
  const hasActiveFilters = searchTerm !== '' || !isDefaultMonth ||
    statusFilter !== 'active' || importFilter !== 'pending' || attributionFilter !== 'all' || evangelistFilter !== '';
  const activeFiltersCount = [
    searchTerm !== '',
    !isDefaultMonth,
    statusFilter !== 'active',
    importFilter !== 'pending',
    attributionFilter !== 'all',
    evangelistFilter !== '',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setDateRange({ startDate: fmt(start), endDate: fmt(end) });
    setStatusFilter('active'); setImportFilter('pending');
    setAttributionFilter('all'); setEvangelistFilter(''); setSelectedSoulIds([]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette ame evangelisee ?')) return;
    try {
      const { error } = await supabase.from('evangelized_souls').delete().eq('id', id);
      if (error) throw error;
      toast.success('Ame supprimee');
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleExport = () => {
    const rows = filtered.map(s => ({
      'Nom et Prenoms': s.fullName, 'Surnom': s.nickname || '',
      'Genre': formatGender(s.gender), 'Telephone': (s.phone || '').replace('+225', ''),
      "Lieu d'habitation": s.location,
      "Date d'evangelisation": s.evangelizationDate ? formatDateForExcel(s.evangelizationDate) : '',
      "Lieu d'evangelisation": s.evangelizationLocation || '',
      'Communaute frequentee': s.attendedCommunity || '',
      'A donne sa vie a Jesus': gaveLifeLabel(s.gaveLifeToJesus),
      'Culte envisage': plannedServiceLabel(s.plannedService),
      'Sujets de priere': s.prayerTopics || '',
      "Etudiant entretien": s.interviewerName || '',
      'Commentaires': s.notes || '',
      'Evangeliste': s.evangelistId ? (evangelistNames[s.evangelistId] || s.evangelistId) : 'Non attribue',
      'Statut': s.status === 'imported' ? 'Recue' : s.status === 'active' ? 'Actif' : 'Inactif',
      'Recue le': s.importedAt ? formatDateForExcel(s.importedAt) : '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Ames evangelisees');
    XLSX.writeFile(wb, 'ames-evangelisees-' + new Date().toISOString().slice(0, 10) + '.xlsx');
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
          checked={allPageSelected} onChange={toggleSelectAllOnPage} title="Tout selectionner" />
      ),
      render: (_: any, s: EvangelizedSoul) => (
        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C] cursor-pointer"
          checked={selectedSoulIds.includes(s.id)}
          onChange={() => toggleSoulSelection(s.id)}
          onClick={e => e.stopPropagation()} />
      ),
    }] : []),
    {
      key: 'fullName', title: 'Nom et Prenoms',
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
        <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " + (value === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800')}>
          {value === 'male' ? 'Homme' : 'Femme'}
        </span>
      ),
    },
    { key: 'phone', title: 'Telephone', render: (v: string) => <span className="text-gray-600">{v || '-'}</span> },
    { key: 'location', title: "Lieu d'habitation", render: (v: string) => <span className="text-gray-600">{v || '-'}</span> },
    {
      key: 'evangelizationDate', title: "Date d'evangelisation",
      render: (v: Date) => <span className="text-gray-600">{v ? formatDate(v) : '-'}</span>,
    },
    {
      key: 'gaveLifeToJesus', title: 'Vie a Jesus',
      render: (v: string) => {
        if (!v) return <span className="text-gray-400">-</span>;
        const colors: Record<string, string> = { yes: 'bg-green-100 text-green-800', no: 'bg-red-100 text-red-800', not_yet: 'bg-amber-100 text-amber-800' };
        return <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " + (colors[v] || 'bg-gray-100 text-gray-700')}>{gaveLifeLabel(v as any)}</span>;
      },
    },
    {
      key: 'plannedService', title: 'Culte envisage',
      render: (v: string) => {
        if (!v || v === 'undecided') return <span className="text-gray-400">-</span>;
        const short: Record<string, string> = { wednesday_evening: 'Mer. 19h', sunday_first: 'Dim. 7h', sunday_second: 'Dim. 10h' };
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">{short[v] || plannedServiceLabel(v as any)}</span>;
      },
    },
    ...(canAssignEvangelist ? [{
      key: 'evangelistId', title: 'Evangeliste',
      render: (v: string | null) => {
        if (!v) return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <UserX className="w-3 h-3" /> Non attribue
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
      key: 'importStatus', title: 'Etat',
      render: (_: any, s: EvangelizedSoul) => {
        const isImported = !!s.importedToSoulId || s.status === 'imported';
        return isImported ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            title={s.importedAt ? 'Recue le ' + formatDate(new Date(s.importedAt)) : 'Recue'}>
            <CheckCircle2 className="w-3 h-3" /> Recue
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


  // ---- Mobile card renderer for CustomTable ----
  const renderMobileCard = (s: EvangelizedSoul) => {
    const isImported = !!s.importedToSoulId || s.status === 'imported';
    const lastContact = lastContactMap.get(s.id) || null;
    const initials = s.fullName
      .split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return (
      <div className="p-4">
        {/* Top row: avatar + name + status */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm leading-tight">{s.fullName}</p>
              {s.nickname && <span className="text-xs text-gray-400">({s.nickname})</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={"text-xs px-1.5 py-0.5 rounded-full font-medium " + (s.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
                {s.gender === 'male' ? 'Homme' : 'Femme'}
              </span>
              {isImported ? (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3" /> Reçue
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">En suivi</span>
              )}
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 mb-3">
          {s.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{s.phone}</span>
            </div>
          )}
          {s.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-400 flex-shrink-0 text-xs">📍</span>
              <span className="truncate">{s.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Dernier contact :</span>
            <LastContactBadge date={lastContact} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
          {(isAdmin || isEvangelist) && !isImported && (
            <button
              onClick={e => { e.stopPropagation(); setInteractingSoul(s); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
            >
              <Phone className="w-3.5 h-3.5" /> Contacter
            </button>
          )}
          {canImportToSouls && !isImported && (
            <button
              onClick={e => { e.stopPropagation(); setImporting(s); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#F2B636] hover:bg-[#F2B636]/90 rounded-md"
            >
              <Download className="w-3.5 h-3.5" /> Recevoir
            </button>
          )}
          {(isAdmin || isADN || isEvangelist) && (
            <button
              onClick={e => { e.stopPropagation(); setEditing(s); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
          )}
          {isAdmin && !isImported && (
            <button
              onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
              className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-500">Chargement des ames evangelisees...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header — desktop layout */}
      <div className="hidden sm:flex sm:justify-between sm:items-center gap-3">
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
              {showForm ? 'Masquer' : 'Ajouter une âme'}
            </button>
          )}
        </div>
      </div>

      {/* Header — mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#00665C]" /> Âmes évangélisées
          </h1>
          <div className="flex items-center gap-2">
            {canCreateEvangelized && (
              <button onClick={() => setShowForm(!showForm)}
                data-tour="btn-add-evangelized-soul"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMobileActions(v => !v)}
                className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMobileActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMobileActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border z-20 py-1">
                    {isAdmin && unassignedCount > 0 && (
                      <button onClick={() => { setShowDistributeModal(true); setShowMobileActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-700 hover:bg-amber-50">
                        <Shuffle className="w-4 h-4" /> Répartir ({unassignedCount} non attribuées)
                      </button>
                    )}
                    <button onClick={() => { handleExport(); setShowMobileActions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                      <FileSpreadsheet className="w-4 h-4 text-[#00665C]" /> Exporter Excel
                    </button>
                    {canCreateEvangelized && (
                      <div className="px-2 py-1">
                        <ImportEvangelizedSoulsFromExcel />
                      </div>
                    )}
                    <div className="px-2 py-1">
                      <DownloadTemplateButton />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p>Les <strong>ames evangelisees</strong> ne sont <strong>pas comptabilisees</strong> parmi les ames de l'eglise tant qu'elles n'ont pas effectue leur premiere visite au culte.</p>
          {canImportToSouls && <p className="mt-1">Le jour ou l'ame vient au culte, cliquez sur <strong>Recevoir</strong> pour l'ajouter a la liste des ames de l'eglise.</p>}
        </div>
      </div>

      {showForm && canCreateEvangelized && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-[#00665C] mb-4">Ajouter une ame evangelisee</h2>
          <EvangelizedSoulForm onCreated={() => { setShowForm(false); fetchSouls(); }} />
        </div>
      )}

      <CollapsibleFilters
        activeCount={activeFiltersCount}
        storageKey="filters:evangelized:open"
        resetButton={hasActiveFilters ? (
          <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-[#00665C] hover:underline">
            <RotateCcw className="w-4 h-4" /> Reinitialiser
          </button>
        ) : undefined}
      >
        <DateRangePicker
          label="Date d'évangélisation"
          value={dateRange}
          onChange={setDateRange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <Search className="w-4 h-4 absolute left-3 top-9 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Nom, telephone, lieu..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etat import</label>
            <select value={importFilter} onChange={e => setImportFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
              <option value="pending">En suivi</option>
              <option value="imported">Recues</option>
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
                <option value="unassigned">Non attribuees uniquement</option>
              </select>
            </div>
          )}
        </div>
        {canAssignEvangelist && Object.keys(evangelistNames).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evangeliste</label>
            <select value={evangelistFilter} onChange={e => setEvangelistFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
              <option value="">Tous les evangelistes</option>
              {Object.entries(evangelistNames)
                .sort(([, a], [, b]) => a.localeCompare(b))
                .map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
            </select>
          </div>
        )}
        <p className="text-sm text-gray-500">
          {filtered.length} resultat{filtered.length !== 1 ? 's' : ''} trouve{filtered.length !== 1 ? 's' : ''}
          {canAssignEvangelist && souls.filter(s => !s.evangelistId).length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-gray-400">
              Â· <UserX className="w-3 h-3" /> {souls.filter(s => !s.evangelistId).length} non attribue(s)
            </span>
          )}
        </p>
      </CollapsibleFilters>

      {selectedSoulIds.length > 0 && (
        <div className={"rounded-lg px-4 py-3 border " + (showBulkDeleteConfirm ? 'bg-red-50 border-red-300' : 'bg-[#00665C]/5 border-[#00665C]/30')}>
          {!showBulkDeleteConfirm ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm font-medium text-[#00665C]">
                {selectedSoulIds.length} ame{selectedSoulIds.length > 1 ? 's' : ''} selectionnee{selectedSoulIds.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setSelectedSoulIds([])} className="text-sm text-gray-500 hover:text-gray-700">
                  Deselectionner tout
                </button>
                {canAssignEvangelist && (
                  <button onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
                    <UserCheck className="w-4 h-4" /> Assigner a un evangeliste
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
                Supprimer definitivement {selectedSoulIds.length} ame{selectedSoulIds.length > 1 ? 's' : ''} ? Cette action est irreversible.
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowBulkDeleteConfirm(false)} className="text-sm text-gray-600 hover:text-gray-800">
                  Annuler
                </button>
                <button onClick={handleBulkDelete} disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50">
                  {bulkDeleting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suppression...</>
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
        <CustomTable columns={columns} data={paginated} mobileCard={renderMobileCard} />
        {paginated.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {hasActiveFilters ? "Aucune ame evangelisee ne correspond a vos filtres."
              : "Aucune ame evangelisee pour l'instant."}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <CustomPagination currentPage={currentPage} totalPages={totalPages}
          onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
      )}

      {editing && <EditEvangelizedSoulModal soul={editing} isOpen={!!editing} onClose={() => setEditing(null)} onUpdated={() => fetchSouls()} />}
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
