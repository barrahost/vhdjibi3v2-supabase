import { useState } from 'react';
import { X, Calendar, CheckSquare, Square } from 'lucide-react';
import { Servant } from '../../types/servant.types';
import { ActivityType, ACTIVITY_TYPE_LABELS } from '../../types/departmentActivity.types';
import { DepartmentActivityService } from '../../services/departmentActivity.service';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  departmentId: string;
  servants: Servant[];
  createdBy?: string;
}

const ACTIVITY_TYPES: ActivityType[] = ['prayer', 'youth', 'agape', 'meeting', 'other'];

export function DepartmentActivityModal({ isOpen, onClose, onSaved, departmentId, servants, createdBy }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('prayer');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const togglePresent = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setPresentIds(new Set(servants.map((s) => s.id)));
  const clearAll = () => setPresentIds(new Set());

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Titre requis'); return; }
    if (!date) { toast.error('Date requise'); return; }
    setSaving(true);
    try {
      await DepartmentActivityService.createActivity(
        departmentId,
        { title: title.trim(), type, date, notes: notes.trim() || undefined, createdBy },
        [...presentIds],
        servants.map((s) => s.id)
      );
      toast.success('Activité enregistrée');
      onSaved();
      handleClose();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setType('prayer');
    setDate(today);
    setNotes('');
    setPresentIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Nouvelle activité</h2>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    type === t
                      ? 'bg-[#00665C] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ACTIVITY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Ex: ${ACTIVITY_TYPE_LABELS[type]} du dimanche`}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              <Calendar className="inline w-3 h-3 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
            />
          </div>

          {/* Présences */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">
                Présents — {presentIds.size}/{servants.length}
              </label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] text-[#00665C] font-medium hover:underline">
                  Tous
                </button>
                <span className="text-gray-300 text-[10px]">·</span>
                <button onClick={clearAll} className="text-[10px] text-gray-400 hover:underline">
                  Aucun
                </button>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {servants.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">Aucun B.O.S.S dans ce département</p>
              ) : (
                servants.map((s) => {
                  const isPresent = presentIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => togglePresent(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        isPresent ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                        isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className={`flex-1 text-sm truncate ${isPresent ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {s.fullName}
                      </span>
                      {isPresent
                        ? <CheckSquare className="w-4 h-4 text-[#00665C] flex-shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      }
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observations, points de prière..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 h-10 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 text-sm font-medium text-white bg-[#00665C] rounded-xl hover:bg-[#00665C]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
