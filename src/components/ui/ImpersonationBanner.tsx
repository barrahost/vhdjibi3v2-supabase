import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isImpersonating, stopImpersonation } from '../../utils/impersonation';

/**
 * Bandeau permanent affiché quand un admin navigue "en tant que" un autre
 * utilisateur. Rappelle que les actions sont réelles et permet de revenir
 * à la session admin d'un clic.
 */
export function ImpersonationBanner() {
  const { user } = useAuth();

  if (!isImpersonating() || !user) return null;

  return (
    <div className="sticky top-0 z-30 bg-amber-400 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2 min-w-0 text-sm font-medium">
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">
          Mode aperçu — connecté en tant que <strong>{user.fullName}</strong>. Les actions effectuées sont réelles.
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-950 text-amber-50 rounded-full hover:bg-amber-900 transition-colors flex-shrink-0"
      >
        <LogOut className="w-3.5 h-3.5" />
        Revenir à mon compte
      </button>
    </div>
  );
}
