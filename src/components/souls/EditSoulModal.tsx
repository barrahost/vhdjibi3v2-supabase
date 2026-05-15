import { useState, useEffect } from 'react';
import { doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Soul } from '../../types/database.types';
import { Modal } from '../ui/Modal';
import { EditSoulTabs } from './tabs/EditSoulTabs';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { validateSoulData } from '../../utils/validation/soulValidation';
import { sanitizeSoulData } from '../../utils/validation/soulSanitizer';
import { formatDateForInput } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { PhotoUpload } from '../ui/PhotoUpload';
import { StorageService } from '../../services/storage.service';
import { isShepherdUser } from '../../utils/roleHelpers';
import toast from 'react-hot-toast';

interface EditSoulModalProps {
  soul: Soul;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function EditSoulModal({ soul, isOpen, onClose, onUpdate }: EditSoulModalProps) {
  const { user, userRole } = useAuth();
  const [formData, setFormData] = useState({
    general: {
      gender: 'male' as 'male' | 'female',
      fullName: '',
      nickname: '',
      phone: '',
      location: '',
      isUndecided: false,
      coordinates: null as { latitude: number; longitude: number; } | null,
      firstVisitDate: '',
      shepherdId: undefined as string | undefined,
      status: 'active' as 'active' | 'inactive',
      photo: null as File | null,
      originSource: '' as '' | 'culte' | 'evangelisation',
      serviceFamilyId: undefined as string | undefined,
    },
    spiritual: {} as Soul['spiritualProfile']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentShepherdId, setCurrentShepherdId] = useState<string | undefined>(undefined);
  const [userExplicitlyRemovedPhoto, setUserExplicitlyRemovedPhoto] = useState(false);

  // Charger les informations du berger si l'utilisateur est un berger
  useEffect(() => {
    const loadShepherdInfo = async () => {
      if (!user || userRole !== 'shepherd') return;

      try {
        const shepherdsQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('status', '==', 'active')
        );
        const shepherdDoc = await getDocs(shepherdsQuery);
        const matched = shepherdDoc.docs.find(d => isShepherdUser(d.data() as any));

        if (matched) {
          setCurrentShepherdId(matched.id);
        }
      } catch (error) {
        console.error('Error loading shepherd info:', error);
      }
    };

    loadShepherdInfo();
  }, [user, userRole]);

  // Charger les données de l'âme
  useEffect(() => {
    if (soul && isOpen) {
      setFormData({
        general: {
          gender: soul.gender,
          fullName: soul.fullName,
          nickname: soul.nickname || '',
          phone: soul.phone.replace('+225', ''),
          location: soul.location,
          isUndecided: soul.isUndecided || false,
          coordinates: soul.coordinates ?? null,
          firstVisitDate: formatDateForInput(soul.firstVisitDate),
          shepherdId: soul.shepherdId,
          status: soul.status || 'active',
          photo: null,
          originSource: (soul.originSource as 'culte' | 'evangelisation') || '',
          serviceFamilyId: soul.serviceFamilyId,
        },
        spiritual: soul.spiritualProfile
      });
      setUserExplicitlyRemovedPhoto(false);
    }
  }, [soul, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success = false;
    try {
      setIsSubmitting(true);

      // Vérifier les permissions d'édition
      if (userRole === 'shepherd') {
        // Un berger ne peut modifier que ses âmes assignées
        if (soul.shepherdId !== currentShepherdId) {
          toast.error('Vous ne pouvez modifier que les âmes qui vous sont assignées');
          return;
        }
      }

      // Validation du numéro de téléphone
      const phoneValidation = validatePhoneNumber(formData.general.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error ?? 'Numéro de téléphone invalide');
        return;
      }

      // Préparer les données pour validation
      const { originSource: rawOrigin, ...restGeneral } = formData.general;
      const dataToValidate = {
        ...restGeneral,
        firstVisitDate: new Date(formData.general.firstVisitDate),
        phone: phoneValidation.formattedNumber as string,
        shepherdId: formData.general.shepherdId ?? undefined,
        originSource: rawOrigin === '' ? undefined : rawOrigin,
        spiritualProfile: formData.spiritual
      };

      // Valider les données
      const validation = validateSoulData(dataToValidate);
      if (!validation.isValid) {
        toast.error(validation.error ?? 'Erreur de validation des données');
        return;
      }

      // Pour les bergers, forcer leur ID comme shepherdId
      if (userRole === 'shepherd' && currentShepherdId) {
        dataToValidate.shepherdId = currentShepherdId;
      }

      let photoURL = soul.photoURL;

      // Gérer la suppression de la photo
      if (userExplicitlyRemovedPhoto && photoURL) {
        try {
          await StorageService.deleteProfilePhoto(photoURL);
          photoURL = undefined;
        } catch (deleteError) {
          console.error('Error deleting photo:', deleteError);
        }
      }

      // Gérer le téléchargement d'une nouvelle photo
      if (formData.general.photo) {
        try {
          // Supprimer l'ancienne photo si elle existe
          if (photoURL) {
            await StorageService.deleteProfilePhoto(photoURL);
          }
          photoURL = await StorageService.uploadProfilePhoto(soul.id, formData.general.photo);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erreur lors du téléchargement de la photo');
          return;
        }
      }

      // Sanitize data for Firestore
      const updateData = sanitizeSoulData({
        ...dataToValidate,
        shepherdId: formData.general.isUndecided ? undefined : dataToValidate.shepherdId,
        // Don't update createdAt if it already exists
        createdAt: soul.createdAt || new Date(),
        photoURL: photoURL
      });

      // Ajouter explicitement le statut indécis
      updateData.isUndecided = formData.general.isUndecided;

      // Mise à jour dans Firestore
      const soulRef = doc(db, 'souls', soul.id);
      await updateDoc(soulRef, updateData);
      
      toast.success('Modifications enregistrées avec succès');
      if (onUpdate) {
        onUpdate();
      }
      onClose();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating soul:', error);
      toast.error('Erreur lors de la modification: Vérifiez les données saisies');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier une âme"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b">
            <PhotoUpload
              onChange={(file) => setFormData(prev => ({
                ...prev,
                general: { ...prev.general, photo: file }
              }))}
              currentPhotoURL={soul.photoURL}
              setUserExplicitlyRemovedPhoto={setUserExplicitlyRemovedPhoto}
            />
          </div>
          <EditSoulTabs
            data={formData}
            onChange={setFormData}
            isShepherd={userRole === 'shepherd'}
            currentShepherdId={currentShepherdId}
            soul={soul}
            onSoulUpdate={onUpdate}
          />
        </div>

        <div className="p-6 border-t bg-gray-50 mt-auto">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md disabled:opacity-50"
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
        </div>
      </form>
    </Modal>
  );
}