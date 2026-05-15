import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { CloudFunctionsService } from '../../services/cloudFunctions.service';
import { Eye, EyeOff, Key } from 'lucide-react';
import toast from 'react-hot-toast';

interface SelfPasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
}

export default function SelfPasswordResetModal({ isOpen, onClose, uid }: SelfPasswordResetModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate passwords
      if (formData.newPassword.length < 6) {
        toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      
      setIsSubmitting(true);
      
      // Pass docId from the cached user so we update the exact document
      // the login flow reads (avoids `uid` field mismatches).
      const savedUserRaw = localStorage.getItem('user');
      const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;
      const docId = savedUser?.id;

      await CloudFunctionsService.resetUserPassword(
        uid,
        formData.newPassword,
        true,
        formData.currentPassword,
        docId
      );
      
      toast.success('Mot de passe modifié avec succès');
      onClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Changer mon mot de passe"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Key className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Modification du mot de passe</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Vous pouvez changer votre mot de passe ici. Pour des raisons de sécurité, veuillez saisir votre mot de passe actuel.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            required
            minLength={6}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </Modal>
  );
}