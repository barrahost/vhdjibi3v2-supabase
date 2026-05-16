import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { User, Mail, Phone, Calendar, Shield, Save, X, Camera, Navigation, AlertCircle, Trash2, Key, MapPin, PlayCircle } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { StorageService } from '../../services/storage.service';
import { supabase } from '../../lib/supabase';
 
import { formatDate } from '../../utils/dateUtils';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import toast from 'react-hot-toast';
import SelfPasswordResetModal from './SelfPasswordResetModal';

interface UserData {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  location?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  photoURL?: string | null;
  uid: string;
}

export function UserProfileModal() {
  const { user, userRole } = useAuth();
  const { restart: restartTour, tourRole } = useOnboarding();
  const { isProfileModalOpen, closeProfileModal } = useUserProfile();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    coordinates: null as { latitude: number; longitude: number; } | null,
    useGeolocation: false,
    photo: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Chercher dans la collection users
        const { data: usersRows } = await supabase
          .from('users')
          .select('*')
          .eq('id', (() => { const s = localStorage.getItem('user'); return s ? JSON.parse(s).id : ''; })())
          .limit(1);

        if (usersRows && usersRows.length > 0) {
          const data = usersRows[0];
          const loaded: UserData = {
            id: data.id,
            fullName: data.full_name,
            phone: data.phone?.replace('+225', '') || '',
            email: data.email,
            location: data.location,
            photoURL: data.photo_url,
            createdAt: data.created_at ? new Date(data.created_at) : new Date(),
            lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
            uid: data.id
          };
          setUserData(loaded);
          setFormData({
            fullName: loaded.fullName,
            phone: loaded.phone,
            location: loaded.location || '',
            coordinates: data.coordinates,
            useGeolocation: !!data.coordinates,
            photo: null
          });
          return;
        }

        // Si non trouvé, chercher dans admins
        const { data: adminRows } = await supabase
          .from('admins')
          .select('*')
          .eq('id', (() => { const s = localStorage.getItem('user'); return s ? JSON.parse(s).id : ''; })())
          .limit(1);

        if (adminRows && adminRows.length > 0) {
          const data = adminRows[0];
          const loaded: UserData = {
            id: data.id,
            fullName: data.full_name,
            phone: data.phone?.replace('+225', '') || '',
            email: data.email,
            location: data.location,
            photoURL: data.photo_url,
            createdAt: data.created_at ? new Date(data.created_at) : new Date(),
            lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
            uid: data.id
          };
          setUserData(loaded);
          setFormData({
            fullName: loaded.fullName,
            phone: loaded.phone,
            location: loaded.location || '',
            coordinates: data.coordinates,
            useGeolocation: !!data.coordinates,
            photo: null
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (isProfileModalOpen) {
      loadUserData();
      setIsEditing(false);
    }
  }, [user, isProfileModalOpen]);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setFormData(prev => ({ ...prev, coordinates: coords }));
        setGeoLoading(false);
        toast.success('Position mise à jour avec succès');
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Impossible de récupérer la position';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vous devez autoriser la géolocalisation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible. Vérifiez votre GPS';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé. Réessayez';
            break;
          default:
            errorMessage = 'Impossible de récupérer la position';
            break;
        }
        
        setGeoError(errorMessage);
        toast.error(errorMessage as string);
        setGeoLoading(false);
        setFormData(prev => ({ ...prev, useGeolocation: false }));
      }
    );
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrateur';
      case 'shepherd':
        return 'Berger(e)';
      case 'adn':
        return 'ADN';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'pasteur':
        return 'bg-indigo-100 text-indigo-800';
      case 'shepherd':
        return 'bg-green-100 text-green-800';
      case 'adn':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setIsSubmitting(true);

      let photoURL = userData?.photoURL;

      // Si une nouvelle photo est sélectionnée
      if (formData.photo) {
        try {
          const currentUser = localStorage.getItem('user');
          if (!currentUser) {
            throw new Error('Utilisateur non connecté');
          }
          const userData = JSON.parse(currentUser);
          
          // If there's an existing photo, delete it first
          if (photoURL) {
            try {
              await StorageService.deleteProfilePhoto(photoURL);
            } catch (deleteError) {
              console.error('Error deleting old photo:', deleteError);
              // Continue with upload even if delete fails
            }
          }
          
          photoURL = await StorageService.uploadProfilePhoto(userData.uid, formData.photo);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erreur lors du téléchargement de la photo');
          return;
        }
      }

      // Validation du numéro de téléphone
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error ?? 'Erreur de validation du numéro de téléphone');
        return;
      }

      // Vérifier si le numéro existe déjà
      try {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, uid')
          .eq('phone', phoneValidation.formattedNumber);
        
        const { data: adminsData } = await supabase
          .from('admins')
          .select('id, uid')
          .eq('phone', phoneValidation.formattedNumber);
        
        const currentUid = user?.uid;
        const existingUser = [...(usersData ?? []), ...(adminsData ?? [])]
          .find(row => row.uid !== currentUid);
        
        if (existingUser) {
          toast.error('Ce numéro de téléphone est déjà utilisé');
          return;
        }
      } catch (error) {
        console.error('Error checking phone number:', error);
        toast.error('Erreur lors de la vérification du numéro');
        return;
      }

      // Mise à jour dans Supabase
      const _table = userRole === 'super_admin' ? 'admins' : 'users';
      
      // Vérifier si le document existe avant de le mettre à jour
      const { data: existingDoc } = await supabase
        .from(_table)
        .select('id')
        .eq('id', userData.id)
        .single();
      
      if (!existingDoc) {
        toast.error("Utilisateur non trouvé dans la base de données");
        setIsSubmitting(false);
        return;
      }
      
      const { error: updateErr } = await supabase
        .from(_table)
        .update({
          full_name: formData.fullName.trim(),
          phone: phoneValidation.formattedNumber,
          location: formData.location.trim(),
          coordinates: formData.useGeolocation ? formData.coordinates : null,
          photo_url: photoURL,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id);
      
      if (updateErr) throw updateErr;

      // Mettre à jour les données locales
      setUserData(prev => prev ? {
        ...prev,
        fullName: formData.fullName.trim(),
        phone: phoneValidation.formattedNumber as string,
        location: formData.location.trim(),
        photoURL
      } : null);

      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
      closeProfileModal();
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Erreur lors de la mise à jour du profil';
      if (error instanceof Error) {
        if (error.message === "Utilisateur non trouvé dans la base de données") {
          errorMessage = "L'utilisateur n'existe pas ou a été supprimé.";
        } else if (error.message === "Ce numéro de téléphone est déjà utilisé") {
          errorMessage = "Ce numéro de téléphone est déjà associé à un autre compte.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !userData) return null;

  return (
    <Modal
      isOpen={isProfileModalOpen}
      onClose={closeProfileModal}
      title="Profil Utilisateur"
    >
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-8">
          {/* En-tête du profil */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {isEditing ? (
                <div 
                  className="relative w-24 h-24"
                >
                  <div 
                    onClick={() => document.getElementById('photo-input')?.click()}
                    className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative group overflow-hidden"
                  >
                    {formData.photo || userData?.photoURL ? (
                      <>
                        <img 
                          src={formData.photo ? URL.createObjectURL(formData.photo) : userData?.photoURL!}
                          alt="Photo de profil"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {(formData.photo || userData?.photoURL) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, photo: null }));
                       // Clear the preview by setting photoURL to null
                       setUserData(prev => prev ? { ...prev, photoURL: null } : null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('La photo ne doit pas dépasser 5MB');
                          return;
                        }
                        setFormData(prev => ({ ...prev, photo: file }));
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {userData?.photoURL ? (
                    <img 
                      src={userData.photoURL}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                  placeholder="Nom et Prénoms"
                  required
                />
              ) : (
                <h2 className="text-2xl font-semibold text-gray-900">
                  {userData.fullName}
                </h2>
              )}
              <div className="mt-1 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Informations de contact
            </h3>
            
            <div className="flex items-center space-x-3 text-gray-600">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-sm">{userData.email}</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-600">
              <Phone className="w-5 h-5 text-gray-400" />
              {isEditing ? (
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    +225
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const truncated = value.slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: truncated }));
                    }}
                    className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                    placeholder="0757000203"
                    maxLength={10}
                    required
                  />
                </div>
              ) : (
                <span className="text-sm">{userData.phone}</span>
              )}
            </div>

            <div className="flex items-center space-x-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                    placeholder="Lieu d'habitation"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.useGeolocation}
                        onChange={(e) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            useGeolocation: e.target.checked,
                            coordinates: e.target.checked ? prev.coordinates : null
                          }));
                          if (e.target.checked && !formData.coordinates) {
                            getCurrentPosition();
                          }
                        }}
                        className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                      />
                      <span className="text-sm text-gray-700">
                        Utiliser la géolocalisation
                      </span>
                    </label>
                  </div>

                  {formData.useGeolocation && (
                    <div className="space-y-2">
                      {geoError && (
                        <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          <AlertCircle className="w-4 h-4" />
                          <span>{geoError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        {formData.coordinates ? (
                          <>
                            <div className="text-sm text-gray-600">
                              <div>Latitude: {formData.coordinates.latitude.toFixed(6)}</div>
                              <div>Longitude: {formData.coordinates.longitude.toFixed(6)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={getCurrentPosition}
                              className="flex items-center px-3 py-1 text-sm text-[#00665C] hover:bg-[#00665C]/10 rounded-md"
                              disabled={geoLoading}
                            >
                              <Navigation className="w-4 h-4 mr-1" />
                              {geoLoading ? 'Mise à jour...' : 'Mettre à jour'}
                            </button>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {geoLoading ? 'Récupération de la position...' : 'Position non disponible'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm">{userData.location || 'Non renseigné'}</span>
              )}
            </div>
          </div>

          {/* Informations du compte */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Informations du compte
            </h3>
            
            <div className="flex items-center space-x-3 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-sm">
                  Membre depuis le {formatDate(userData.createdAt)}
                </span>
                {userData.lastLoginAt && (
                  <span className="text-xs text-gray-500">
                    Dernière connexion le {formatDate(userData.lastLoginAt)}
                  </span>
                )}
              </div>
            </div>

            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setShowPasswordResetModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors w-full"
                >
                  <Key className="w-4 h-4" />
                  <span className="text-sm font-medium">Changer mon mot de passe</span>
                </button>
                {tourRole && (
                  <button
                    type="button"
                    onClick={() => { closeProfileModal(); setTimeout(restartTour, 150); }}
                    className="flex items-center space-x-2 px-3 py-2 bg-[#00665C]/10 text-[#00665C] rounded-md hover:bg-[#00665C]/20 transition-colors w-full"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Revoir le tutoriel de démarrage</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    fullName: userData.fullName,
                    phone: userData.phone,
                    location: userData.location || '',
                    coordinates: null,
                    useGeolocation: false,
                    photo: null
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2 inline-block" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/10"
            >
              Modifier le profil
            </button>
          )}
        </div>
      </form>

      {showPasswordResetModal && (
        <SelfPasswordResetModal
          isOpen={showPasswordResetModal}
          onClose={() => setShowPasswordResetModal(false)}
          uid={userData.uid}
        />
      )}
    </Modal>
  );
}