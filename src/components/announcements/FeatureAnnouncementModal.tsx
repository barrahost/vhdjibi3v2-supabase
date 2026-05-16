import { useState, useEffect } from 'react';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function FeatureAnnouncementModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const location = useLocation();
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;

  useEffect(() => {
    const checkAnnouncement = async () => {
      if (location.pathname !== '/login') {
        setIsVisible(false);
        return;
      }

      const fetchAnnouncement = async (retryCount = 0): Promise<any | null> => {
        try {
          const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', 'default')
            .single();
          if (error) throw error;
          setIsOffline(false);
          return data;
        } catch (error) {
          console.error('Error checking announcement:', error);
          const isOfflineError = error instanceof Error && error.message.includes('offline');
          if (isOfflineError) {
            setIsOffline(true);
            if (retryCount < MAX_RETRIES) {
              console.log(`Retrying announcement fetch (${retryCount + 1}/${MAX_RETRIES})...`);
              return new Promise(resolve => {
                setTimeout(() => resolve(fetchAnnouncement(retryCount + 1)), RETRY_DELAY);
              });
            }
          }
          return null;
        }
      };

      const data = await fetchAnnouncement();

      if (!data || !data.is_active) {
        setIsVisible(false);
        return;
      }

      setAnnouncementContent(data.content || '');

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);

      return () => clearTimeout(timer);
    };

    checkAnnouncement();

    return () => {
      setIsVisible(false);
    };
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || (!announcementContent && !isOffline)) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={handleClose}
      />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 sm:max-w-md w-full"
          style={{ animation: 'slideIn 0.5s ease-out' }}
        >
          <div className="bg-gradient-to-r from-[#00665C] to-[#00665C]/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Annonce</h3>
              </div>
              <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-8 space-y-6">
            {isOffline ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Connexion limitée</h3>
                    <p className="mt-2 text-sm">Impossible de charger les annonces. Veuillez vérifier votre connexion et réessayer.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <div className="bg-[#00665C]/10 p-4 rounded-full">
                    <MessageCircle className="h-8 w-8 text-[#00665C]" />
                  </div>
                </div>
                <div className="text-center text-gray-700 text-lg whitespace-pre-wrap">
                  {announcementContent}
                </div>
              </>
            )}

            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-[#00665C] px-6 py-3 text-base font-medium text-white shadow-lg hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-[#00665C] focus:ring-offset-2 transition-all duration-200"
            >
              {isOffline ? 'Fermer' : 'Continuer'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
