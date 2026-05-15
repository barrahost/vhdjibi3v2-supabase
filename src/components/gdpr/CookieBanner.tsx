import { useState, useEffect } from 'react';
import { PrivacyPreferencesModal } from '../gdpr/PrivacyPreferencesModal';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
              En continuant à naviguer, vous acceptez notre utilisation des cookies.
              Pour en savoir plus, consultez notre{' '}
              <a href="/privacy-policy" className="text-[#00665C] hover:underline">
                politique de confidentialité
              </a>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cookies essentiels uniquement
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
            >
              Accepter tous les cookies
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="px-4 py-2 text-sm font-medium text-[#00665C] border border-[#00665C] hover:bg-[#00665C]/10 rounded-md"
            >
              Personnaliser
            </button>
          </div>
        </div>
      </div>
    </div>
    <PrivacyPreferencesModal
      isOpen={showPreferences}
      onClose={() => setShowPreferences(false)}
      onSave={() => {
        setShowPreferences(false);
        setIsVisible(false);
      }}
    />
    </>
  );
}