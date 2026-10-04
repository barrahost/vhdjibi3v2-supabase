import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface PromptBarProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
  busy?: boolean;
}

/** Invitation compacte et non bloquante (installer l'appli, activer les notifications). */
export function PromptBar({ icon, title, description, actionLabel, onAction, onDismiss, busy }: PromptBarProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className="animate-slide-up overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-gray-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={busy}
          className="flex-shrink-0 rounded-lg bg-[#00665C] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#00665C]/90 active:bg-[#00524A] disabled:opacity-60"
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Plus tard"
          title="Plus tard"
          className="-mr-1 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Barre de couleurs signature */}
      <div className="h-1 bg-gradient-to-r from-[#00665C] via-[#F2B636] to-[#A32035]" />
    </div>
  );
}

/**
 * Positionne une invitation en bas de l'écran sans jamais décaler le contenu de la page :
 * - 'login' : tout en bas (la page de connexion n'a pas de menu) ;
 * - 'app'   : au-dessus du menu du bas sur mobile (≈53 px), dans la zone principale sur grand écran.
 * Un espace équivalent est réservé en fin de page pour que le bas reste accessible en scrollant.
 */
export function FloatingPrompt({ placement, children }: { placement: 'login' | 'app'; children: ReactNode }) {
  return (
    <>
      <div
        className={
          placement === 'login'
            ? 'pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3'
            : 'pointer-events-none fixed inset-x-0 bottom-[73px] z-40 px-3 lg:bottom-4 lg:left-64'
        }
      >
        <div className="pointer-events-auto mx-auto max-w-lg">{children}</div>
      </div>
      <div aria-hidden className={placement === 'login' ? 'h-28' : 'h-24 lg:h-20'} />
    </>
  );
}
