import { useState, useEffect } from 'react';

import { Search, Pencil, Trash2 } from 'lucide-react';
import { EditCategoryModal } from './EditCategoryModal';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from('audio_categories').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      } else {
        setCategories((data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          status: r.status,
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          updatedAt: r.updated_at ? new Date(r.updated_at) : new Date()
        })));
      }
      setLoading(false);
    };
    loadCategories();

    const channel = supabase.channel('audio_categories_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_categories' }, () => loadCategories())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDelete = async (category: Category) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        const { error: _deleteErr } = await supabase.from('audio_categories').delete().eq('id', category.id);
        toast.success('Catégorie supprimée avec succès');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredCategories.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune catégorie trouvée
            </div>
          ) : (
            filteredCategories.map(category => (
              <div key={category.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 mt-2 rounded text-xs font-medium ${
                      category.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCategory(category)}
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
              </div>
            ))
          )}
        </div>
      </div>

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}