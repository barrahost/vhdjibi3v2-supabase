import { useState, useEffect } from 'react';

import { Servant } from '../../types/servant.types';
import { Modal } from '../ui/Modal';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { PhoneInput } from '../ui/PhoneInput';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { useDepartments } from '../../hooks/useDepartments';
import { AutomaticSyncService } from '../../services/automaticSync.service';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

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
    departmentIds: [] as string[],
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
        departmentIds: servant.departmentIds || [],
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

      if (formData.departmentIds.length === 0) {
        toast.error('Sélectionnez au moins un département');
        return;
      }

      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || 'Numéro de téléphone invalide');
        return;
      }

      const { error: updateErr } = await supabase.from('servants').update({
        full_name: formData.fullName.trim(),
        nickname: formData.nickname.trim() || null,
        gender: formData.gender,
        phone: phoneValidation.formattedNumber,
        email: formData.email.trim() || null,
        department_ids: formData.departmentIds,
        is_head: formData.isHead,
        status: formData.status,
        updated_at: new Date().toISOString(),
      }).eq('id', servant.id);
      if (updateErr) throw updateErr;

      await AutomaticSyncService.syncOnServantUpdate(
        { isHead: servant.isHead, email: servant.email },
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          departmentId: formData.departmentIds[0] || '',
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
      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
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
          <PhoneInput
            required
            value={formData.phone}
            onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
          />
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
            Département(s) *
          </label>
          {loadingDepartments ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto divide-y divide-gray-100">
              {departments.map(dept => (
                <label key={dept.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.departmentIds.includes(dept.id)}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        departmentIds: e.target.checked
                          ? [...prev.departmentIds, dept.id]
                          : prev.departmentIds.filter(id => id !== dept.id),
                      }));
                    }}
                    className="h-4 w-4 text-[#00665C] focus:ring-[#00665C] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{dept.name}</span>
                </label>
              ))}
            </div>
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