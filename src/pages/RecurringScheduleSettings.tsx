import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CalendarRange, Pencil, Trash2, Plus } from 'lucide-react';
import { RecurringScheduleService } from '../services/culteEvent.service';
import { CulteRecurringSchedule, DayOfWeek, DAY_OF_WEEK_LABELS } from '../types/culteReport.types';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const DAY_OPTIONS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export default function RecurringScheduleSettings() {
  const [items, setItems] = useState<CulteRecurringSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingTypeName, setMeetingTypeName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(0);
  const [startTime, setStartTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModalProps } = useConfirmModal();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await RecurringScheduleService.list());
    } catch (error) {
      console.error('Error loading recurring schedules:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setMeetingTypeName(''); setDayOfWeek(0); setStartTime(''); setIsActive(true); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTypeName.trim()) {
      toast.error('Le type de rencontre est obligatoire');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await RecurringScheduleService.update(editingId, meetingTypeName, dayOfWeek, isActive, startTime || null);
        toast.success('Programme modifié');
      } else {
        await RecurringScheduleService.create(meetingTypeName, dayOfWeek, startTime || null);
        toast.success('Programme ajouté');
      }
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: CulteRecurringSchedule) => {
    setEditingId(item.id); setMeetingTypeName(item.meetingTypeName); setDayOfWeek(item.dayOfWeek); setStartTime(item.startTime || ''); setIsActive(item.isActive);
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Supprimer cette entrée du programme récurrent ?')) {
      try {
        await RecurringScheduleService.remove(id);
        toast.success('Entrée supprimée');
        load();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarRange className="w-6 h-6 text-[#00665C]" /> Programme récurrent
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Les cultes listés ici sont créés automatiquement chaque semaine (le jour indiqué), pour que les responsables de département puissent y rattacher leur rapport sans attendre "Gestion des Cultes".
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">{editingId ? 'Modifier' : 'Ajouter'} une entrée récurrente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de rencontre</label>
            <input type="text" required value={meetingTypeName} onChange={(e) => setMeetingTypeName(e.target.value)} placeholder="ex: Rendez-Vous des Champions" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jour de la semaine</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value) as DayOfWeek)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
              {DAY_OPTIONS.map((d) => <option key={d} value={d}>{DAY_OF_WEEK_LABELS[d]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début (optionnel)</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
            <p className="mt-1 text-xs text-gray-400">Utilisée pour les liens de réception d'âmes ADN (disponibles 30 min après ce début).</p>
          </div>
        </div>
        {editingId && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Actif (génère automatiquement le culte chaque semaine)
          </label>
        )}
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
          <div className="p-6 text-center text-gray-400">Aucune entrée récurrente.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{item.meetingTypeName}</p>
                <p className="text-sm text-gray-500">
                  {DAY_OF_WEEK_LABELS[item.dayOfWeek]}
                  {item.startTime && <span className="ml-1">· {item.startTime.slice(0, 5)}</span>}
                  {!item.isActive && <span className="ml-2 text-amber-600">(inactif)</span>}
                </p>
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
