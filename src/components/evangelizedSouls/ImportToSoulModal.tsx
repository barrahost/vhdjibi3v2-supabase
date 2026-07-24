import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import ShepherdSelect from '../souls/ShepherdSelect';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import { SMSTemplate } from '../../types/sms.types';
import { SMSService } from '../../services/sms.service';
import { EvangelizedSoul } from '../../types/evangelized.types';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface Props {
  soul: EvangelizedSoul;
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export default function ImportToSoulModal({ soul, isOpen, onClose, onImported }: Props) {
  const { families } = useServiceFamilies(true);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [data, setData] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    location: '',
    firstVisitDate: new Date().toISOString().split('T')[0],
    shepherdId: undefined as string | undefined,
    serviceFamilyId: undefined as string | undefined,
    isUndecided: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    setData({
      fullName: soul.fullName || '',
      nickname: soul.nickname || '',
      gender: soul.gender || 'male',
      phone: soul.phone || '',
      location: soul.location || '',
      firstVisitDate: new Date().toISOString().split('T')[0],
      shepherdId: undefined,
      serviceFamilyId: undefined,
      isUndecided: false,
    });
    setSelectedTemplate('');
  }, [soul, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    SMSService.getTemplates('Bienvenue')
      .then(setTemplates)
      .catch((e) => {
        console.error(e);
        toast.error('Erreur lors du chargement des modèles SMS');
      })
      .finally(() => setLoadingTemplates(false));
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim()) return toast.error('Le nom est obligatoire');
    if (!data.location.trim()) return toast.error("Le lieu d'habitation est obligatoire");
    if (!selectedTemplate) return toast.error('Veuillez sélectionner un message de bienvenue');

    const userStr = localStorage.getItem('user');
    if (!userStr) return toast.error('Session expirée. Veuillez vous reconnecter.');
    const user = JSON.parse(userStr);

    try {
      setSubmitting(true);

      // Colonnes en snake_case (schema reel), avec church_id et id genere — calque sur SoulForm.
      const soulId = `soul_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const soulData = {
        id: soulId,
        church_id: getChurchId(),
        full_name: data.fullName.trim(),
        nickname: data.nickname.trim() || null,
        gender: data.gender,
        phone: data.phone.trim(),
        is_undecided: data.isUndecided,
        location: data.location.trim(),
        coordinates: null,
        first_visit_date: new Date(data.firstVisitDate).toISOString(),
        shepherd_id: data.shepherdId || null,
        origin_source: 'evangelisation',
        service_family_id: data.serviceFamilyId || null,
        // Lien fonctionnel évangéliste (équivalent shepherd_id)
        evangelist_id: soul.evangelistId || null,
        spiritual_profile: {
          isBornAgain: false,
          isBaptized: false,
          isEnrolledInAcademy: false,
          isEnrolledInLifeBearers: false,
          departments: [],
        },
        status: 'active',
        created_by: user.id,
        photo_url: soul.photoURL || null,
      };

      const { data: insertedSoul, error: insertErr } = await supabase
        .from('souls').insert(soulData).select('id').single();
      if (insertErr) {
        console.error('Supabase insert error (import vers souls):', insertErr);
        throw new Error(insertErr.message || "Erreur lors de l'ajout de l'âme");
      }
      const docRef = { id: insertedSoul?.id ?? soulId };

      // Marquer l'âme évangélisée comme importée (ciblée sur CETTE âme)
      const { error: updateErr } = await supabase.from('evangelized_souls').update({
        status: 'imported',
        imported_to_soul_id: docRef.id,
        imported_at: new Date().toISOString(),
        imported_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', soul.id);
      if (updateErr) {
        console.error('Erreur lors du marquage de l\'âme évangélisée comme importée:', updateErr);
        toast.error("Âme reçue, mais sa fiche d'évangélisation n'a pas pu être marquée comme importée.");
      }

      // Envoi SMS de bienvenue (best effort, n'annule pas l'import)
      try {
        const template = templates.find((t) => t.id === selectedTemplate);
        if (template && data.phone) {
          const credit = await SMSService.checkSufficientCredits();
          if (credit.sufficient) {
            await SMSService.sendSMS(
              data.phone.replace('+225', ''),
              template.content,
              data.fullName,
              data.nickname || undefined
            );
            await SMSService.createSMSInteraction(user.id, docRef.id, template.content, new Date());
          } else {
            toast.error("Crédit SMS insuffisant — SMS de bienvenue non envoyé.");
          }
        }
      } catch (smsErr) {
        console.error('Welcome SMS error:', smsErr);
        toast.error("SMS de bienvenue non envoyé — vous pourrez le renvoyer manuellement.");
      }

      toast.success('Âme reçue dans l\'église');
      onImported?.();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      toast.error("Erreur lors de l'import");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recevoir dans l'église">
      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Cette âme évangélisée sera ajoutée à la liste des <strong>âmes de l'église</strong> et
            comptabilisée dans les statistiques. Sa fiche d'évangélisation reste conservée pour traçabilité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message de bienvenue *</label>
            <select
              required
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={loadingTemplates}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionner un modèle</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {!loadingTemplates && templates.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">Aucun modèle dans la catégorie « Bienvenue »</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom et Prénoms *</label>
              <input type="text" required value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surnom</label>
              <input type="text" value={data.nickname}
                onChange={(e) => setData({ ...data, nickname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'habitation *</label>
              <input type="text" required value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de 1ʳᵉ visite *</label>
              <input type="date" required value={data.firstVisitDate}
                onChange={(e) => setData({ ...data, firstVisitDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Famille de service</label>
              <select
                value={data.serviceFamilyId || ''}
                onChange={(e) => setData({ ...data, serviceFamilyId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              >
                <option value="">Non assignée</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berger(e)</label>
            <ShepherdSelect
              value={data.shepherdId}
              onChange={(id) => setData({ ...data, shepherdId: id })}
              serviceFamilyId={data.serviceFamilyId}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={data.isUndecided}
              onChange={(e) => setData({ ...data, isUndecided: e.target.checked })}
              className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
            />
            Marquer comme indécis(e)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-60">
              {submitting ? 'Réception en cours...' : "Recevoir dans l'église"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
