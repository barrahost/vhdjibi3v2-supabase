import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useUsersByProfile } from '../../hooks/useUsersByProfile';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { getProfileDepartmentIds } from '../../types/businessProfile.types';

interface Department {
  id: string;
  name: string;
  description: string;
  leader?: string;
  leaderId?: string;
}

interface EditDepartmentModalProps {
  department: Department;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Adds departmentId to the user's department_leader profile without dropping any department they already lead. */
async function syncLeaderBusinessProfile(userId: string, departmentId: string) {
  const { data: userRow } = await supabase.from('users').select('business_profiles').eq('id', userId).single();
  const profiles: any[] = userRow?.business_profiles || [];
  const hasLeaderProfile = profiles.some((p) => p.type === 'department_leader');
  const updatedProfiles = hasLeaderProfile
    ? profiles.map((p) => {
        if (p.type !== 'department_leader') return p;
        const ids = new Set(getProfileDepartmentIds(p));
        ids.add(departmentId);
        return { ...p, departmentId: undefined, departmentIds: Array.from(ids) };
      })
    : [...profiles, { type: 'department_leader', isActive: true, isPrimary: profiles.length === 0, departmentIds: [departmentId] }];
  await supabase.from('users').update({ business_profiles: updatedProfiles }).eq('id', userId);
}

export default function EditDepartmentModal({ department, isOpen, onClose, onSuccess }: EditDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { users: leaderCandidates, loading: loadingLeaders } = useUsersByProfile([
    'department_leader',
    'adn',
    'shepherd',
    'family_leader',
  ]);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
        leaderId: department.leaderId || '',
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.name.trim()) {
        toast.error('Le nom du département est obligatoire');
        return;
      }

      if (formData.name.trim() !== department.name) {
        const { data: nameData } = await supabase
          .from('departments')
          .select('id')
          .eq('church_id', getChurchId())
          .eq('name', formData.name.trim())
          .neq('id', department.id)
          .limit(1);

        if (nameData && nameData.length > 0) {
          toast.error('Un département avec ce nom existe déjà');
          return;
        }
      }

      const leaderUser = leaderCandidates.find(u => u.id === formData.leaderId);

      const { error: updateErr } = await supabase
        .from('departments')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          leader: leaderUser?.fullName || department.leader || '',
          leader_id: formData.leaderId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', department.id);

      if (updateErr) throw updateErr;

      if (formData.leaderId) {
        await syncLeaderBusinessProfile(formData.leaderId, department.id);
      }

      toast.success('Département modifié avec succès');
      if (onSuccess) onSuccess(); else onClose();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier un département">
      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du département
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsable du département
          </label>
          <select
            value={formData.leaderId}
            onChange={(e) => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
            disabled={loadingLeaders}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">-- Sélectionner un responsable --</option>
            {leaderCandidates.map(u => (
              <option key={u.id} value={u.id}>
                {u.fullName}{u.nickname ? ` (${u.nickname})` : ''}
              </option>
            ))}
          </select>
          {!formData.leaderId && department.leader && (
            <p className="mt-1 text-xs text-amber-600">
              Responsable actuel (texte legacy) : <strong>{department.leader}</strong> — sélectionnez un utilisateur pour le lier
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
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
