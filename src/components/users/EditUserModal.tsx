import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { PhotoUpload } from '../ui/PhotoUpload';
import { LocationField } from '../souls/form/LocationField';
import { BusinessProfileAssignment } from './BusinessProfileAssignment';
import { StorageService } from '../../services/storage.service';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { User } from '../../types/user.types';
import { BusinessProfile } from '../../types/businessProfile.types';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordResetModal from './PasswordResetModal';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    phone: '',
    email: '',
    businessProfiles: [] as BusinessProfile[],
    status: 'active' as 'active' | 'inactive',
    location: '',
    coordinates: null as { latitude: number; longitude: number; } | null,
    useGeolocation: false,
    photo: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userExplicitlyRemovedPhoto, setUserExplicitlyRemovedPhoto] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Convert existing user data to business profiles format
      let businessProfiles: BusinessProfile[] = [];
      
      if (user.businessProfiles && Array.isArray(user.businessProfiles)) {
        businessProfiles = user.businessProfiles;
      } else {
        // Convert from old format - check roles, additionalMenus, etc.
        const primaryRole = user.role || 'shepherd';
        businessProfiles.push({ type: primaryRole as any, isActive: true });
        
        // Convert additional menus to profiles if applicable
        if (user.additionalMenus?.includes('MANAGE_SERVANTS')) {
          businessProfiles.push({ type: 'department_leader', isActive: false });
        }
      }

      setFormData({
        fullName: user.fullName,
        nickname: user.nickname || '',
        phone: user.phone?.replace('+225', '') || '',
        email: user.email || '',
        businessProfiles,
        status: user.status || 'active',
        location: user.location || '',
        coordinates: user.coordinates || null,
        useGeolocation: !!user.coordinates,
        photo: null
      });
      // Reset the photo removal flag when opening the modal
      setUserExplicitlyRemovedPhoto(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    try {
      // Set submitting state at the start
      setIsSubmitting(true);
      
      console.log('Starting user update process');
      
      // Determine which collection to update
      const _table = user.fromAdminsCollection ? 'admins' : 'users';

      // Get current user data to ensure we have the latest photoURL
      const { data: currentUserDoc } = await supabase
        .from(_table)
        .select('photo_url')
        .eq('id', user.id)
        .single();
      let photoURL: string | null = currentUserDoc?.photo_url ?? null;

      console.log('Current photoURL:', photoURL);
      console.log('Form photo state:', formData.photo === null ? 'explicitly null' : formData.photo ? 'new file' : 'undefined/unchanged');
      console.log('User explicitly removed photo:', userExplicitlyRemovedPhoto);

      // Only delete the photo if the user explicitly clicked the remove button
      if (userExplicitlyRemovedPhoto && photoURL) {
        try {
          console.log('Deleting photo because user explicitly removed it:', photoURL);
          await StorageService.deleteProfilePhoto(photoURL);
          console.log('Photo deleted successfully');
        } catch (deleteError) {
          console.error('Error deleting photo:', deleteError);
          // Continue with update even if delete fails
        }
      }

      // Always set photoURL to null if user explicitly removed photo
      if (userExplicitlyRemovedPhoto) {
        photoURL = null;
      }

      // Validation de base
      if (!formData.fullName.trim()) {
        toast.error('Le nom est obligatoire');
        return;
      }

      // Upload de la nouvelle photo si elle existe
      if (formData.photo) {
        try {
          console.log('Uploading new photo for user:', user.uid);
          
          // If there's an existing photo, delete it first
          if (photoURL) {
            try {
              console.log('Deleting existing photo before upload:', photoURL);
              await StorageService.deleteProfilePhoto(photoURL);
              console.log('Old photo deleted successfully');
            } catch (deleteError) {
              console.error('Error deleting old photo:', deleteError);
              // Continue with upload even if delete fails
            }
          }
          
          const newPhotoURL = await StorageService.uploadProfilePhoto(user.uid, formData.photo);
          photoURL = newPhotoURL;
          console.log('New photo URL:', newPhotoURL);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erreur lors du téléchargement de la photo');
          return;
        }
      }

      // Validation du numéro de téléphone
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || 'Numéro de téléphone invalide');
        return;
      }

      // Email facultatif : unicité vérifiée uniquement s'il est renseigné
      const trimmedEmail = formData.email.trim();
      if (trimmedEmail) {
        const { data: emailUsers } = await supabase
          .from('users').select('id, uid')
          .eq('church_id', getChurchId()).eq('email', trimmedEmail);
        const { data: emailAdmins } = await supabase
          .from('admins').select('id, uid')
          .eq('email', trimmedEmail);
        const clash = [...(emailUsers ?? []), ...(emailAdmins ?? [])]
          .find(r => r.id !== user.id && r.uid !== user.uid);
        if (clash) {
          toast.error('Cet email est déjà utilisé');
          return;
        }
      }

      // Determine primary role from business profiles for backward compatibility
      const primaryRole = formData.businessProfiles.find(p => p.type === 'admin')?.type || 
                          formData.businessProfiles.find(p => p.type === 'adn')?.type ||
                          formData.businessProfiles.find(p => p.type === 'department_leader')?.type ||
                          formData.businessProfiles.find(p => p.type === 'shepherd')?.type ||
                          'shepherd';

      // Préparer les données pour la mise à jour (snake_case pour Supabase)
      const updateData: any = {
        full_name: formData.fullName.trim(),
        nickname: formData.nickname?.trim() || null,
        phone: phoneValidation.formattedNumber,
        email: trimmedEmail || null,
        business_profiles: formData.businessProfiles,
        role: primaryRole,
        status: formData.status,
        location: formData.location?.trim() || null,
        coordinates: formData.useGeolocation ? formData.coordinates : null,
        updated_at: new Date().toISOString(),
      };

      // Only include photo_url in the update if it has changed
      if (formData.photo || userExplicitlyRemovedPhoto) {
        updateData.photo_url = photoURL;
        console.log('Including photo_url in update:', photoURL);
      } else {
        console.log('Not updating photo_url field, keeping existing value');
      }

      // Mise à jour dans Supabase
      const { error: _updateErr } = await supabase.from(_table).update(updateData).eq('id', user.id);
      if (_updateErr) throw _updateErr;
      
      // Log the updated data for debugging
      console.log('Updated user data:', updateData);
      

      toast.success('Utilisateur modifié avec succès');
      success = true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier un utilisateur"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
        <PhotoUpload
          onChange={(file) => setFormData(prev => ({ ...prev, photo: file }))}
          currentPhotoURL={user.photoURL}
          setUserExplicitlyRemovedPhoto={setUserExplicitlyRemovedPhoto}
        />

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
            Surnom
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <LocationField
          location={formData.location}
          coordinates={formData.coordinates}
          useGeolocation={formData.useGeolocation}
          onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
          onCoordinatesChange={(coordinates) => setFormData(prev => ({ 
            ...prev, 
            coordinates,
            useGeolocation: !!coordinates 
          }))}
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
            Email <span className="text-gray-400 font-normal">(facultatif)</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="ex: jean.kouassi@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profils Métier
          </label>
          <BusinessProfileAssignment
            selectedProfiles={formData.businessProfiles}
            onChange={(profiles) => setFormData(prev => ({ ...prev, businessProfiles: profiles }))}
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

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={() => setShowPasswordResetModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 flex items-center"
          >
            <Key className="w-4 h-4 mr-2" />
            Réinitialiser le mot de passe
          </button>
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
      
      {showPasswordResetModal && (
        <PasswordResetModal
          isOpen={showPasswordResetModal}
          onClose={() => setShowPasswordResetModal(false)}
          user={{
            id: user.id,
            uid: user.uid,
            fullName: user.fullName
          }}
        />
      )}
    </Modal>
  );
}