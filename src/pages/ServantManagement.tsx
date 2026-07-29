import { useState } from 'react';
import ServantForm from '../components/servants/ServantForm';
import ServantList from '../components/servants/ServantList';
import DepartmentLeaderDashboard from '../components/servants/DepartmentLeaderDashboard';
import BulkDeleteServantModal from '../components/servants/BulkDeleteServantModal';
import { ImportServantsModal } from '../components/servants/ImportServantsModal';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Users, Trash2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ServantService } from '../services/servant.service';
import { Servant } from '../types/servant.types';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import toast from 'react-hot-toast';

export default function ServantManagement() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedServantIds, setSelectedServantIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [servantsToDelete, setServantsToDelete] = useState<Servant[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const canManageServants = hasPermission('MANAGE_SERVANTS');
  const canManageDepartmentServants = hasPermission('MANAGE_DEPARTMENT_SERVANTS');
  const isAdmin = hasPermission('*') || canManageServants;

  // Profil actuellement actif (sélectionné via le sélecteur de profils)
  const activeProfile = (user as any)?.businessProfiles?.find((p: any) => p.isActive);
  const leaderDepartmentIds = activeProfile?.type === 'department_leader' ? getProfileDepartmentIds(activeProfile) : [];
  const isActingAsDepartmentLeader = leaderDepartmentIds.length > 0;
  // L'import en masse cible un seul département à la fois — on prend le premier si le responsable en dirige plusieurs.
  const leaderDepartmentId: string | undefined = isActingAsDepartmentLeader ? leaderDepartmentIds[0] : undefined;
  const canShowImportButton =
    (isAdmin && !isActingAsDepartmentLeader) ||
    (canManageDepartmentServants && !!leaderDepartmentId) ||
    isAdmin;

  const handleBulkDelete = async () => {
    // Get all servants data from the window object (set by ServantList)
    const allServants = (window as any).currentServants as Servant[] || [];
    const servantsToDelete = allServants.filter(s => selectedServantIds.includes(s.id));
    
    if (servantsToDelete.length === 0) {
      toast.error('Aucun B.O.S.S sélectionné');
      return;
    }

    setServantsToDelete(servantsToDelete);
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async (servantIds: string[], deactivateHeads: boolean) => {
    try {
      const result = await ServantService.bulkDeleteServants(servantIds);
      
      let message = '';
      if (result.deleted > 0) {
        message += `${result.deleted} B.O.S.S supprimé(s)`;
      }
      if (result.deactivated > 0) {
        if (message) message += ', ';
        message += `${result.deactivated} responsable(s) désactivé(s)`;
      }
      
      toast.success(message);
      setSelectedServantIds([]);
      setShowBulkDeleteModal(false);
    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
      throw error;
    }
  };

  // Store servants data for bulk operations
  const handleSelectionChange = (servantIds: string[]) => {
    setSelectedServantIds(servantIds);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Gestion des B.O.S.S</h1>
          <p className="text-xs text-gray-500 mt-0.5">Bons Ouvriers au Service du Seigneur</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedServantIds.length > 0 && canManageServants && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer la sélection ({selectedServantIds.length})
            </Button>
          )}
          {canShowImportButton && (
            <Button
              onClick={() => setShowImportModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Importer des B.O.S.S
            </Button>
          )}
          {canManageServants && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Masquer le formulaire' : 'Ajouter un B.O.S.S'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs pour séparer la vue admin de la vue responsable de département */}
      <Tabs defaultValue={isAdmin ? "all" : "department"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {isAdmin && (
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tous les B.O.S.S
            </TabsTrigger>
          )}
          {canManageDepartmentServants && (
            <TabsTrigger value="department" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mon département
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vue complète pour les admins */}
        {isAdmin && (
          <TabsContent value="all" className="space-y-6">
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="text-lg font-medium text-foreground mb-4">Filtres</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background"
                >
                  <option value="active">Actifs uniquement</option>
                  <option value="inactive">Inactifs uniquement</option>
                  <option value="all">Tous les B.O.S.S</option>
                </select>
              </div>
            </div>
            
            {showForm && (
              <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-primary mb-4">Ajouter un B.O.S.S</h2>
                <ServantForm onSuccess={() => setShowForm(false)} />
              </div>
            )}

            <ServantList 
              statusFilter={statusFilter} 
              selectedServantIds={selectedServantIds}
              onSelectionChange={handleSelectionChange}
            />
          </TabsContent>
        )}

        {/* Vue département pour les responsables */}
        {canManageDepartmentServants && (
          <TabsContent value="department">
            <DepartmentLeaderDashboard />
          </TabsContent>
        )}
      </Tabs>

      <BulkDeleteServantModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        servants={servantsToDelete}
        onConfirm={handleConfirmBulkDelete}
      />

      <ImportServantsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        fixedDepartmentId={isActingAsDepartmentLeader ? leaderDepartmentId : undefined}
      />
    </div>
  );
}