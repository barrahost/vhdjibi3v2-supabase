import { useState } from 'react';
import { supabase } from '../../lib/supabase';

import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { CheckCircle2, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser, isADNUser } from '../../utils/roleHelpers';
import EvangelistSelect from './EvangelistSelect';
import {
  PLANNED_SERVICE_OPTIONS,
  GAVE_LIFE_OPTIONS,
  type GaveLifeToJesus,
  type PlannedService,
} from '../../types/evangelized.types';

interface EvangelizedSoulFormProps {
  onCreated?: () => void;
}

const initial = {
  gender: '' as '' | 'male' | 'female',
  fullName: '',
  nickname: '',
  phone: '',
  location: '',
  evangelizationDate: new Date().toISOString().split('T')[0],
  evangelizationLocation: '',
  notes: '',
  evangelistId: undefined as string | undefined,
  attendedCommunity: '',
  gaveLifeToJesus: '' as '' | GaveLifeToJesus,
  plannedService: '' as '' | PlannedService,
  prayerTopics: '',
  interviewerName: '',
};

export default function EvangelizedSoulForm({ onCreated }: EvangelizedSoulFormProps) {
  const navigate = useNavigate();
  const { user, userRole, activeRole } = useAuth();
  const isAdmin = isAdminUser({ role: (activeRole || userRole) as string, businessProfiles: (user as any)?.businessProfiles });
  const isADN = isADNUser({ role: (activeRole || userRole) as string, businessProfiles: (user as any)?.businessProfiles });
  const [data, setData] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<typeof initial | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim()) return toast.error('Le nom est obligatoire');
    if (!data.gender) return toast.error('Le genre est obligatoire');
    if (!data.location.trim()) return toast.error("Le lieu d'habitation est obligatoire");
    if (!data.evangelizationDate) return toast.error("La date d'évangélisation est obligatoire");

    const userStr = localStorage.getItem('user');
    if (!userStr) return toast.error('Session expirée. Veuillez vous reconnecter.');
    const user = JSON.parse(userStr);

    try {
      setSubmitting(true);
      const { error: insertError } = await supabase.from('evangelized_souls').insert({
        id: crypto.randomUUID(),
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
        evangelist_id: (isAdmin || isADN) && data.evangelistId ? data.evangelistId : user.id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      });
      if (insertError) throw insertError;

      toast.success('Âme évangélisée enregistrée');
      setSuccess(data);
      setData(initial);
      onCreated?.();
    } catch (err: any) {
      console.error('EvangelizedSoulForm insert error:', err);
      const msg = err?.message || err?.details || JSON.stringify(err);
      toast.error('Erreur: ' + msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-green-900">Âme évangélisée enregistrée</h2>
            <p className="text-sm text-green-800 mt-0.5">
              <strong>{success.fullName}</strong> a bien été ajouté(e) à votre liste.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4" /> Enregistrer une autre âme
          </button>
          <button
            type="button"
            onClick={() => navigate('/ames-evangelisees')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] hover:bg-[#00665C]/10 rounded-md"
          >
            <List className="w-4 h-4" /> Voir la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom et Prénoms *</label>
          <input
            type="text"
            required
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Surnom</label>
          <input
            type="text"
            value={data.nickname}
            onChange={(e) => setData({ ...data, nickname: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
        <GenderRadioGroup
          value={data.gender as 'male' | 'female' | ''}
          onChange={(g) => setData({ ...data, gender: g as 'male' | 'female' })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            placeholder="+225..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'habitation *</label>
          <input
            type="text"
            required
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation *</label>
          <input
            type="date"
            required
            value={data.evangelizationDate}
            onChange={(e) => setData({ ...data, evangelizationDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'évangélisation</label>
          <input
            type="text"
            value={data.evangelizationLocation}
            onChange={(e) => setData({ ...data, evangelizationLocation: e.target.value })}
            placeholder="Optionnel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Communauté fréquentée</label>
        <input
          type="text"
          value={data.attendedCommunity}
          onChange={(e) => setData({ ...data, attendedCommunity: e.target.value })}
          placeholder="Église ou communauté actuelle (optionnel)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">L'âme a donné sa vie à Jésus ?</label>
        <div className="flex flex-wrap gap-4">
          {GAVE_LIFE_OPTIONS.map((opt) => (
            <label key={opt.value} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gaveLifeToJesus"
                value={opt.value}
                checked={data.gaveLifeToJesus === opt.value}
                onChange={() => setData({ ...data, gaveLifeToJesus: opt.value })}
                className="text-[#00665C] focus:ring-[#00665C]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">À quel culte pensez-vous venir ?</label>
        <select
          value={data.plannedService}
          onChange={(e) => setData({ ...data, plannedService: e.target.value as PlannedService | '' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="">— Sélectionner —</option>
          {PLANNED_SERVICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Étudiant ayant conduit l'entretien</label>
        <input
          type="text"
          value={data.interviewerName}
          onChange={(e) => setData({ ...data, interviewerName: e.target.value })}
          placeholder="Nom de l'étudiant (optionnel)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sujets de prière</label>
        <textarea
          rows={3}
          value={data.prayerTopics}
          onChange={(e) => setData({ ...data, prayerTopics: e.target.value })}
          placeholder="Sujets de prière partagés par l'âme"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
        <textarea
          rows={3}
          value={data.notes}
          onChange={(e) => setData({ ...data, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {(isAdmin || isADN) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Évangéliste responsable</label>
          <EvangelistSelect
            value={data.evangelistId}
            onChange={(id) => setData({ ...data, evangelistId: id })}
          />
          <p className="text-xs text-gray-500 mt-1">Si aucun n'est sélectionné, vous serez assigné(e) par défaut.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-60"
      >
        {submitting ? 'Enregistrement...' : 'Enregistrer l\'âme évangélisée'}
      </button>
    </form>
  );
}
