import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, Pencil, Trash2, Plus } from 'lucide-react';
import { MeetingTypeService } from '../services/meetingTypeSpeaker.service';
import { CulteReportMeetingType } from '../types/culteReport.types';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function MeetingTypeSettings() {
  const [items, setItems] = useState<CulteReportMeetingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModalProps } = useConfirmModal();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await MeetingTypeService.list());
    } catch (error) {
      console.error('Error loading meeting types:', error);
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
        await MeetingTypeService.update(editingId, name, description);
        toast.success('Type de rencontre modifié');
      } else {
        await MeetingTypeService.create(name, description);
        toast.success('Type de rencontre ajouté');
      }
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: CulteReportMeetingType) => {
    setEditingId(item.id); setName(item.name); setDescription(item.description || '');
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Supprimer ce type de rencontre ?')) {
      try {
        await MeetingTypeService.remove(id);
        toast.success('Type de rencontre supprimé');
        load();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
        <CalendarClock className="w-6 h-6 text-[#00665C]" /> Types de rencontre
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">{editingId ? 'Modifier' : 'Ajouter'} un type de rencontre</h2>
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
          <div className="p-6 text-center text-gray-400">Aucun type de rencontre.</div>
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
