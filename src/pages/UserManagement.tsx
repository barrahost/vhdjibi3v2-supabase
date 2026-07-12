
import { useState } from 'react';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import BulkRoleAssignmentModal from '../components/users/BulkRoleAssignmentModal';
import PromoteShepherdModal from '../components/users/PromoteShepherdModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Plus, Users, UserX, FileSpreadsheet } from 'lucide-react';
import ImportUsersFromExcel from '../components/users/ImportUsersFromExcel';
import DownloadUserTemplateButton from '../components/users/DownloadUserTemplateButton';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { exportShepherdsWithSouls } from '../utils/export/shepherdsWithSouls';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';

export default function UserManagement() {
  const { hasPermission } = usePermissions();
  const [exportingShepherds, setExportingShepherds] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'shepherds' | 'adn' | 'admins' | 'department_leader' | 'family_leader' | 'evangelist'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotingUser, setPromotingUser] = useState<{ userId: string; userName: string } | null>(null);
  const [showBulkDeactivateConfirm, setShowBulkDeactivateConfirm] = useState(false);
  const [bulkDeactivating, setBulkDeactivating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectionChange = (userIds: string[]) => {
    setSelectedUserIds(userIds);
  };

  const handleBulkAssignmentSuccess = () => {
    setSelectedUserIds([]);
    setShowBulkModal(false);
    toast.success('Rôles assignés avec succès');
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkDeactivating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .in('id', selectedUserIds);
      if (error) throw error;
      toast.success(`${selectedUserIds.length} utilisateur(s) désactivé(s)`);
      setSelectedUserIds([]);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setBulkDeactivating(false);
      setShowBulkDeactivateConfirm(false);
    }
  };

  const handleExportShepherdsWithSouls = async () => {
    setExportingShepherds(true);
    try {
      await exportShepherdsWithSouls();
      toast.success('Export généré');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExportingShepherds(false);
    }
  };

  const handlePromoteShepherd = (userId: string, userName: string) => {
    setPromotingUser({ userId, userName });
    setShowPromoteModal(true);
  };

  const handlePromotionSuccess = () => {
    setShowPromoteModal(false);
    setPromotingUser(null);
  };

  // Get selected users data for the modal
  const selectedUsers = ((window as any).currentUsers || []).filter((user: any) => selectedUserIds.includes(user.id));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <div className="flex flex-wrap items-center gap-2">
          {selectedUserIds.length > 0 && (
            <>
              <button
                onClick={() => setShowBulkDeactivateConfirm(true)}
                disabled={bulkDeactivating}
                className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm font-medium sm:px-4 sm:py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
                Désactiver ({selectedUserIds.length})
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm font-medium sm:px-4 sm:py-2 text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/10"
              >
                <Users className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
                Assigner un rôle ({selectedUserIds.length})
              </button>
            </>
          )}
          {hasPermission(PERMISSIONS.EXPORT_DATA) && (
            <button
              onClick={handleExportShepherdsWithSouls}
              disabled={exportingShepherds}
              className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm font-medium sm:px-4 sm:py-2 text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/10 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
              {exportingShepherds ? 'Export...' : 'Exporter bergers & âmes'}
            </button>
          )}
          <DownloadUserTemplateButton />
          <ImportUsersFromExcel />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm font-medium sm:px-4 sm:py-2 text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
            {showForm ? 'Masquer le formulaire' : 'Ajouter un utilisateur'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter un utilisateur</h2>
          <UserForm onSuccess={() => {
            setShowForm(false);
            // Afficher un message de succès
            toast.success('Utilisateur ajouté avec succès');
          }} />
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="admins">Administrateurs</option>
              <option value="shepherds">Berger(e)s</option>
              <option value="adn">ADN</option>
              <option value="department_leader">Responsables de Département</option>
              <option value="family_leader">Responsables de Famille</option>
              <option value="evangelist">Évangélistes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
              <option value="all">Tous les statuts</option>
            </select>
          </div>
        </div>
      </div>

      <UserList
        key={refreshKey}
        filter={roleFilter}
        statusFilter={statusFilter}
        selectedUserIds={selectedUserIds}
        onSelectionChange={handleSelectionChange}
        onPromoteShepherd={handlePromoteShepherd}
      />

      {/* Modal d'assignation en masse */}
      <BulkRoleAssignmentModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedUserIds={selectedUserIds}
        selectedUsers={selectedUsers}
        onSuccess={handleBulkAssignmentSuccess}
      />

      {/* Confirmation désactivation en masse */}
      <ConfirmModal
        isOpen={showBulkDeactivateConfirm}
        title="Désactiver les utilisateurs"
        message={`Désactiver ${selectedUserIds.length} utilisateur(s) ? Ils ne pourront plus se connecter tant qu'ils sont inactifs.`}
        confirmLabel={bulkDeactivating ? 'Désactivation...' : 'Désactiver'}
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleBulkDeactivate}
        onCancel={() => setShowBulkDeactivateConfirm(false)}
      />

      {/* Modal de promotion berger → responsable de département */}
      {promotingUser && (
        <PromoteShepherdModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          userId={promotingUser.userId}
          userName={promotingUser.userName}
          onSuccess={handlePromotionSuccess}
        />
      )}
    </div>
  );
}
