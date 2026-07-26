import { useState, useEffect, useMemo } from 'react';

import { Servant } from '../../types/servant.types';
import { Search, ArrowUpDown, AlertTriangle } from 'lucide-react';
import ServantListItem from './ServantListItem';
import EditServantModal from './EditServantModal';
import OrphanedServantsModal from './OrphanedServantsModal';
import ConvertServantToUserModal from './ConvertServantToUserModal';
import { CustomPagination } from '../ui/CustomPagination';
import { useDepartments } from '../../hooks/useDepartments';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { getProfileDepartmentIds } from '../../types/businessProfile.types';

const ITEMS_PER_PAGE = 10;

type SortField = 'fullName' | 'department';
type SortDirection = 'asc' | 'desc';

interface ServantListProps {
  statusFilter: 'all' | 'active' | 'inactive';
  selectedServantIds?: string[];
  onSelectionChange?: (servantIds: string[]) => void;
}

export default function ServantList({ statusFilter, selectedServantIds = [], onSelectionChange }: ServantListProps) {
  const { user, activeRole } = useAuth();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission('*') || hasPermission('MANAGE_SERVANTS');
  const [servants, setServants] = useState<Servant[]>([]);
  const [showOrphanModal, setShowOrphanModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingServant, setEditingServant] = useState<Servant | null>(null);
  const [convertingServant, setConvertingServant] = useState<Servant | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [leaderDepartmentIds, setLeaderDepartmentIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'fullName',
    direction: 'asc'
  });
  const { departments } = useDepartments();

  // Auto-filter by department(s) if user is a department leader in that mode
  useEffect(() => {
    if (activeRole === 'department_leader' && user?.businessProfiles) {
      const deptLeaderProfile = user.businessProfiles.find((p: any) => p.type === 'department_leader');
      const ids = getProfileDepartmentIds(deptLeaderProfile);
      setLeaderDepartmentIds(ids);
      setSelectedDepartmentId(ids.length === 1 ? ids[0] : '');
    }
  }, [activeRole, user?.businessProfiles]);

  // Store servants data for bulk operations
  useEffect(() => {
    if (onSelectionChange && typeof window !== 'undefined') {
      (window as any).currentServants = servants;
    }
  }, [servants, onSelectionChange]);

  const toggleServantSelection = (servantId: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedServantIds.includes(servantId)
      ? selectedServantIds.filter(id => id !== servantId)
      : [...selectedServantIds, servantId];
    
    onSelectionChange(newSelection);
  };

  const toggleAllSelection = () => {
    if (!onSelectionChange) return;
    
    const allSelected = paginatedServants.every(servant => selectedServantIds.includes(servant.id));
    
    if (allSelected) {
      // Unselect all servants from current page
      const currentPageIds = paginatedServants.map(servant => servant.id);
      onSelectionChange(selectedServantIds.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all servants from current page
      const currentPageIds = paginatedServants.map(servant => servant.id);
      const newSelection = [...selectedServantIds];
      currentPageIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      onSelectionChange(newSelection);
    }
  };

  // Charger les serviteurs
  useEffect(() => {
    const loadServants = async () => {
      let q = supabase.from('servants').select('*').eq('church_id', getChurchId()).order('created_at', { ascending: false });
      if (selectedDepartmentId) {
        q = (q as any).contains('department_ids', [selectedDepartmentId]);
      } else if (activeRole === 'department_leader' && leaderDepartmentIds.length > 1) {
        // No single department picked — leader sees servants across every department they head.
        q = (q as any).overlaps('department_ids', leaderDepartmentIds);
      }
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) {
        console.error('Error loading servants:', error);
        toast.error('Erreur lors du chargement des serviteurs');
        setLoading(false);
        return;
      }
      setServants((data ?? []).map((r: any) => ({
        id: r.id,
        fullName: r.full_name || '',
        nickname: r.nickname || '',
        gender: r.gender,
        phone: r.phone || '',
        email: r.email || '',
        departmentIds: r.department_ids || [],
        isHead: r.is_head || false,
        isShepherd: r.is_shepherd || false,
        originalSoulId: r.original_soul_id || null,
        status: r.status || 'active',
        shepherdId: r.shepherd_id || null,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date()
      } as Servant)));
      setLoading(false);
    };
    loadServants();
    const channel = supabase.channel('servants_list_' + statusFilter + '_' + selectedDepartmentId + '_' + leaderDepartmentIds.join(','))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servants' }, () => loadServants())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDepartmentId, statusFilter, leaderDepartmentIds]);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartmentId]);

  const validDeptIds = useMemo(() => new Set(departments.map(d => d.id)), [departments]);
  const departmentsLoaded = departments.length > 0;

  // Orphelins = serviteurs sans aucun département valide
  const orphanServants = useMemo(() => {
    if (!departmentsLoaded) return [];
    return servants.filter(s => !s.departmentIds?.some(id => validDeptIds.has(id)));
  }, [servants, validDeptIds, departmentsLoaded]);

  const validServants = useMemo(() => {
    if (!departmentsLoaded) return servants;
    return servants.filter(s => s.departmentIds?.some(id => validDeptIds.has(id)));
  }, [servants, validDeptIds, departmentsLoaded]);

  const filteredServants = validServants.filter(servant =>
    servant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servant.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayServants = filteredServants;

  // Trier
  const sortedServants = [...displayServants].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;
    switch (field) {
      case 'fullName':
        return a.fullName.localeCompare(b.fullName) * modifier;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedServants.length / ITEMS_PER_PAGE);
  const paginatedServants = sortedServants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Obtenir le nom du département
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Département inconnu';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Chargement des serviteurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && orphanServants.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-300 bg-amber-50">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-amber-900">
            <strong>{orphanServants.length}</strong> serviteur{orphanServants.length > 1 ? 's sont liés' : ' est lié'} à des départements supprimés.
          </div>
          <button
            onClick={() => setShowOrphanModal(true)}
            className="text-sm font-medium text-amber-800 hover:text-amber-900 underline whitespace-nowrap"
          >
            Voir et nettoyer →
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un serviteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        
        <div className="w-full md:w-64">
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
            disabled={activeRole === 'department_leader' && leaderDepartmentIds.length <= 1}
          >
            <option value="">
              {activeRole === 'department_leader' && leaderDepartmentIds.length > 1 ? 'Tous mes départements' : 'Tous les départements'}
            </option>
            {(activeRole === 'department_leader'
              ? departments.filter((d) => leaderDepartmentIds.includes(d.id))
              : departments
            ).map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {activeRole === 'department_leader' && (
            <p className="text-xs text-muted-foreground mt-1">
              {leaderDepartmentIds.length > 1
                ? 'Filtré par vos départements — choisissez-en un pour affiner'
                : 'Filtré automatiquement par votre département'}
            </p>
          )}
        </div>
      </div>

      {/* Vue carte — mobile (< lg) */}
      <div className="lg:hidden space-y-3">
        {paginatedServants.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border text-gray-500">
            Aucun serviteur trouvé
          </div>
        ) : (
          paginatedServants.map((servant) => (
            <div key={servant.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {onSelectionChange && (
                <label className="flex items-center gap-2 px-4 pt-3 text-xs text-gray-500 cursor-pointer">
                  <Checkbox
                    checked={selectedServantIds.includes(servant.id)}
                    onCheckedChange={() => toggleServantSelection(servant.id)}
                  />
                  Sélectionner
                </label>
              )}
              <ServantListItem
                variant="card"
                servant={servant}
                departmentName={getDepartmentName(servant.departmentIds?.[0] || '')}
                departmentNames={
                  servant.departmentIds && servant.departmentIds.length > 1
                    ? servant.departmentIds.map((id: string) => getDepartmentName(id))
                    : undefined
                }
                onEdit={() => setEditingServant(servant)}
                onConvert={isAdmin ? (s) => setConvertingServant(s) : undefined}
              />
            </div>
          ))
        )}
      </div>

      {/* Vue tableau — desktop (lg+) */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {onSelectionChange && (
                  <th className="px-6 py-3 w-12">
                    <Checkbox
                      checked={paginatedServants.length > 0 && paginatedServants.every(servant => selectedServantIds.includes(servant.id))}
                      onCheckedChange={toggleAllSelection}
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="group flex items-center space-x-1"
                  >
                    <span>Nom et Prénoms</span>
                    <ArrowUpDown className={`w-4 h-4 transition-colors ${
                      sortConfig.field === 'fullName' ? 'text-[#00665C]' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedServants.length === 0 ? (
                <tr>
                  <td colSpan={onSelectionChange ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                    Aucun serviteur trouvé
                  </td>
                </tr>
              ) : (
                paginatedServants.map((servant) => (
                  <tr key={servant.id}>
                    {onSelectionChange && (
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedServantIds.includes(servant.id)}
                          onCheckedChange={() => toggleServantSelection(servant.id)}
                        />
                      </td>
                    )}
                    <ServantListItem
                      servant={servant}
                      departmentName={getDepartmentName(servant.departmentIds?.[0] || '')}
                      departmentNames={
                        servant.departmentIds && servant.departmentIds.length > 1
                          ? servant.departmentIds.map((id: string) => getDepartmentName(id))
                          : undefined
                      }
                      onEdit={() => setEditingServant(servant)}
                      onConvert={isAdmin ? (s) => setConvertingServant(s) : undefined}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredServants.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {editingServant && (
        <EditServantModal
          servant={editingServant}
          isOpen={!!editingServant}
          onClose={() => setEditingServant(null)}
          departmentName={getDepartmentName(editingServant.departmentIds?.[0] || '')}
        />
      )}

      <OrphanedServantsModal
        isOpen={showOrphanModal}
        onClose={() => setShowOrphanModal(false)}
        orphans={orphanServants}
        departments={departments}
      />

      {convertingServant && (
        <ConvertServantToUserModal
          isOpen={!!convertingServant}
          onClose={() => setConvertingServant(null)}
          servant={convertingServant}
          onSuccess={() => setConvertingServant(null)}
        />
      )}
    </div>
  );
}