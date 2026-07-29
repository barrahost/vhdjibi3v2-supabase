import { useState } from 'react';

import { Servant } from '../../types/servant.types';
import { Department } from '../../types/department.types';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { ServantService } from '../../services/servant.service';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface OrphanedServantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orphans: Servant[];
  departments: Department[];
}

export default function OrphanedServantsModal({ isOpen, onClose, orphans, departments }: OrphanedServantsModalProps) {
  const { confirm, confirmModalProps } = useConfirmModal();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<Record<string, string>>({});

  const activeDepartments = departments.filter(d => d.status === 'active');

  if (!isOpen) return null;

  const handleDeleteOne = async (id: string) => {
    const _confirmed = await confirm('Supprimer définitivement ce B.O.S.S orphelin ?');
    if (!_confirmed) return;
    try {
      setDeleting(id);
      const { error: _deleteErr } = await supabase.from('servants').delete().eq('id', id);
      toast.success('B.O.S.S orphelin supprimé');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!await confirm(`Supprimer définitivement les ${orphans.length} B.O.S.S orphelin(s) ?`)) return;
    try {
      setDeletingAll(true);
      const ids = orphans.map(o => o.id);
      await supabase.from('servants').delete().in('id', ids);
      toast.success(`${orphans.length} B.O.S.S orphelin(s) supprimé(s)`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression groupée');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleAssign = async (servantId: string) => {
    const deptId = selectedDept[servantId];
    if (!deptId) {
      toast.error('Choisis un département');
      return;
    }
    try {
      setAssigning(servantId);
      await ServantService.updateServant(servantId, { departmentIds: [deptId] });
      toast.success('B.O.S.S réaffecté');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la réaffectation');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">B.O.S.S orphelins ({orphans.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Ces B.O.S.S sont rattachés à un département qui n'existe plus. Réaffecte-les à un département existant, ou supprime-les.
          </p>

          {orphans.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucun orphelin</p>
          ) : (
            <ul className="divide-y">
              {orphans.map(o => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{o.fullName}</p>
                    <p className="text-xs text-gray-500">{o.phone}</p>
                    {o.createdAt && (
                      <p className="text-xs text-gray-400">
                        Créé le {new Date(o.createdAt as any).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={selectedDept[o.id] || ''}
                      onChange={e => setSelectedDept(prev => ({ ...prev, [o.id]: e.target.value }))}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:ring-[#00665C] focus:border-[#00665C]"
                    >
                      <option value="">Choisir un département</option>
                      {activeDepartments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssign(o.id)}
                      disabled={assigning === o.id || !selectedDept[o.id]}
                      title="Assigner à ce département"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOne(o.id)}
                      disabled={deleting === o.id || deletingAll}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
    <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
