import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Cake, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface BirthdayFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function BirthdayForm({ onSuccess, onClose, isModal = false }: BirthdayFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    birthMonth: '',
    birthDay: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validation de base
      if (!formData.fullName.trim() || !formData.birthMonth || !formData.birthDay || !formData.phone) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      // Valider le jour en fonction du mois
      const daysInMonth = new Date(2024, parseInt(formData.birthMonth), 0).getDate();
      if (parseInt(formData.birthDay) > daysInMonth) {
        toast.error(`Le jour sélectionné n'est pas valide pour ce mois`);
        return;
      }

      // Vérifier si le numéro existe déjà
      const phoneQuery = query(
        collection(db, 'birthdays'),
        where('phone', '==', formData.phone)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        toast.error('Ce numéro de téléphone est déjà enregistré');
        return;
      }

      await addDoc(collection(db, 'birthdays'), {
        ...formData,
        birthDate: `${formData.birthMonth}-${formData.birthDay}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Si en mode modal, utiliser l'ancien comportement
      if (isModal) {
        toast.success('Date d\'anniversaire enregistrée avec succès !');
        setFormData({
          fullName: '',
          nickname: '',
          birthMonth: '',
          birthDay: '',
          phone: ''
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Rediriger vers la page de confirmation avec les données
        navigate('/anniversaires/merci', {
          state: {
            fullName: formData.fullName,
            birthMonth: formData.birthMonth,
            birthDay: formData.birthDay
          }
        });
      }
    } catch (error) {
      console.error('Error saving birthday:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom et Prénoms *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            placeholder="Ex: Jean Kouassi"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Surnom
        </label>
        <input
          type="text"
          value={formData.nickname}
          onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          placeholder="Ex: Jean"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date d'anniversaire
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mois *</label>
            <select
              required
              value={formData.birthMonth}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                birthMonth: e.target.value,
                // Réinitialiser le jour si le nouveau mois a moins de jours
                birthDay: parseInt(prev.birthDay) > new Date(2024, parseInt(e.target.value), 0).getDate() 
                  ? '' 
                  : prev.birthDay
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionner</option>
              <option value="01">Janvier</option>
              <option value="02">Février</option>
              <option value="03">Mars</option>
              <option value="04">Avril</option>
              <option value="05">Mai</option>
              <option value="06">Juin</option>
              <option value="07">Juillet</option>
              <option value="08">Août</option>
              <option value="09">Septembre</option>
              <option value="10">Octobre</option>
              <option value="11">Novembre</option>
              <option value="12">Décembre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jour *</label>
            <select
              required
              value={formData.birthDay}
              onChange={(e) => setFormData(prev => ({ ...prev, birthDay: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              disabled={!formData.birthMonth}
            >
              <option value="">Sélectionner</option>
              {formData.birthMonth && Array.from(
                { length: new Date(2024, parseInt(formData.birthMonth), 0).getDate() },
                (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {i + 1}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone *
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
            className="pl-16 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            placeholder="0757000203"
            maxLength={10}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50 transition-all duration-200 hover:shadow-xl"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#00665C]/10 rounded-full">
              <Cake className="w-12 h-12 text-[#00665C]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Collecte des Dates d'Anniversaire
          </h1>
          <p className="mt-2 text-gray-600">
            Partagez votre date d'anniversaire avec nous pour que nous puissions célébrer ensemble !
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-[#00665C] p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-[#00665C] mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                Réservé aux membres
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Ce formulaire est destiné aux membres de l'église Vases d'Honneur Assemblée Grâce Confondante. Si vous êtes membre, merci de renseigner vos informations ci-dessous.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          {formContent}
        </div>
      </div>
    </div>
  );
}