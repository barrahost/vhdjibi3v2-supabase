

import { useState, useEffect } from 'react';
import { User } from '../../types/user.types';
import { Search, Pencil, Trash2, User as UserIcon, Building2 } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/roles';
import UserListItem from './UserListItem';
import { CustomPagination } from '../ui/CustomPagination';
import EditUserModal from './EditUserModal';
import { CustomTable } from '../ui/CustomTable';
import { useAuth } from '../../contexts/AuthContext';
import { Checkbox } from '../ui/checkbox';
import toast from 'react-hot-toast';
import { UserRoleMigration } from '../../utils/migration/userRoleMigration';
import { useServantStatus } from '../../hooks/useServantStatus';
import { isShepherdUser, isADNUser, isAdminUser, isDepartmentLeaderUser, isFamilyLeaderUser, isEvangelistUser } from '../../utils/roleHelpers';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface UserListProps {
  filter: 'all' | 'shepherds' | 'adn' | 'admins' | 'department_leader' | 'family_leader' | 'evangelist';
  statusFilter: 'all' | 'active' | 'inactive';
  selectedUserIds?: string[];
  onSelectionChange?: (userIds: string[]) => void;
  onPromoteShepherd?: (userId: string, userName: string) => void;
}

// Component for action buttons with servant status check
function ActionButtons({ 
  user, 
  canEditUsers, 
  canDeleteUsers, 
  onPromoteShepherd,
  onEdit,
  onDelete
}: { 
  user: User; 
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  onPromoteShepherd?: (userId: string, userName: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const servantStatus = useServantStatus(user.email);
  
  // Check both new businessProfiles and legacy role system
  const hasShepherdProfile = user.businessProfiles?.some((p: any) => p.type === 'shepherd') || 
                            user.role === 'shepherd' || 
                            user.role === 'intern';
  const hasDepartmentLeaderProfile = user.businessProfiles?.some((p: any) => p.type === 'department_leader') ||
                                    user.role === 'department_leader';
  
  // Check if already a department head in servants collection OR has department_leader profile
  const isAlreadyDepartmentLeader = hasDepartmentLeaderProfile || servantStatus.isDepartmentHead;
  
  // Show promote button only if: is shepherd, not already department leader, and not loading
  const canPromote = onPromoteShepherd && 
                     hasShepherdProfile && 
                     !isAlreadyDepartmentLeader && 
                     !servantStatus.loading;
  
  return (
    <div className="flex justify-end space-x-2">
      {canEditUsers && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Modifier"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {canPromote && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPromoteShepherd(user.id, user.fullName);
          }}
          className="p-1 text-[#00665C] hover:bg-[#00665C]/10 rounded transition-colors"
          title="Promouvoir responsable de département"
        >
          <Building2 className="w-4 h-4" />
        </button>
      )}
      {canDeleteUsers && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function UserList({ filter, statusFilter, selectedUserIds = [], onSelectionChange, onPromoteShepherd }: UserListProps) {
  const { confirm, confirmModalProps } = useConfirmModal();
  const { userRole } = useAuth();
  const { hasPermission } = usePermissions();
  const canEditUsers = userRole === 'super_admin' || hasPermission(PERMISSIONS.MANAGE_USERS);
  const canDeleteUsers = userRole === 'super_admin' || hasPermission(PERMISSIONS.MANAGE_USERS);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState({
    field: 'fullName' as keyof User,
    direction: 'asc' as 'asc' | 'desc'
  });
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // Auto-migration effect
  useEffect(() => {
    const runMigration = async () => {
      if (migrationCompleted) return;
      
      try {
        console.log('🔄 Starting automatic user role migration...');
        const results = await UserRoleMigration.migrateAllUsers();
        
        if (results.migrated > 0) {
          console.log(`✅ Migration completed: ${results.migrated} users migrated`);
          toast.success(`${results.migrated} utilisateurs migrés vers le nouveau système`);
        }
        
        if (results.errors.length > 0) {
          console.warn(`⚠️ Migration had ${results.errors.length} errors`);
        }
        
        setMigrationCompleted(true);
      } catch (error) {
        console.error('❌ Migration failed:', error);
      }
    };

    runMigration();
  }, [migrationCompleted]);

  // Pass users data to parent component for bulk operations
  useEffect(() => {
    if (onSelectionChange && typeof window !== 'undefined') {
      // Store users data in a way the parent can access it
      (window as any).currentUsers = users;
    }
  }, [users, onSelectionChange]);

  const toggleUserSelection = (userId: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    onSelectionChange(newSelection);
  };

  const toggleAllSelection = () => {
    if (!onSelectionChange) return;
    
    const allSelected = paginatedUsers.every(user => selectedUserIds.includes(user.id));
    
    if (allSelected) {
      // Unselect all users from current page
      const currentPageIds = paginatedUsers.map(user => user.id);
      onSelectionChange(selectedUserIds.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all users from current page
      const currentPageIds = paginatedUsers.map(user => user.id);
      const newSelection = [...selectedUserIds];
      currentPageIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      onSelectionChange(newSelection);
    }
  };

  const handleDelete = async (userId: string, userUid: string) => {
    if (!canDeleteUsers) {
      toast.error('Vous n\'avez pas la permission de supprimer des utilisateurs');
      return;
    }

    if (await confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        // Supprimer l'utilisateur de Firestore
        const { error: _deleteErr } = await supabase.from('users').delete().eq('id', userId);
        
        toast.success('Utilisateur supprimé avec succès');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setLoading(true);

    const loadUsers = async () => {
      try {
        const { data: usersRaw, error: usersErr } = await supabase
          .from('users')
          .select('*')
          .eq('church_id', getChurchId())
          .order('created_at', { ascending: false });

        if (usersErr) throw usersErr;

        let allUsers = (usersRaw ?? []).map((r: any) => ({
          id: r.id,
          fullName: r.full_name || '',
          email: r.email,
          phone: r.phone,
          role: r.role,
          status: r.status,
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          fromAdminsCollection: false,
          ...r,
        } as User));

        // Super admins
        if (filter === 'all' || filter === 'admins') {
          const { data: adminsRaw } = await supabase
            .from('admins')
            .select('*')
            .eq('role', 'super_admin');
          const superAdmins = (adminsRaw ?? []).map((r: any) => ({
            id: r.id,
            fullName: r.full_name || '',
            email: r.email,
            phone: r.phone,
            role: r.role,
            status: r.status || 'active',
            fromAdminsCollection: true,
            ...r,
          } as User));
          allUsers = [...allUsers, ...superAdmins];
        }

        // Deduplicate by email
        const deduplicatedUsers = allUsers.reduce((acc: User[], user) => {
          const existing = acc.find(u => user.email && u.email && u.email === user.email);
          if (!existing) acc.push(user);
          return acc;
        }, []);

        let filteredUsers = deduplicatedUsers;
        if (filter !== 'all') {
          if (filter === 'admins') filteredUsers = filteredUsers.filter(user => isAdminUser(user));
          else if (filter === 'shepherds') filteredUsers = filteredUsers.filter(user => isShepherdUser(user));
          else if (filter === 'adn') filteredUsers = filteredUsers.filter(user => isADNUser(user));
          else if (filter === 'department_leader') filteredUsers = filteredUsers.filter(user => isDepartmentLeaderUser(user));
          else if (filter === 'family_leader') filteredUsers = filteredUsers.filter(user => isFamilyLeaderUser(user));
          else if (filter === 'evangelist') filteredUsers = filteredUsers.filter(user => isEvangelistUser(user));
        }
        if (statusFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }

        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [filter, statusFilter]);
  // Réinitialiser la page courante quand le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;
    return String(a[field]).localeCompare(String(b[field])) * modifier;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    ...(onSelectionChange ? [{
      key: 'selection',
      title: (
        <Checkbox
          checked={paginatedUsers.length > 0 && 
                  paginatedUsers.every(user => selectedUserIds.includes(user.id))}
          onCheckedChange={toggleAllSelection}
          aria-label="Sélectionner tous les utilisateurs"
        />
      ),
      render: (_: any, user: User) => (
        <Checkbox
          checked={selectedUserIds.includes(user.id)}
          onCheckedChange={() => toggleUserSelection(user.id)}
          aria-label={`Sélectionner ${user.fullName}`}
        />
      )
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
                console.error('Image load error:', e);
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
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'email',
      title: 'Email'
    },
    {
      key: 'phone',
      title: 'Téléphone'
    },
    {
      key: 'role',
      title: 'Rôles',
      render: (value: string, user: User) => {
        const profileBadgeColor = (type: string) => {
          switch (type) {
            case 'admin':
            case 'super_admin':
              return 'bg-blue-100 text-blue-800';
            case 'pasteur':
              return 'bg-indigo-100 text-indigo-800';
            case 'shepherd':
              return 'bg-green-100 text-green-800';
            case 'adn':
              return 'bg-amber-100 text-amber-800';
            case 'department_leader':
              return 'bg-indigo-100 text-indigo-800';
            case 'family_leader':
              return 'bg-teal-100 text-teal-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };

        const profileLabel = (type: string) => {
          switch (type) {
            case 'admin': return 'Administrateur';
            case 'super_admin': return 'Super Admin';
            case 'pasteur': return 'Pasteur';
            case 'shepherd': return 'Berger(e)';
            case 'adn': return 'ADN';
            case 'department_leader': return 'Resp. Département';
            case 'family_leader': return 'Resp. Famille';
            default: return type;
          }
        };

        const profiles = (user as any).businessProfiles as Array<{ type: string; isPrimary?: boolean }> | undefined;

        if (profiles && profiles.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {profiles.map((p) => (
                <span
                  key={p.type}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${profileBadgeColor(p.type)} ${
                    p.isPrimary ? 'ring-2 ring-[#F2B636]' : ''
                  }`}
                  title={p.isPrimary ? 'Profil principal (par défaut à la connexion)' : ''}
                >
                  {p.isPrimary && <span className="text-[#F2B636]">★</span>}
                  {profileLabel(p.type)}
                </span>
              ))}
            </div>
          );
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profileBadgeColor(value)}`}>
            {profileLabel(value)}
          </span>
        );
      }
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === 'active' ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, user: User) => {
        if (!canEditUsers && !canDeleteUsers) return null;
        
        return (
          <ActionButtons
            user={user}
            canEditUsers={canEditUsers}
            canDeleteUsers={canDeleteUsers}
            onPromoteShepherd={onPromoteShepherd}
            onEdit={() => setEditingUser(user)}
            onDelete={() => handleDelete(user.id, user.id)}
          />
        );
      }
    }
  ];

  const handleSort = async (field: keyof User) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <CustomTable
        data={paginatedUsers}
        columns={columns}
      />

      {totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={sortedUsers.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
