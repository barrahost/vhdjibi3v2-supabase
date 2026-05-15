import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Modal } from '../../ui/Modal';
import { MessageSquare } from 'lucide-react';
import { SMS_VARIABLES } from '../../../types/sms.types';
import toast from 'react-hot-toast';

const MAX_LENGTH = 125; // Reduced to 125 to allow for appending user info

interface EditSMSTemplateModalProps {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditSMSTemplateModal({ templateId, isOpen, onClose }: EditSMSTemplateModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'active' as 'active' | 'inactive',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialData, setInitialData] = useState(formData);
  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const docRef = doc(db, 'smsTemplates', templateId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const templateData = {
            title: data.title,
            content: data.content,
            status: data.status,
            category: data.category || ''
          };
          setFormData(templateData);
          setInitialData(templateData);
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast.error('Erreur lors du chargement du modèle');
      }
    };

    if (isOpen && templateId) {
      loadTemplate();
    }
  }, [templateId, isOpen]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesQuery = query(
          collection(db, 'smsCategories'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(categoriesQuery);
        setCategories(snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })));
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

      if (formData.title.length > 100) {
        toast.error('Le titre ne doit pas dépasser 100 caractères');
        return;
      }

      if (formData.content.length > 1000) {
        toast.error('Le contenu ne doit pas dépasser 1000 caractères');
        return;
      }

      const templateRef = doc(db, 'smsTemplates', templateId);
      await updateDoc(templateRef, {
        ...formData,
        updatedAt: new Date()
      });

      toast.success('Modèle modifié avec succès');
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Erreur lors de la modification du modèle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier un modèle SMS"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.title.length}/100 caractères
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Aucune catégorie</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            maxLength={MAX_LENGTH}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
          <div className={`flex items-center space-x-2 mt-1 text-sm ${
            formData.content.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-500'
          }`}>
            <MessageSquare className="w-4 h-4" />
            <span>{formData.content.length}/{MAX_LENGTH} caractères</span>
            <span className="text-amber-600 ml-2">
              (Limité à 125 car le nom et numéro de l'expéditeur seront ajoutés)
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Variables disponibles :</h4>
          <div className="space-y-1">
            {SMS_VARIABLES.map(variable => (
              <div key={variable.key} className="text-sm text-gray-600">
                <code className="bg-gray-100 px-1 py-0.5 rounded">{variable.key}</code>
                {' - '}{variable.label} (ex: {variable.example})
              </div>
            ))}
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

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !hasUnsavedChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}