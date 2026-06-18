import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { Modal } from '../ui/Modal';
import { Servant } from '../../types/servant.types';
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
  servant: Servant;
  onSuccess?: () => void;
}

export default function ConvertServantToUserModal({ isOpen, onClose, servant, onSuccess }: Props) {
  const [role, setRole] = useState('shepherd');
  const [password, setPassword] = useState('@123456');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('church_id', getChurchId())
        .eq('phone', servant.phone || '')
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error('Un compte existe déjà pour ce numéro de téléphone');
        return;
      }

      const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const { error } = await supabase.from('users').insert({
        church_id: getChurchId(),
        id: uid,
        full_name: servant.fullName,
        phone: servant.phone,
        role,
        business_profiles: [{ type: role, isActive: true }],
        password,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Lier le serviteur à l'utilisateur créé
      await supabase.from('servants').update({
        source_type: 'user',
        source_id: uid,
        updated_at: new Date().toISOString(),
      }).eq('id', servant.id);

      toast.success(`Compte "${servant.fullName}" créé avec le rôle ${ROLES.find(r => r.value === role)?.label}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un compte utilisateur">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-gray-900">{servant.fullName}</p>
          {servant.phone && <p className="text-sm text-gray-500">📞 {servant.phone}</p>}
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe initial *</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C] font-mono"
            required
          />
          <p className="text-xs text-gray-500 mt-1">L'utilisateur se connecte avec son numéro et ce mot de passe.</p>
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
