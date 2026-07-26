import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Mic, Pencil, Trash2, Plus } from 'lucide-react';
import { SpeakerService } from '../services/meetingTypeSpeaker.service';
import { CulteReportSpeaker } from '../types/culteReport.types';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function SpeakerSettings() {
  const [items, setItems] = useState<CulteReportSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModalProps } = useConfirmModal();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await SpeakerService.list());
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setName(''); setDescription(''); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await SpeakerService.update(editingId, name, description);
        toast.success('Orateur modifié');
      } else {
        await SpeakerService.create(name, description);
        toast.success('Orateur ajouté');
      }
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: CulteReportSpeaker) => {
    setEditingId(item.id); setName(item.name); setDescription(item.description || '');
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Supprimer cet orateur ?')) {
      try {
        await SpeakerService.remove(id);
        toast.success('Orateur supprimé');
        load();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Mic className="w-6 h-6 text-[#00665C]" /> Orateurs
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">{editingId ? 'Modifier' : 'Ajouter'} un orateur</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50">
            <Plus className="w-4 h-4" /> {editingId ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-sm border divide-y">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-400">Aucun orateur.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
