import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { Modal } from '../ui/Modal';
import { Soul } from '../../types/database.types';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'shepherd', label: 'Berger' },
  { value: 'family_leader', label: 'Chef de famille' },
  { value: 'department_leader', label: 'Responsable de département' },
  { value: 'adn', label: 'ADN' },
  { value: 'evangelist', label: 'Évangéliste' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soul: Soul;
  onSuccess?: () => void;
}

export default function ConvertSoulToUserModal({ isOpen, onClose, soul, onSuccess }: Props) {
  const [role, setRole] = useState('shepherd');
  const [password, setPassword] = useState('@123456');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phone = soul.phone?.replace('+225', '') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Vérifier si un compte existe déjà avec ce numéro
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('church_id', getChurchId())
        .eq('phone', soul.phone || '')
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error('Un compte existe déjà pour ce numéro de téléphone');
        return;
      }

      const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const { error } = await supabase.from('users').insert({
        church_id: getChurchId(),
        id: uid,
        full_name: soul.fullName,
        phone: soul.phone,
        role,
        business_profiles: [{ type: role, isActive: true }],
        password,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(`Compte "${soul.fullName}" créé avec le rôle ${ROLES.find(r => r.value === role)?.label}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création du compte");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un compte utilisateur">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Infos de l'âme (lecture seule) */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-gray-900">{soul.fullName}</p>
          <p className="text-sm text-gray-500">📞 {phone}</p>
          {soul.location && <p className="text-sm text-gray-500">📍 {soul.location}</p>}
        </div>

        {/* Rôle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe initial *</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C] font-mono"
            required
          />
          <p className="text-xs text-gray-500 mt-1">L'utilisateur se connecte avec son numéro de téléphone et ce mot de passe.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? 'Création...' : 'Créer le compte'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
