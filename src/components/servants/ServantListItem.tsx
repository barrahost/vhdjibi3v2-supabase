import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Servant } from '../../types/servant.types';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServantListItemProps {
  servant: Servant;
  departmentName: string;
  departmentNames?: string[];
  onEdit: () => void;
}

export default function ServantListItem({ servant, departmentName, departmentNames, onEdit }: ServantListItemProps) {
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce serviteur ?')) {
      try {
        // Si c'est un responsable, vérifier s'il y a des serviteurs dans son département
        if (servant.isHead) {
          // Mettre à jour le statut plutôt que de supprimer
          await updateDoc(doc(db, 'servants', servant.id), {
            status: 'inactive',
            updatedAt: new Date()
          });
          toast.success('Serviteur désactivé avec succès');
        } else {
          // Supprimer le serviteur
          await deleteDoc(doc(db, 'servants', servant.id));
          toast.success('Serviteur supprimé avec succès');
        }
      } catch (error) {
        console.error('Error deleting servant:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {servant.fullName}
        {servant.nickname && (
          <span className="ml-2 text-sm text-gray-500">
            ({servant.nickname})
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {servant.phone}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {departmentNames && departmentNames.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {departmentNames.map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          departmentName
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            servant.isHead
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {servant.isHead ? 'Responsable' : 'Serviteur'}
          </span>
          {servant.sourceType === 'soul' || servant.originalSoulId ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Importé d'âme
            </span>
          ) : null}
          {servant.sourceType === 'user' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
              Importé d'utilisateur
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex justify-end space-x-2">
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
      </td>
    </>
  );
}