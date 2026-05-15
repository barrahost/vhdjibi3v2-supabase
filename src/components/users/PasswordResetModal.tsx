import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { CloudFunctionsService } from '../../services/cloudFunctions.service';
import { Eye, EyeOff, Key } from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    uid: string;
    fullName: string;
  };
}

export default function PasswordResetModal({ isOpen, onClose, user }: PasswordResetModalProps) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate passwords
      if (formData.newPassword.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      
      setIsSubmitting(true);
      
      // Call the password reset service — pass docId so we update the
      // exact document the login flow reads.
      await CloudFunctionsService.resetUserPassword(
        user.uid,
        formData.newPassword,
        false,
        undefined,
        user.id
      );
      
      toast.success('Mot de passe modifié avec succès');
      onClose();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error?.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Réinitialiser le mot de passe"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Key className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Réinitialisation du mot de passe</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Vous êtes sur le point de réinitialiser le mot de passe de <strong>{user.fullName}</strong>.</p>
                <p className="mt-1">L'utilisateur devra utiliser ce nouveau mot de passe pour se connecter.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
            >
              {showPassword ? (
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
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              required
              minLength={6}
            />
          </div>
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
            {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </div>
      </form>
    </Modal>
  );
}