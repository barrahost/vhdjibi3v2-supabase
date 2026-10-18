import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface EditAttendanceModalProps {
  attendance: {
    id: string;
    date: Date;
    present: boolean;
    notes?: string;
  };
  soulName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Corrige une présence (statut, note). Le jour ne se change pas ici : pour un autre culte, on pointe ce jour-là
 * (sinon l'âme aurait deux présences le même jour).
 */
export default function EditAttendanceModal({ attendance, soulName, isOpen, onClose, onSaved }: EditAttendanceModalProps) {
  const [formData, setFormData] = useState({
    present: true,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (attendance) {
      setFormData({
        present: attendance.present,
        notes: attendance.notes || ''
      });
    }
  }, [attendance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: updated, error: updateErr } = await supabase.from('attendances').update({
        present: formData.present,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', attendance.id).eq('church_id', getChurchId()).select('id');
      if (updateErr) throw updateErr;
      if (!updated || updated.length === 0) throw new Error('modification refusée par la base de données');

      toast.success('Présence modifiée avec succès');
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('La présence n’a pas été modifiée. Vérifiez votre connexion et réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier une présence"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
        <div className="text-sm text-gray-700">
          {soulName && <p className="font-medium text-gray-900">{soulName}</p>}
          <p className="first-letter:uppercase">
            {attendance.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={formData.present}
                onChange={() => setFormData(prev => ({ ...prev, present: true }))}
                className="form-radio text-[#00665C] focus:ring-[#00665C]"
              />
              <span className="ml-2">Présent(e)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={!formData.present}
                onChange={() => setFormData(prev => ({ ...prev, present: false }))}
                className="form-radio text-red-600 focus:ring-red-600"
              />
              <span className="ml-2">Absent(e)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            placeholder="Notes optionnelles..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}