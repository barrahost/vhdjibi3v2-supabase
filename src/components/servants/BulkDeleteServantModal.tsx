import { useState } from 'react';
import { Servant } from '../../types/servant.types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface BulkDeleteServantModalProps {
  isOpen: boolean;
  onClose: () => void;
  servants: Servant[];
  onConfirm: (servantIds: string[], deactivateHeads: boolean) => Promise<void>;
}

export default function BulkDeleteServantModal({
  isOpen,
  onClose,
  servants,
  onConfirm
}: BulkDeleteServantModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateHeads, setDeactivateHeads] = useState(true);

  const departmentHeads = servants.filter(s => s.isHead);
  const regularServants = servants.filter(s => !s.isHead);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(servants.map(s => s.id), deactivateHeads);
      onClose();
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmer la suppression"
    >
      <div className="p-6">
        <div className="flex items-start gap-2 mb-4 text-sm text-gray-600">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p>
            Vous êtes sur le point de supprimer {servants.length} serviteur(s).
          </p>
        </div>

        <div className="space-y-4">
          {departmentHeads.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Responsables de département ({departmentHeads.length})
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Les responsables de département ne peuvent pas être supprimés directement.
                Ils seront désactivés au lieu d'être supprimés.
              </p>
              <ul className="space-y-1 text-sm">
                {departmentHeads.map(servant => (
                  <li key={servant.id} className="text-gray-700">
                    • {servant.fullName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {regularServants.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">
                Serviteurs à supprimer ({regularServants.length})
              </h4>
              <div className="max-h-48 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {regularServants.map(servant => (
                    <li key={servant.id} className="text-gray-600">
                      • {servant.fullName} {servant.isShepherd && '(Berger)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Cette action est irréversible pour les serviteurs supprimés.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Confirmer la suppression'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
