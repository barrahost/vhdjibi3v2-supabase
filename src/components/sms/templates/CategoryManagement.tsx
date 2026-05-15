import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active' });
    setShowAddForm(false);
    setEditingCategoryId(null);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesQuery = query(
        collection(db, 'smsCategories'),
        where('status', 'in', ['active', 'inactive'])
      );
      const snapshot = await getDocs(categoriesQuery);
      setCategories(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category)));
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        toast.error('Le nom de la catégorie est obligatoire');
        return;
      }
      if (!formData.name.trim()) {
        toast.error('Le nom de la catégorie est obligatoire');
        return;
      }

      // Vérifier si le nom existe déjà
      const existingQuery = query(
        collection(db, 'smsCategories'),
        where('name', '==', formData.name.trim())
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!editingCategoryId && !existingDocs.empty) {
        toast.error('Une catégorie avec ce nom existe déjà');
        return;
      }

      if (editingCategoryId) {
        // Mise à jour
        await updateDoc(doc(db, 'smsCategories', editingCategoryId), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Catégorie modifiée avec succès');
      } else {
        // Création
        await addDoc(collection(db, 'smsCategories'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Catégorie ajoutée avec succès');
      }

      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de l\'enregistrement de la catégorie');
    }
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        // Vérifier si la catégorie est utilisée
        const templatesQuery = query(
          collection(db, 'smsTemplates'),
          where('category', '==', category.name)
        );
        const templatesSnapshot = await getDocs(templatesQuery);
        
        if (!templatesSnapshot.empty) {
          toast.error('Cette catégorie est utilisée par des modèles et ne peut pas être supprimée');
          return;
        }

        await deleteDoc(doc(db, 'smsCategories', category.id));
        toast.success('Catégorie supprimée avec succès');
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Erreur lors de la suppression de la catégorie');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#00665C]">
          Catégories de modèles
        </h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter une catégorie
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {/* Formulaire d'ajout */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-gray-50">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de la catégorie"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="p-2 text-[#00665C] hover:bg-[#00665C]/10 rounded-md"
                    title="Enregistrer"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                    title="Annuler"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de la catégorie (optionnel)"
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                rows={2}
              />
            </form>
          )}

          {categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune catégorie trouvée
            </div>
          ) : (
            categories.map(category => (
              <div key={category.id}>
                {editingCategoryId === category.id ? (
                  <form onSubmit={handleSubmit} className="p-4 bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom de la catégorie"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                      />
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="p-2 text-[#00665C] hover:bg-[#00665C]/10 rounded-md"
                          title="Enregistrer"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                          title="Annuler"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description de la catégorie (optionnel)"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                      rows={2}
                    />
                  </form>
                ) : (
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 mt-2 rounded text-xs font-medium ${
                        category.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setFormData({
                            name: category.name,
                            description: category.description,
                            status: category.status
                          });
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}