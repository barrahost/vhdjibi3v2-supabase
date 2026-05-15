import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EditSoulTabs } from './tabs/EditSoulTabs';
import { SMSTemplate } from '../../types/sms.types';
import { SMSService } from '../../services/sms.service';
import { PhotoUpload } from '../ui/PhotoUpload';
import { StorageService } from '../../services/storage.service';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import { CheckCircle2, Plus, List, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface LastAddedSoul {
  fullName: string;
  nickname?: string;
  phone?: string;
  serviceFamilyName?: string;
  originSource?: 'culte' | 'evangelisation';
  smsSent: boolean;
}

const initialFormData = {
  general: {
    gender: '',
    fullName: '',
    nickname: '',
    phone: '',
    location: '',
    coordinates: null as { latitude: number; longitude: number } | null,
    firstVisitDate: new Date().toISOString().split('T')[0],
    shepherdId: undefined as string | undefined,
    isUndecided: false,
    photo: null as File | null,
    status: 'active' as 'active' | 'inactive',
    originSource: '' as '' | 'culte' | 'evangelisation',
    serviceFamilyId: undefined as string | undefined,
  },
  spiritual: {
    isBornAgain: false,
    isBaptized: false,
    isEnrolledInAcademy: false,
    isEnrolledInLifeBearers: false,
    departments: [] as { name: string; startDate: Date }[],
  },
};

export default function SoulForm() {
  const navigate = useNavigate();
  const { families } = useServiceFamilies(true);
  const [formData, setFormData] = useState(initialFormData);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [lastAddedSoul, setLastAddedSoul] = useState<LastAddedSoul | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await SMSService.getTemplates('Bienvenue');
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Erreur lors du chargement des modèles');
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const buildLastAdded = (smsSent: boolean): LastAddedSoul => {
    const familyName = formData.general.serviceFamilyId
      ? families.find((f) => f.id === formData.general.serviceFamilyId)?.name
      : undefined;
    return {
      fullName: formData.general.fullName.trim(),
      nickname: formData.general.nickname.trim() || undefined,
      phone: formData.general.phone || undefined,
      serviceFamilyName: familyName,
      originSource: (formData.general.originSource || undefined) as
        | 'culte'
        | 'evangelisation'
        | undefined,
      smsSent,
    };
  };

  const resetFormState = () => {
    setFormData(initialFormData);
    setSelectedTemplate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedTemplate) {
        toast.error('Veuillez sélectionner un modèle de message de bienvenue');
        return;
      }
      if (!formData.general.fullName.trim()) {
        toast.error('Le nom est obligatoire');
        return;
      }
      if (!formData.general.gender) {
        toast.error('Le genre est obligatoire');
        return;
      }
      if (!formData.general.location.trim()) {
        toast.error("Le lieu d'habitation est obligatoire");
        return;
      }
      if (!formData.general.originSource) {
        toast.error("La provenance de l'âme est obligatoire");
        return;
      }

      const soulData = {
        fullName: formData.general.fullName.trim(),
        nickname: formData.general.nickname.trim() || null,
        gender: formData.general.gender,
        phone: formData.general.phone,
        isUndecided: formData.general.isUndecided,
        location: formData.general.location.trim(),
        coordinates: formData.general.coordinates,
        firstVisitDate: new Date(formData.general.firstVisitDate),
        shepherdId: formData.general.shepherdId,
        originSource: formData.general.originSource,
        serviceFamilyId: formData.general.serviceFamilyId || null,
        spiritualProfile: formData.spiritual,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      };

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      const user = JSON.parse(userStr);

      let photoURL: string | undefined = undefined;
      if (formData.general.photo) {
        const soulIdForPhoto = `soul_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        photoURL = await StorageService.uploadProfilePhoto(
          soulIdForPhoto,
          formData.general.photo
        );
      }

      const docRef = await addDoc(collection(db, 'souls'), {
        ...soulData,
        createdBy: user.id,
        photoURL: photoURL || null,
      });

      if (!docRef.id) {
        throw new Error("Erreur lors de l'ajout de l'âme");
      }

      // Envoi du SMS de bienvenue
      let smsSent = false;
      try {
        const template = templates.find((t) => t.id === selectedTemplate);
        if (!template) {
          throw new Error('Modèle de message non trouvé');
        }

        const creditCheck = await SMSService.checkSufficientCredits();
        if (!creditCheck.sufficient) {
          toast.error(
            "Crédit SMS insuffisant. Le SMS de bienvenue n'a pas été envoyé."
          );
          const recap = buildLastAdded(false);
          resetFormState();
          setLastAddedSoul(recap);
          toast.success('Âme ajoutée avec succès');
          return;
        }

        await SMSService.sendSMS(
          soulData.phone.replace('+225', ''),
          template.content,
          soulData.fullName,
          soulData.nickname || undefined
        );

        await SMSService.createSMSInteraction(
          user.id,
          docRef.id,
          template.content,
          new Date()
        );
        smsSent = true;
      } catch (smsError) {
        console.error('Error sending welcome SMS:', smsError);
        if (
          smsError instanceof Error &&
          smsError.message.includes('Crédit SMS insuffisant')
        ) {
          toast.error(
            "Crédit SMS insuffisant. Le SMS de bienvenue n'a pas été envoyé."
          );
        } else {
          // L'âme est conservée — on avertit simplement l'utilisateur.
          toast.error(
            "Le SMS de bienvenue n'a pas pu être envoyé. L'âme a bien été ajoutée — vous pouvez lui envoyer un SMS manuellement depuis la liste des âmes."
          );
        }
        smsSent = false;
      }

      const recap = buildLastAdded(smsSent);
      resetFormState();
      setLastAddedSoul(recap);
      toast.success('Âme ajoutée avec succès');
    } catch (error) {
      console.error('Error adding soul:', error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'ajout de l'âme"
      );
    }
  };

  // Vue de confirmation après ajout réussi
  if (lastAddedSoul) {
    const Row = ({ label, value }: { label: string; value?: string }) =>
      value ? (
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
          <dt className="text-sm font-medium text-gray-500 sm:w-40">{label}</dt>
          <dd className="text-sm text-gray-900 sm:flex-1">{value}</dd>
        </div>
      ) : null;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-green-900">
              Âme enregistrée avec succès
            </h2>
            <p className="text-sm text-green-800 mt-0.5">
              Les informations ont bien été ajoutées à la base.
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <dl className="divide-y divide-gray-100">
            <Row label="Nom complet" value={lastAddedSoul.fullName} />
            <Row label="Surnom" value={lastAddedSoul.nickname} />
            <Row label="Téléphone" value={lastAddedSoul.phone} />
            <Row label="Famille de service" value={lastAddedSoul.serviceFamilyName} />
            <Row
              label="Provenance"
              value={
                lastAddedSoul.originSource === 'culte'
                  ? 'Culte'
                  : lastAddedSoul.originSource === 'evangelisation'
                  ? 'Évangélisation'
                  : undefined
              }
            />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 py-1.5">
              <dt className="text-sm font-medium text-gray-500 sm:w-40">
                SMS de bienvenue
              </dt>
              <dd className="text-sm sm:flex-1">
                {lastAddedSoul.smsSent ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="w-4 h-4" /> Envoyé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="w-4 h-4" /> Non envoyé
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setLastAddedSoul(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4" />
            Enregistrer une autre âme
          </button>
          <button
            type="button"
            onClick={() => navigate('/souls')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] hover:bg-[#00665C]/10 rounded-md"
          >
            <List className="w-4 h-4" />
            Voir la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message de bienvenue *
        </label>
        <select
          required
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={loadingTemplates}
        >
          <option value="">Sélectionner un modèle de message de bienvenue</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">* Champ obligatoire</p>
        {loadingTemplates && (
          <p className="mt-1 text-sm text-gray-500">Chargement des modèles...</p>
        )}
        {!loadingTemplates && templates.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            Aucun modèle de message disponible dans la catégorie "Bienvenue"
          </p>
        )}
      </div>

      <PhotoUpload
        onChange={(file) =>
          setFormData((prev) => ({
            ...prev,
            general: { ...prev.general, photo: file },
          }))
        }
      />

      <EditSoulTabs data={formData} onChange={setFormData} />

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C]"
      >
        Ajouter une âme
      </button>
    </form>
  );
}
