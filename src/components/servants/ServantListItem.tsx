import { Servant } from '../../types/servant.types';
import { Pencil, Trash2, Phone, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface ServantListItemProps {
  servant: Servant;
  departmentName: string;
  departmentNames?: string[];
  familyName?: string;
  onEdit: () => void;
  onConvert?: (servant: Servant) => void;
  /** 'row' (cellules de tableau, defaut) ou 'card' (carte mobile) */
  variant?: 'row' | 'card';
}

export default function ServantListItem({ servant, departmentName, departmentNames, familyName, onEdit, onConvert, variant = 'row' }: ServantListItemProps) {
  const { confirm, confirmModalProps } = useConfirmModal();
  const handleDelete = async () => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer ce B.O.S.S ?')) {
      try {
        // Si c'est un responsable, vérifier s'il y a des B.O.S.S dans son département
        if (servant.isHead) {
          // Mettre à jour le statut plutôt que de supprimer
          const { error: _updateErr } = await supabase.from('servants').update({
            status: 'inactive',
            updatedAt: new Date()
          });
          toast.success('B.O.S.S désactivé avec succès');
        } else {
          // Supprimer le B.O.S.S
          const { error: _deleteErr } = await supabase.from('servants').delete().eq('id', servant.id);
          toast.success('B.O.S.S supprimé avec succès');
        }
      } catch (error) {
        console.error('Error deleting servant:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const roleBadges = (
    <div className="flex flex-wrap gap-1">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        servant.isHead
          ? 'bg-purple-100 text-purple-800'
          : 'bg-blue-100 text-blue-800'
      }`}>
        {servant.isHead ? 'Responsable' : 'B.O.S.S'}
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
  );

  const departmentDisplay = departmentNames && departmentNames.length > 1 ? (
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
    <span>{departmentName}</span>
  );

  const actions = (
    <div className="flex justify-end gap-1.5">
      <button
        onClick={onEdit}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        title="Modifier"
      >
        <Pencil className="w-4 h-4" />
      </button>
      {onConvert && (
        <button
          onClick={() => onConvert(servant)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#00665C]/10 text-[#00665C] hover:bg-[#00665C]/20 transition-colors"
          title="Créer un compte utilisateur"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={handleDelete}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (variant === 'card') {
    return (
      <>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 break-words">
                {servant.fullName}
                {servant.nickname && (
                  <span className="ml-1 text-sm font-normal text-gray-500">({servant.nickname})</span>
                )}
              </p>
              {servant.phone && (
                <a
                  href={`tel:${servant.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-[#00665C]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {servant.phone}
                </a>
              )}
            </div>
            {actions}
          </div>
          <div className="mt-2 flex items-start gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase pt-0.5">Département</span>
            <div className="min-w-0 text-sm text-gray-600">{departmentDisplay}</div>
          </div>
          <div className="mt-1 flex items-start gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase pt-0.5">Famille</span>
            <div className="min-w-0 text-sm text-gray-600">{familyName || <span className="text-amber-600">Non rattaché</span>}</div>
          </div>
        </div>
        <ConfirmModal {...confirmModalProps} />
      </>
    );
  }

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
        {departmentDisplay}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {familyName || <span className="text-amber-600 text-xs">Non rattaché</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        {actions}
      </td>
      <ConfirmModal {...confirmModalProps} />
    </>
  );
}