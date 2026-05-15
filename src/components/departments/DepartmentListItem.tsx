import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  description: string;
  leader: string;
}

interface DepartmentListItemProps {
  department: Department;
  onEdit: () => void;
}

export default function DepartmentListItem({ department, onEdit }: DepartmentListItemProps) {
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      try {
        await deleteDoc(doc(db, 'departments', department.id));
        toast.success('Département supprimé avec succès');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
            {department.leader && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                <Users className="w-3 h-3 mr-1" />
                {department.leader}
              </span>
            )}
          </div>
          {department.description && (
            <p className="mt-1 text-sm text-gray-500">{department.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}