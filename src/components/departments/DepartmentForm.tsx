import { useState } from 'react';

import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { useUsersByProfile } from '../../hooks/useUsersByProfile';
import { getProfileDepartmentIds } from '../../types/businessProfile.types';

interface DepartmentFormProps {
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

export default function DepartmentForm({ onSuccess }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { users: leaderCandidates, loading: loadingLeaders } = useUsersByProfile([
    'department_leader',
    'adn',
    'shepherd',
    'family_leader',
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.name.trim()) {
        toast.error('Le nom du département est obligatoire');
        return;
      }

      // Vérifier si le nom existe déjà
      const { data: nameData } = await supabase.from('departments').select('id').eq('church_id', getChurchId()).eq('name', formData.name.trim()).limit(1);
      if (nameData && nameData.length > 0) {
        toast.error('Un département avec ce nom existe déjà');
        return;
      }

      // Récupérer l'ordre le plus élevé
      const { data: orderData } = await supabase.from('departments').select('order').eq('church_id', getChurchId()).order('order', { ascending: false }).limit(1);
      const lastOrder = orderData && orderData.length > 0 ? (orderData[0].order ?? 0) : 0;

      const leaderUser = leaderCandidates.find(u => u.id === formData.leaderId);
      const newDepartmentId = crypto.randomUUID();

      const { error: insertErr } = await supabase.from('departments').insert({
        id: newDepartmentId,
        church_id: getChurchId(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        leader: leaderUser?.fullName || '',
        leader_id: formData.leaderId || null,
        order: lastOrder + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      });
      if (insertErr) throw insertErr;

      if (formData.leaderId) {
        await syncLeaderBusinessProfile(formData.leaderId, newDepartmentId);
      }

      setFormData({ name: '', description: '', leaderId: '' });
      toast.success('Département ajouté avec succès');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding department:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du département
        </label>
        <input
          type="text"
          required
          placeholder="ex: Accueil"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Responsable du département
        </label>
        <select
          value={formData.leaderId}
          onChange={(e) => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
          disabled={isSubmitting || loadingLeaders}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="">-- Sélectionner un responsable --</option>
          {leaderCandidates.map(u => (
            <option key={u.id} value={u.id}>
              {u.fullName}{u.nickname ? ` (${u.nickname})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Description du département..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
      >
        {isSubmitting ? 'Ajout en cours...' : 'Ajouter le département'}
      </button>
    </form>
  );
}