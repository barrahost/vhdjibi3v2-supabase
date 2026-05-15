import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkRoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  selectedUsers: Array<{ id: string; fullName: string; role: string }>;
  onSuccess: () => void;
}

export default function BulkRoleAssignmentModal({
  isOpen,
  onClose,
  selectedUserIds,
  selectedUsers,
  onSuccess
}: BulkRoleAssignmentModalProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableRoles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'pasteur', label: 'Pasteur' },
    { value: 'shepherd', label: 'Berger(e)' },
    { value: 'adn', label: 'ADN' },
    { value: 'intern', label: 'Stagiaire' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    if (selectedUserIds.length === 0) {
      toast.error('Aucun utilisateur sélectionné');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Use writeBatch for atomic operations
      const batch = writeBatch(db);
      let successCount = 0;
      let errorCount = 0;

      // Update each selected user
      for (const userId of selectedUserIds) {
        try {
          const userRef = doc(db, 'users', userId);
          batch.update(userRef, {
            role: selectedRole,
            updatedAt: new Date()
          });
          successCount++;
        } catch (error) {
          console.error(`Error preparing update for user ${userId}:`, error);
          errorCount++;
        }
      }

      // Commit all updates at once
      await batch.commit();

      if (successCount > 0) {
        toast.success(`Rôle assigné avec succès à ${successCount} utilisateur${successCount > 1 ? 's' : ''}`);
      }
      
      if (errorCount > 0) {
        toast.error(`Erreur lors de l'assignation pour ${errorCount} utilisateur${errorCount > 1 ? 's' : ''}`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      toast.error('Erreur lors de l\'assignation en masse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleOption = availableRoles.find(r => r.value === role);
    return roleOption ? roleOption.label : role;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assignation de rôle en masse"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Assignation en masse</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Vous êtes sur le point d'assigner un nouveau rôle à <strong>{selectedUserIds.length}</strong> utilisateur{selectedUserIds.length > 1 ? 's' : ''}.</p>
                <p className="mt-1">Cette action remplacera le rôle actuel de tous les utilisateurs sélectionnés.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs sélectionnés */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Utilisateurs sélectionnés ({selectedUserIds.length})
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
            {selectedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                <span className="font-medium text-gray-900">{user.fullName}</span>
                <span className="text-sm text-gray-500">
                  Rôle actuel: {getRoleLabel(user.role)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sélecteur de nouveau rôle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau rôle à assigner
          </label>
          <select
            required
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Sélectionner un rôle</option>
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedRole}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50 flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Assignation...' : 'Assigner le rôle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}