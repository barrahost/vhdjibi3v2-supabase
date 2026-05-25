import { useState } from 'react';

import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';

export function SpeakerForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        toast.error("Le nom de l'orateur est obligatoire");
        return;
      }

      // Vérifier qu'un orateur du même nom n'existe pas déjà (insensible à la casse)
      const { data: existingDocs } = await supabase
        .from('audio_speakers')
        .select('id')
        .eq('church_id', getChurchId())
        .ilike('name', trimmedName)
        .limit(1);
      if (existingDocs && existingDocs.length > 0) {
        toast.error('Un orateur avec ce nom existe déjà');
        return;
      }

      const { error: insertErr } = await supabase.from('audio_speakers').insert({
        church_id: getChurchId(),
        name: trimmedName,
        description: formData.description.trim(),
        status: formData.status,
      });
      if (insertErr) throw insertErr;

      setFormData({ name: '', description: '', status: 'active' });
      toast.success('Orateur ajouté avec succès');
    } catch (error) {
      console.error('Error adding speaker:', error);
      toast.error("Erreur lors de l'ajout de l'orateur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'orateur *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          placeholder="ex: Pasteur Mohammed Sanogo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          placeholder="Fonction, titre, notes…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Statut
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
      >
        {isSubmitting ? 'Ajout en cours...' : "Ajouter l'orateur"}
      </button>
    </form>
  );
}
