import { useState, useEffect } from 'react';
import { addDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUsersByProfile } from '../../hooks/useUsersByProfile';
import toast from 'react-hot-toast';

export default function ServiceFamilyForm() {
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

      const nameQuery = query(
        collection(db, 'serviceFamilies'),
        where('name', '==', formData.name.trim())
      );
      const nameSnapshot = await getDocs(nameQuery);
      if (!nameSnapshot.empty) {
        toast.error('Une famille avec ce nom existe déjà');
        return;
      }

      const orderQuery = query(
        collection(db, 'serviceFamilies'),
        orderBy('order', 'desc'),
        limit(1)
      );
      const orderSnapshot = await getDocs(orderQuery);
      const lastOrder = orderSnapshot.empty ? 0 : orderSnapshot.docs[0].data().order;

      // Récupérer le nom du responsable pour le champ legacy `leader`
      const leaderUser = leaderCandidates.find(u => u.id === formData.leaderId);

      await addDoc(collection(db, 'serviceFamilies'), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        leader: leaderUser?.fullName || '', // legacy compat
        leaderId: formData.leaderId || null,
        shepherdIds: formData.shepherdIds,
        order: lastOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      });

      setFormData({ name: '', description: '', leaderId: '', shepherdIds: [] });
      toast.success('Famille ajoutée avec succès');
    } catch (error: any) {
      console.error('Error adding service family:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de la famille
        </label>
        <input
          type="text"
          required
          placeholder="ex: Ruben"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Responsable de famille
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
        <p className="mt-1 text-xs text-gray-500">
          Utilisateurs avec un profil "Responsable de Famille", "Berger" ou "Responsable de Département"
        </p>
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
          placeholder="Description de la famille..."
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
        {isSubmitting ? 'Ajout en cours...' : 'Ajouter la famille'}
      </button>
    </form>
  );
}
