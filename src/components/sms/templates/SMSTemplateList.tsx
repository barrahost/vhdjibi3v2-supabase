import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SMSTemplate } from '../../../types/sms.types';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';
import EditSMSTemplateModal from './EditSMSTemplateModal';
import { SMSTemplatePreview } from './SMSTemplatePreview';
import toast from 'react-hot-toast';

export default function SMSTemplateList() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'smsTemplates'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTemplates(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SMSTemplate)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (templateId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.')) {
      try {
        await deleteDoc(doc(db, 'smsTemplates', templateId));
        toast.success('Modèle supprimé avec succès');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Erreur lors de la suppression du modèle');
      }
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Rechercher un modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Aperçu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dernière modification
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {template.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {template.category || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {template.content.slice(0, 50)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(template.updatedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingTemplateId(template.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTemplateId && (
        <EditSMSTemplateModal
          templateId={editingTemplateId}
          isOpen={!!editingTemplateId}
          onClose={() => setEditingTemplateId(null)}
        />
      )}
    </div>
  );
}