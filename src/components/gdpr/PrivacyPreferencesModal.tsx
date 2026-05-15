import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

interface PrivacyPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PrivacyPreferencesModal({ isOpen, onClose, onSave }: PrivacyPreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    preferences: false,
    marketing: false
  });

  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookie-consent');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      ...preferences,
      timestamp: new Date().toISOString()
    }));
    toast.success('Préférences enregistrées');
    onSave();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Préférences de confidentialité"
    >
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cookies essentiels</h3>
                <p className="text-sm text-gray-500">
                  Nécessaires au fonctionnement du site. Ne peuvent pas être désactivés.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.necessary}
                disabled
                className="h-4 w-4 text-[#00665C] border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cookies analytiques</h3>
                <p className="text-sm text-gray-500">
                  Nous aident à comprendre comment vous utilisez le site.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  analytics: e.target.checked
                }))}
                className="h-4 w-4 text-[#00665C] border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cookies de préférences</h3>
                <p className="text-sm text-gray-500">
                  Permettent de mémoriser vos préférences d'affichage.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.preferences}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  preferences: e.target.checked
                }))}
                className="h-4 w-4 text-[#00665C] border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cookies marketing</h3>
                <p className="text-sm text-gray-500">
                  Utilisés pour le suivi et l'amélioration de nos communications.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  marketing: e.target.checked
                }))}
                className="h-4 w-4 text-[#00665C] border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2 inline-block" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer les préférences
          </button>
        </div>
      </div>
    </Modal>
  );
}