import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import {
  EvangelizedSoul,
  PLANNED_SERVICE_OPTIONS,
  GAVE_LIFE_OPTIONS,
  type GaveLifeToJesus,
  type PlannedService,
} from '../../types/evangelized.types';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser } from '../../utils/roleHelpers';
import EvangelistSelect from './EvangelistSelect';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface Props {
  soul: EvangelizedSoul;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EditEvangelizedSoulModal({ soul, isOpen, onClose, onUpdated }: Props) {
  const { user, userRole, activeRole } = useAuth();
  const isAdmin = isAdminUser({ role: (activeRole || userRole) as string, businessProfiles: (user as any)?.businessProfiles });
  const [data, setData] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    location: '',
    evangelizationDate: '',
    evangelizationLocation: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'imported',
    evangelistId: '' as string,
    attendedCommunity: '',
    gaveLifeToJesus: '' as '' | GaveLifeToJesus,
    
    plannedService: '' as '' | PlannedService,
    prayerTopics: '',
    interviewerName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const d = soul.evangelizationDate
      ? new Date(soul.evangelizationDate).toISOString().split('T')[0]
      : '';
    setData({
      fullName: soul.fullName || '',
      nickname: soul.nickname || '',
      gender: soul.gender || 'male',
      phone: soul.phone || '',
      location: soul.location || '',
      evangelizationDate: d,
      evangelizationLocation: soul.evangelizationLocation || '',
      notes: soul.notes || '',
      status: soul.status || 'active',
      evangelistId: soul.evangelistId || '',
      attendedCommunity: soul.attendedCommunity || '',
      gaveLifeToJesus: (soul.gaveLifeToJesus as GaveLifeToJesus) || '',
      
      plannedService: (soul.plannedService as PlannedService) || '',
      prayerTopics: soul.prayerTopics || '',
      interviewerName: soul.interviewerName || '',
    });
  }, [soul, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim()) return toast.error('Le nom est obligatoire');
    try {
      setSubmitting(true);
      const { error: updateErr } = await supabase.from('evangelized_souls').update({
        full_name: data.fullName.trim(),
        nickname: data.nickname.trim() || null,
        gender: data.gender,
        phone: data.phone.trim(),
        location: data.location.trim(),
        evangelization_date: data.evangelizationDate ? new Date(data.evangelizationDate).toISOString() : null,
        evangelization_location: data.evangelizationLocation.trim() || null,
        notes: data.notes.trim() || null,
        attended_community: data.attendedCommunity.trim() || null,
        gave_life_to_jesus: data.gaveLifeToJesus || null,
        planned_service: data.plannedService || null,
        prayer_topics: data.prayerTopics.trim() || null,
        interviewer_name: data.interviewerName.trim() || null,
        status: data.status,
        ...(isAdmin ? { evangelist_id: data.evangelistId || soul.evangelistId } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', soul.id);
      if (updateErr) throw updateErr;
      toast.success('Âme mise à jour');
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'âme évangélisée">
      <div className="p-6 overflow-y-auto flex-1"><form onSubmit={handleSubmit} className="space-y-4">
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

        <GenderRadioGroup value={data.gender} onChange={(g) => setData({ ...data, gender: g })} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'habitation</label>
            <input type="text" value={data.location}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation</label>
            <input type="date" value={data.evangelizationDate}
              onChange={(e) => setData({ ...data, evangelizationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'évangélisation</label>
            <input type="text" value={data.evangelizationLocation}
              onChange={(e) => setData({ ...data, evangelizationLocation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={3} value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Communauté fréquentée</label>
          <input type="text" value={data.attendedCommunity}
            onChange={(e) => setData({ ...data, attendedCommunity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">L'âme a donné sa vie à Jésus ?</label>
          <div className="flex flex-wrap gap-4">
            {GAVE_LIFE_OPTIONS.map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="edit_gaveLifeToJesus" value={opt.value}
                  checked={data.gaveLifeToJesus === opt.value}
                  onChange={() => setData({ ...data, gaveLifeToJesus: opt.value })}
                  className="text-[#00665C] focus:ring-[#00665C]" />
                {opt.label}
              </label>
            ))}
            {data.gaveLifeToJesus && (
              <button type="button" onClick={() => setData({ ...data, gaveLifeToJesus: '' })}
                className="text-xs text-gray-500 underline">Effacer</button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">À quel culte pensez-vous venir ?</label>
          <select value={data.plannedService}
            onChange={(e) => setData({ ...data, plannedService: e.target.value as PlannedService | '' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
            <option value="">— Sélectionner —</option>
            {PLANNED_SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Étudiant ayant conduit l'entretien</label>
          <input type="text" value={data.interviewerName}
            onChange={(e) => setData({ ...data, interviewerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sujets de prière</label>
          <textarea rows={3} value={data.prayerTopics}
            onChange={(e) => setData({ ...data, prayerTopics: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
          <textarea rows={3} value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select value={data.status}
            onChange={(e) => setData({ ...data, status: e.target.value as 'active' | 'inactive' | 'imported' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Évangéliste responsable</label>
            <EvangelistSelect
              value={data.evangelistId || undefined}
              onChange={(id) => setData({ ...data, evangelistId: id || '' })}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-60">
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form></div>
    </Modal>
  );
}
