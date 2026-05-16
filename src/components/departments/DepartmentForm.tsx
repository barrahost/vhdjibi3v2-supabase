import { useState } from 'react';

import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function DepartmentForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '' // Ajout du champ leader
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.name.trim()) {
        toast.error('Le nom du département est obligatoire');
        return;
      }

      // Vérifier si le nom existe déjà
      const { data: nameData } = await supabase.from('departments').select('id').eq('name', formData.name.trim()).limit(1);
      if (nameData && nameData.length > 0) {
        toast.error('Un département avec ce nom existe déjà');
        return;
      }

      // Récupérer l'ordre le plus élevé
      const { data: orderData } = await supabase.from('departments').select('order').order('order', { ascending: false }).limit(1);
      const lastOrder = orderData && orderData.length > 0 ? (orderData[0].order ?? 0) : 0;

      const { error: _insertErr } = await supabase.from('departments').insert({
        ...formData,
        name: formData.name.trim(),
        leader: formData.leader.trim(), // Ajout du leader
        order: lastOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      });

      setFormData({ name: '', description: '', leader: '' });
      toast.success('Département ajouté avec succès');
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
        <input
          type="text"
          placeholder="Nom du responsable"
          value={formData.leader}
          onChange={(e) => setFormData(prev => ({ ...prev, leader: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={isSubmitting}
        />
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