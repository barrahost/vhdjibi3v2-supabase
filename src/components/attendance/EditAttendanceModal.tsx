import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/input';
import toast from 'react-hot-toast';

interface EditAttendanceModalProps {
  attendance: {
    id: string;
    date: Date;
    present: boolean;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAttendanceModal({ attendance, isOpen, onClose }: EditAttendanceModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    present: true,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (attendance) {
      const date = attendance.date.toISOString().split('T')[0];
      
      setFormData({
        date,
        present: attendance.present,
        notes: attendance.notes || ''
      });
    }
  }, [attendance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validate date
      const selectedDate = new Date(formData.date);
      const dayOfWeek = selectedDate.getDay();
      const validDays = [2, 4, 6]; // Tuesday, Thursday, Saturday

      if (!validDays.includes(dayOfWeek)) {
        toast.error('Les présences ne sont autorisées que les Mardis, Jeudis et Samedis');
        return;
      }

      // Update in Firestore
      const attendanceRef = doc(db, 'attendances', attendance.id);
      await updateDoc(attendanceRef, {
        date: selectedDate,
        present: formData.present,
        notes: formData.notes.trim(),
        updatedAt: new Date()
      });
      
      toast.success('Présence modifiée avec succès');
      onClose();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Erreur lors de la modification');
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
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <Input
          label="Date du culte"
          id="date"
          type="date"
          required
          value={formData.date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        />

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