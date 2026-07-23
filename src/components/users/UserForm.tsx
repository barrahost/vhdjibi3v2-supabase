import { useState } from 'react';

import { ServantService } from '../../services/servant.service';
import toast from 'react-hot-toast';
import { PhotoUpload } from '../ui/PhotoUpload';
import { BusinessProfileAssignment } from './BusinessProfileAssignment';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { LocationField } from '../souls/form/LocationField';
import { StorageService } from '../../services/storage.service';
import { BusinessProfile } from '../../types/businessProfile.types';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

const DEFAULT_PASSWORDS = {
  ADMIN: '@123456',
  SHEPHERD: '@123456',
  ADN: '@123456'
};

interface UserFormProps {
  onSuccess?: () => void;
}

export default function UserForm({ onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    phone: '',
    email: '',
    businessProfiles: [] as BusinessProfile[],
    password: DEFAULT_PASSWORDS.ADMIN,
    location: '',
    coordinates: null as { latitude: number; longitude: number; } | null,
    photo: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePasswordForProfiles = (profiles: BusinessProfile[]) => {
    let password = DEFAULT_PASSWORDS.ADMIN;
    if (profiles.some(p => p.type === 'admin')) {
      password = DEFAULT_PASSWORDS.ADMIN;
    } else if (profiles.some(p => p.type === 'adn')) {
      password = DEFAULT_PASSWORDS.ADN;
    } else if (profiles.some(p => p.type === 'shepherd' || p.type === 'department_leader' || p.type === 'family_leader')) {
      password = DEFAULT_PASSWORDS.SHEPHERD;
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let docRef = null;
      let photoURL = null;

      // Validation du numéro de téléphone
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || 'Numéro de téléphone invalide');
        return;
      }

      // Vérifier si le numéro existe déjà
      const { data: phoneData } = await supabase.from('users').select('id').eq('church_id', getChurchId()).eq('phone', phoneValidation.formattedNumber).limit(1);
      if (phoneData && phoneData.length > 0) {
        toast.error('Ce numéro de téléphone est déjà utilisé');
        return;
      }

      // Vérifier si l'email existe déjà — uniquement s'il est renseigné
      const trimmedEmail = formData.email.trim();
      if (trimmedEmail) {
        const { data: emailData } = await supabase.from('users').select('id').eq('church_id', getChurchId()).eq('email', trimmedEmail).limit(1);
        if (emailData && emailData.length > 0) {
          toast.error('Cet email est déjà utilisé');
          return;
        }
      }

      // Générer un ID unique pour l'utilisateur
      const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Upload de la photo si elle existe
      if (formData.photo) {
        try {
          photoURL = await StorageService.uploadProfilePhoto(uid, formData.photo);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erreur lors du téléchargement de la photo');
        }
      }

      // Determine primary role from business profiles
      const primaryRole = formData.businessProfiles.find(p => p.type === 'admin')?.type ||
                          formData.businessProfiles.find(p => p.type === 'adn')?.type ||
                          formData.businessProfiles.find(p => p.type === 'department_leader')?.type ||
                          formData.businessProfiles.find(p => p.type === 'shepherd')?.type ||
                          'shepherd';

      // Créer l'utilisateur dans Firestore
      const { data: insertedUser, error: _insertErr } = await supabase.from('users').insert({
        church_id: getChurchId(),
        id: uid,
        full_name: formData.fullName.trim(),
        nickname: formData.nickname?.trim() || null,
        email: trimmedEmail || null,
        role: primaryRole,
        business_profiles: formData.businessProfiles,
        password: formData.password,
        phone: phoneValidation.formattedNumber,
        location: formData.location?.trim() || null,
        coordinates: formData.coordinates,
        photo_url: photoURL,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      }).select('id').single();
      docRef = { id: insertedUser?.id ?? '' };

      if (!docRef || !docRef.id) {
        throw new Error('Failed to create user document');
      }

      setFormData({
        fullName: '',
        nickname: '',
        phone: '',
        email: '',
        businessProfiles: [],
        password: DEFAULT_PASSWORDS.ADMIN,
        location: '',
        coordinates: null,
        photo: null
      });

      // Si berger ou responsable de département → créer aussi un serviteur
      const hasShepherdProfile = formData.businessProfiles.some(
        p => p.type === 'shepherd' || p.type === 'department_leader'
      );
      if (hasShepherdProfile) {
        try {
          await ServantService.createServant({
            fullName: formData.fullName.trim(),
            nickname: formData.nickname?.trim() || undefined,
            gender: 'male',
            phone: phoneValidation.formattedNumber || '',
            email: trimmedEmail || '',
            departmentIds: [],
            isHead: false,
            isShepherd: true,
            shepherdId: docRef.id
          });
          toast.success('Utilisateur et serviteur ajoutés avec succès. Un mot de passe par défaut a été attribué.');
        } catch (servantError) {
          console.error('Error creating servant entry:', servantError);
          toast.error('Utilisateur ajouté, mais erreur lors de la création du serviteur correspondant.');
        }
      } else {
        toast.success('Utilisateur ajouté avec succès. Un mot de passe par défaut a été attribué.');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <PhotoUpload
          onChange={(file) => setFormData(prev => ({ ...prev, photo: file }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom et Prénoms
          </label>
          <input
            type="text"
            required
            placeholder="ex: Jean Kouassi"
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
            placeholder="ex: Pat"
            value={formData.nickname}
            onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

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
              placeholder="0757000203"
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

        <LocationField
          location={formData.location}
          coordinates={formData.coordinates}
          onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
          onCoordinatesChange={(coordinates) => setFormData(prev => ({ ...prev, coordinates }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="email"
            placeholder="ex: jean.kouassi@example.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
          <p className="mt-1 text-xs text-gray-400">
            La connexion se fait par numéro de téléphone — l'email n'est pas requis.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profils Métier
          </label>
          <BusinessProfileAssignment
            selectedProfiles={formData.businessProfiles}
            onChange={(profiles) => {
              setFormData(prev => ({ ...prev, businessProfiles: profiles }));
              updatePasswordForProfiles(profiles);
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe par défaut
          </label>
          <input
            type="text"
            value={formData.password}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
          />
          <p className="mt-1 text-sm text-gray-500">
            Mot de passe par défaut qui sera attribué à l'utilisateur selon ses profils
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || formData.businessProfiles.length === 0}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
        >
          {isSubmitting ? 'Ajout en cours...' : "Ajouter l'utilisateur"}
        </button>
      </div>
    </form>
  );
}
