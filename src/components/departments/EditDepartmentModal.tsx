import { useState, useEffect } from 'react';
import { doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  description: string;
  leader: string;
}

interface EditDepartmentModalProps {
  department: Department;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditDepartmentModal({ department, isOpen, onClose }: EditDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        leader: department.leader
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.name.trim()) {
        toast.error('Le nom du département est obligatoire');
        return;
      }

      // Vérifier si le nom existe déjà (sauf pour le même département)
      if (formData.name.trim() !== department.name) {
        const nameQuery = query(
          collection(db, 'departments'),
          where('name', '==', formData.name.trim())
        );
        const nameSnapshot = await getDocs(nameQuery);
        
        if (!nameSnapshot.empty) {
          toast.error('Un département avec ce nom existe déjà');
          return;
        }
      }

      const departmentRef = doc(db, 'departments', department.id);
      await updateDoc(departmentRef, {
        ...formData,
        name: formData.name.trim(),
        leader: formData.leader.trim(),
        updatedAt: new Date()
      });
      
      toast.success('Département modifié avec succès');
      onClose();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier un département"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du département
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsable du département
          </label>
          <input
            type="text"
            value={formData.leader}
            onChange={(e) => setFormData(prev => ({ ...prev, leader: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
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
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}