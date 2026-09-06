import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { Modal } from '../ui/Modal';
import { Soul } from '../../types/database.types';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDepartments } from '../../hooks/useDepartments';
import { ServantService } from '../../services/servant.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soul: Soul;
  onSuccess?: () => void;
}

export default function PromoteToServantModal({ isOpen, onClose, soul, onSuccess }: Props) {
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments } = useDepartments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (departmentIds.length === 0) {
      toast.error('Sélectionnez au moins un département');
      return;
    }
    setIsSubmitting(true);
    try {
      const now = new Date();

      const servantId = await ServantService.createServant({
        fullName: soul.fullName,
        nickname: soul.nickname,
        gender: soul.gender,
        phone: soul.phone || '',
        email: '',
        departmentIds,
        familyId: soul.serviceFamilyId,
        isHead: false,
        status: 'active',
        sourceType: 'soul',
        sourceId: soul.id,
        originalSoulId: soul.id,
        promotionDate: now,
        spiritualProfile: soul.spiritualProfile,
      });

      // Marquer l'âme comme promue
      const { error: soulErr } = await supabase
        .from('souls')
        .update({
          is_servant: true,
          servant_id: servantId,
          promotion_to_servant_date: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', soul.id)
        .eq('church_id', getChurchId());

      if (soulErr) throw soulErr;

      toast.success(`${soul.fullName} est maintenant B.O.S.S`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promouvoir en B.O.S.S">
      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
        <div className="bg-[#00665C]/5 border border-[#00665C]/20 rounded-lg p-4 space-y-1">
          <p className="text-sm font-semibold text-gray-900">{soul.fullName}</p>
          {soul.phone && <p className="text-sm text-gray-500">📞 {soul.phone}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {soul.spiritualProfile?.isBornAgain && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                Né(e) de nouveau
              </span>
            )}
            {soul.spiritualProfile?.isBaptized && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                Baptisé(e)
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Département(s) *</label>
          <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100">
            {departments.map(d => (
              <label key={d.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={departmentIds.includes(d.id)}
                  onChange={e => setDepartmentIds(prev =>
                    e.target.checked ? [...prev, d.id] : prev.filter(id => id !== d.id)
                  )}
                  className="h-4 w-4 text-[#00665C] focus:ring-[#00665C] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{d.name}</span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Cette âme disparaîtra de la liste des âmes et apparaîtra dans Gestion des B.O.S.S.
          Ses données de progression restent accessibles.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            {isSubmitting ? 'Promotion...' : 'Promouvoir'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
