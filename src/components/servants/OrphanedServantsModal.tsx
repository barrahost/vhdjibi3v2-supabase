import { useState } from 'react';
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Servant } from '../../types/servant.types';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface OrphanedServantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orphans: Servant[];
}

export default function OrphanedServantsModal({ isOpen, onClose, orphans }: OrphanedServantsModalProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  if (!isOpen) return null;

  const handleDeleteOne = async (id: string) => {
    if (!window.confirm('Supprimer définitivement ce serviteur orphelin ?')) return;
    try {
      setDeleting(id);
      await deleteDoc(doc(db, 'servants', id));
      toast.success('Serviteur orphelin supprimé');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`Supprimer définitivement les ${orphans.length} serviteur(s) orphelin(s) ?`)) return;
    try {
      setDeletingAll(true);
      const batch = writeBatch(db);
      orphans.forEach(o => batch.delete(doc(db, 'servants', o.id)));
      await batch.commit();
      toast.success(`${orphans.length} serviteur(s) orphelin(s) supprimé(s)`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression groupée');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Serviteurs orphelins ({orphans.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Ces serviteurs sont rattachés à un département qui n'existe plus. Vous pouvez les supprimer ou les réaffecter via la modification individuelle.
          </p>

          {orphans.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucun orphelin</p>
          ) : (
            <ul className="divide-y">
              {orphans.map(o => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.fullName}</p>
                    <p className="text-xs text-gray-500">{o.phone}</p>
                    {o.createdAt && (
                      <p className="text-xs text-gray-400">
                        Créé le {new Date(o.createdAt as any).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteOne(o.id)}
                    disabled={deleting === o.id || deletingAll}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between gap-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          {orphans.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              {deletingAll ? 'Suppression...' : `Tout supprimer (${orphans.length})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
