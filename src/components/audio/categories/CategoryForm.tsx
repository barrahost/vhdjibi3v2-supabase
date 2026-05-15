import { useState } from 'react';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import toast from 'react-hot-toast';

export function CategoryForm() {
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

      if (!formData.name.trim()) {
        toast.error('Le nom de la catégorie est obligatoire');
        return;
      }

      // Check if category already exists
      const existingQuery = query(
        collection(db, 'audio_categories'),
        where('name', '==', formData.name.trim())
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        toast.error('Une catégorie avec ce nom existe déjà');
        return;
      }

      await addDoc(collection(db, 'audio_categories'), {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
      
      toast.success('Catégorie ajoutée avec succès');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de la catégorie *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          placeholder="ex: Culte"
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
          placeholder="Description de la catégorie..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
      >
        {isSubmitting ? 'Ajout en cours...' : 'Ajouter la catégorie'}
      </button>
    </form>
  );
}