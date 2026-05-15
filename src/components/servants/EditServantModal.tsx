import { useState, useEffect } from 'react';
import { doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Servant } from '../../types/servant.types';
import { Modal } from '../ui/Modal';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { useDepartments } from '../../hooks/useDepartments';
import { AutomaticSyncService } from '../../services/automaticSync.service';
import toast from 'react-hot-toast';

interface EditServantModalProps {
  servant: Servant;
  departmentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditServantModal({ servant, departmentName, isOpen, onClose }: EditServantModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    email: '',
    departmentId: '',
    isHead: false,
    status: 'active' as 'active' | 'inactive'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments, loading: loadingDepartments } = useDepartments();

  useEffect(() => {
    if (servant) {
      setFormData({
        fullName: servant.fullName,
        nickname: servant.nickname || '',
        gender: servant.gender,
        phone: servant.phone.replace('+225', ''),
        email: servant.email || '',
        departmentId: servant.departmentId,
        isHead: servant.isHead,
        status: servant.status || 'active'
      });
    }
  }, [servant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validation
      if (!formData.fullName.trim()) {
        toast.error('Le nom est obligatoire');
        return;
      }

      if (!formData.departmentId) {
        toast.error('Le département est obligatoire');
        return;
      }

      // Validation du numéro de téléphone
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        const errorMessage = phoneValidation.error || 'Erreur de validation du numéro de téléphone';
        toast.error(errorMessage);
        return;
      }

      // Vérifier si le numéro existe déjà (sauf pour le même serviteur)
      if (phoneValidation.formattedNumber !== servant.phone) {
        const phoneQuery = query(
          collection(db, 'servants'),
          where('phone', '==', phoneValidation.formattedNumber)
        );
        const phoneSnapshot = await getDocs(phoneQuery);
        
        if (!phoneSnapshot.empty) {
          toast.error('Ce numéro de téléphone est déjà utilisé');
          return;
        }
      }

      // Vérifier si l'email existe déjà (sauf pour le même serviteur)
      if (formData.email && formData.email !== servant.email) {
        const emailQuery = query(
          collection(db, 'servants'),
          where('email', '==', formData.email.trim())
        );
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          toast.error('Cet email est déjà utilisé');
          return;
        }
      }

      // Si le département a changé et que c'est un responsable, vérifier qu'il n'y a pas déjà un responsable
      if (formData.isHead && formData.departmentId !== servant.departmentId) {
        const headQuery = query(
          collection(db, 'servants'),
          where('departmentId', '==', formData.departmentId),
          where('isHead', '==', true),
          where('status', '==', 'active')
        );
        const headSnapshot = await getDocs(headQuery);
        
        if (!headSnapshot.empty) {
          toast.error('Ce département a déjà un responsable');
          return;
        }
      }

      // Si le serviteur n'est plus responsable mais qu'il l'était avant
      if (!formData.isHead && servant.isHead) {
        // Rien de spécial à faire ici, on peut simplement mettre à jour
      }

      // Si le serviteur devient responsable
      if (formData.isHead && !servant.isHead) {
        const headQuery = query(
          collection(db, 'servants'),
          where('departmentId', '==', formData.departmentId),
          where('isHead', '==', true),
          where('status', '==', 'active')
        );
        const headSnapshot = await getDocs(headQuery);
        
        if (!headSnapshot.empty) {
          toast.error('Ce département a déjà un responsable');
          return;
        }
      }

      // Mise à jour dans Firestore
      const servantRef = doc(db, 'servants', servant.id);
      await updateDoc(servantRef, {
        fullName: formData.fullName.trim(),
        nickname: formData.nickname.trim() || null,
        gender: formData.gender,
        phone: phoneValidation.formattedNumber,
        email: formData.email.trim() || null,
        departmentId: formData.departmentId,
        isHead: formData.isHead,
        status: formData.status,
        updatedAt: new Date()
      });

      // Synchroniser les profils si le statut isHead a changé
      await AutomaticSyncService.syncOnServantUpdate(
        {
          isHead: servant.isHead,
          email: servant.email
        },
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          departmentId: formData.departmentId,
          isHead: formData.isHead
        }
      );
      
      toast.success('Serviteur modifié avec succès');
      onClose();
    } catch (error) {
      console.error('Error updating servant:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier un serviteur"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom et Prénoms
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Surnom (optionnel)
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <GenderRadioGroup
          value={formData.gender}
          onChange={(gender) => setFormData(prev => ({ ...prev, gender: gender as 'male' | 'female' }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              +225
            </span>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const truncated = value.slice(0, 10);
                setFormData(prev => ({ ...prev, phone: truncated }));
              }}
              className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (optionnel)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Département
          </label>
          <select
            required
            value={formData.departmentId}
            onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            disabled={loadingDepartments}
          >
            <option value="">Sélectionner un département</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {loadingDepartments && (
            <p className="mt-1 text-sm text-gray-500">
              Chargement des départements...
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isHead"
            checked={formData.isHead}
            onChange={(e) => setFormData(prev => ({ ...prev, isHead: e.target.checked }))}
            className="h-4 w-4 text-[#00665C] focus:ring-[#00665C] border-gray-300 rounded"
          />
          <label htmlFor="isHead" className="ml-2 block text-sm text-gray-900">
            Responsable de département
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut du serviteur
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Un serviteur inactif n'apparaîtra plus dans les listes principales
          </p>
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