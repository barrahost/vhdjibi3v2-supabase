import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types/user.types';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserListItemProps {
  user: User;
  onEdit: () => void;
}

export default function UserListItem({ user, onEdit }: UserListItemProps) {
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        toast.success('Utilisateur supprimé avec succès');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'pasteur':
        return 'bg-indigo-100 text-indigo-800';
      case 'shepherd':
        return 'bg-green-100 text-green-800';
      case 'adn':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'pasteur':
        return 'Pasteur';
      case 'shepherd':
        return 'Berger(e)';
      case 'adn':
        return 'ADN';
      default:
        return role;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Actif' : 'Inactif';
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {user.fullName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.phone}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role || '')}`}>
          {getRoleLabel(user.role || '')}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
          {getStatusLabel(user.status)}
        </span>
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
    </tr>
  );
}