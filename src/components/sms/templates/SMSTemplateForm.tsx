import { useState, useEffect } from 'react';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SMS_VARIABLES } from '../../../types/sms.types';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_LENGTH = 125; // Reduced to 125 to allow for appending user info

export default function SMSTemplateForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [categories, setCategories] = useState<Array<{id: string; name: string; status: string}>>([]);
  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesQuery = query(
          collection(db, 'smsCategories'),
          where('status', 'in', ['active', 'inactive'])
        );
        const snapshot = await getDocs(categoriesQuery);
        setCategories(snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          status: doc.data().status
        })));
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      if (!formData.title.trim()) {
        toast.error('Le titre est obligatoire');
        return;
      }

      if (!formData.content.trim()) {
        toast.error('Le contenu est obligatoire');
        return;
      }

      if (formData.content.length > MAX_LENGTH) {
        toast.error(`Le message ne doit pas dépasser ${MAX_LENGTH} caractères`);
        return;
      }

      await addDoc(collection(db, 'smsTemplates'), {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setFormData({
        title: '',
        content: '',
        category: '',
        status: 'active'
      });

      toast.success('Modèle ajouté avec succès');
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Erreur lors de l\'ajout du modèle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          placeholder="ex: Rappel de culte"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catégorie
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={loading}
        >
          <option value="">Sélectionner une catégorie</option>
          {categories
            .filter(cat => cat.status === 'active')
            .map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
          ))}
        </select>
        {loading && (
          <p className="mt-1 text-sm text-gray-500">
            Chargement des catégories...
          </p>
        )}
        {!loading && categories.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Aucune catégorie disponible
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contenu
        </label>
        <div className="space-y-2">
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            maxLength={MAX_LENGTH}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            placeholder="Contenu du message..."
          />
          <div className={`flex items-center space-x-2 text-sm ${
            formData.content.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-500'
          }`}>
            <MessageSquare className="w-4 h-4" />
            {formData.content.length}/{MAX_LENGTH} caractères
            <span className="text-amber-600 ml-2">
              (Limité à 125 car le nom et numéro de l'expéditeur seront ajoutés)
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">Variables disponibles :</p>
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                <code className="bg-gray-100 px-1 py-0.5 rounded">[nom]</code>
                {' - '}Nom complet de l'âme (ex: Jean Kouassi)
              </div>
              <div className="text-sm text-gray-600">
                <code className="bg-gray-100 px-1 py-0.5 rounded">[surnom]</code>
                {' - '}Surnom de l'âme, ou nom complet si pas de surnom (ex: Jean)
              </div>
            </div>
          </div>
        </div>
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
        {isSubmitting ? 'Ajout en cours...' : 'Ajouter le modèle'}
      </button>
    </form>
  );
}