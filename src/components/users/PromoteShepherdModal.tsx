import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ShepherdPromotionService } from '../../services/shepherdPromotion.service';
import { Modal } from '../ui/Modal';
import { UserCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface PromoteShepherdModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentDepartmentId?: string;
  onSuccess?: () => void;
}

export default function PromoteShepherdModal({
  isOpen,
  onClose,
  userId,
  userName,
  currentDepartmentId,
  onSuccess
}: PromoteShepherdModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(currentDepartmentId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const q = query(
          collection(db, 'departments'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const deptData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Department));
        setDepartments(deptData);
      } catch (error) {
        console.error('Error loading departments:', error);
        toast.error('Erreur lors du chargement des départements');
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartmentId) {
      toast.error('Veuillez sélectionner un département');
      return;
    }

    setIsLoading(true);
    try {
      await ShepherdPromotionService.promoteToDepartmentLeader(userId, selectedDepartmentId);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error promoting shepherd:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Promouvoir Responsable de Département"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <UserCircle className="w-8 h-8 text-[#00665C]" />
            <div>
              <p className="font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-gray-500">Sera promu responsable de département</p>
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Département à gérer *
            </label>
            {loadingDepartments ? (
              <div className="text-sm text-gray-500">Chargement des départements...</div>
            ) : (
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                required
                disabled={isLoading}
              >
                <option value="">Sélectionner un département</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Cette action ajoutera le profil "Responsable de Département" 
              à cet utilisateur, lui permettant de gérer les serviteurs de ce département.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedDepartmentId}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Promotion en cours...' : 'Confirmer la promotion'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
