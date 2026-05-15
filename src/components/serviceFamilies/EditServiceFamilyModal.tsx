import { useState, useEffect } from 'react';
import { doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import { useUsersByProfile } from '../../hooks/useUsersByProfile';
import toast from 'react-hot-toast';

interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader?: string;
  leaderId?: string;
  shepherdIds?: string[];
}

interface EditServiceFamilyModalProps {
  family: ServiceFamily;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditServiceFamilyModal({ family, isOpen, onClose }: EditServiceFamilyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
    shepherdIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { users: leaderCandidates, loading: loadingLeaders } = useUsersByProfile([
    'family_leader',
    'shepherd',
    'department_leader',
  ]);
  const { users: shepherds, loading: loadingShepherds } = useUsersByProfile(['shepherd']);

  useEffect(() => {
    if (family) {
      setFormData({
        name: family.name,
        description: family.description || '',
        leaderId: family.leaderId || '',
        shepherdIds: family.shepherdIds || [],
      });
    }
  }, [family]);

  const toggleShepherd = (id: string) => {
    setFormData(prev => ({
      ...prev,
      shepherdIds: prev.shepherdIds.includes(id)
        ? prev.shepherdIds.filter(x => x !== id)
        : [...prev.shepherdIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.name.trim()) {
        toast.error('Le nom de la famille est obligatoire');
        return;
      }

      if (formData.name.trim() !== family.name) {
        const nameQuery = query(
          collection(db, 'serviceFamilies'),
          where('name', '==', formData.name.trim())
        );
        const nameSnapshot = await getDocs(nameQuery);
        if (!nameSnapshot.empty) {
          toast.error('Une famille avec ce nom existe déjà');
          return;
        }
      }

      const leaderUser = leaderCandidates.find(u => u.id === formData.leaderId);

      const familyRef = doc(db, 'serviceFamilies', family.id);
      await updateDoc(familyRef, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        leader: leaderUser?.fullName || family.leader || '', // legacy compat
        leaderId: formData.leaderId || null,
        shepherdIds: formData.shepherdIds,
        updatedAt: new Date()
      });

      toast.success('Famille modifiée avec succès');
      onClose();
    } catch (error: any) {
      console.error('Error updating service family:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier une famille">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la famille
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
            Responsable de famille
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
          {!formData.leaderId && family.leader && (
            <p className="mt-1 text-xs text-amber-600">
              Responsable actuel (texte legacy) : <strong>{family.leader}</strong> — sélectionnez un utilisateur pour le lier
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bergers de la famille
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
            {loadingShepherds && <p className="text-sm text-gray-500">Chargement...</p>}
            {!loadingShepherds && shepherds.length === 0 && (
              <p className="text-sm text-gray-500">Aucun berger disponible</p>
            )}
            {shepherds.map(s => (
              <label key={s.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.shepherdIds.includes(s.id)}
                  onChange={() => toggleShepherd(s.id)}
                  className="rounded text-[#00665C] focus:ring-[#00665C]"
                />
                <span className="text-sm text-gray-700">
                  {s.fullName}{s.nickname ? ` (${s.nickname})` : ''}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formData.shepherdIds.length} berger(s) sélectionné(s)
          </p>
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
