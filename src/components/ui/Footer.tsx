import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ChangelogModal } from './ChangelogModal';
import { useChurch } from '../../contexts/ChurchContext';

export function Footer({ className = '' }: { className?: string }) {
  const location = useLocation();
  const { church } = useChurch();
  const copyrightName = church?.copyrightName || church?.name || 'Bergerie';
  const isLoginPage = location.pathname === '/login' || location.pathname === '/replay';
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Ne pas afficher le footer sur la page de login car elle a déjà son propre copyright,
  // mais l'afficher sur la page replay avec un style adapté
  if (isLoginPage && location.pathname === '/login') return null;

  return (
    <footer className={`mt-auto py-4 px-6 border-t ${location.pathname === '/replay' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center text-sm text-gray-500 space-y-1 flex flex-col items-center">
          © {new Date().getFullYear()} {copyrightName}. Tous droits réservés.
          <button
            onClick={() => setIsChangelogOpen(true)}
            className="mt-1 text-xs text-gray-400 hover:text-[#00665C] transition-colors"
          >
            Version 1.7.79
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center space-x-4 text-sm">
          <a href="/legal-notice" className="text-gray-500 hover:text-[#00665C]">
            Mentions légales
          </a>
          <a href="/privacy-policy" className="text-gray-500 hover:text-[#00665C]">
            Politique de confidentialité
          </a>
          <a href="/replay" className="text-gray-500 hover:text-[#00665C]">
            Replay Audios de cultes
          </a>
        </div>
      </div>
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </footer>
  );
}