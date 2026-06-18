import { Pencil, Trash2, Users, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader?: string;
  leaderId?: string;
  shepherdIds?: string[];
}

interface ServiceFamilyListItemProps {
  family: ServiceFamily;
  onEdit: () => void;
  onDeleted?: () => void;
}

export default function ServiceFamilyListItem({ family, onEdit, onDeleted }: ServiceFamilyListItemProps) {
  const { confirm, confirmModalProps } = useConfirmModal();

  const handleDelete = async () => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer cette famille ?')) {
      try {
        const { error } = await supabase.from('service_families').delete().eq('id', family.id).eq('church_id', getChurchId());
        if (error) throw error;
        toast.success('Famille supprimée avec succès');
        onDeleted?.();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const shepherdCount = family.shepherdIds?.length || 0;

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">{family.name}</h3>
            {family.leader && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                <UserCheck className="w-3 h-3 mr-1" />
                {family.leader}
              </span>
            )}
            {shepherdCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <Users className="w-3 h-3 mr-1" />
                {shepherdCount} berger{shepherdCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {family.description && (
            <p className="mt-1 text-sm text-gray-500">{family.description}</p>
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
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
