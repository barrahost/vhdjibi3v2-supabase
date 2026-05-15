import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 2000);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !wasOffline) return null;

  return (
    <div className={`fixed bottom-4 right-4 rounded-lg p-3 flex items-center space-x-2 transition-all duration-300 ${
      isOnline 
        ? 'bg-green-50 border border-green-200' 
        : 'bg-yellow-50 border border-yellow-200'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">
            Connexion rétablie - Synchronisation en cours...
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Mode hors-ligne - Les modifications seront synchronisées une fois la connexion rétablie
          </span>
        </>
      )}
    </div>
  );
}