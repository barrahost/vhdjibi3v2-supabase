import type { ReactNode } from 'react';
import type { ChecklistProgress } from '../../types/culteBrief.types';

// Petites briques d'interface partagées par le module « Cultes » (brief, contrôle, débrief, actions).

/** Apparence d'un champ, sans largeur : à utiliser dans une ligne flex avec sa propre largeur
 * (un `w-full` en plus d'un `w-28` l'emporterait et ferait déborder la ligne sur mobile). */
export const inputBaseCls =
  'px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#00665C] focus:border-[#00665C] disabled:bg-gray-50 disabled:text-gray-500';
export const inputCls = `w-full ${inputBaseCls}`;
export const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50';
export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md disabled:opacity-50';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'brand';

const TONES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  brand: 'bg-[#00665C]/10 text-[#00665C]',
};

export function Pill({ tone = 'gray', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Barre de progression du contrôle : vert (OK), rouge (non OK), gris (restant). */
export function ProgressBar({ progress }: { progress: ChecklistProgress }) {
  if (progress.total === 0) return <div className="h-2 rounded-full bg-gray-100" />;
  const pct = (n: number) => `${(n / progress.total) * 100}%`;
  return (
    <div
      className="flex h-2 rounded-full overflow-hidden bg-gray-100"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={progress.total}
      aria-valuenow={progress.ok}
      aria-label={`${progress.ok} sur ${progress.total} points OK`}
    >
      <div className="bg-green-500" style={{ width: pct(progress.ok) }} />
      <div className="bg-red-500" style={{ width: pct(progress.nok) }} />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">{children}</div>;
}

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return <div className="text-center py-10 text-sm text-gray-500">{label}</div>;
}

/** Message affiché quand le script SQL du module n'a pas encore été exécuté. */
export function ModuleNotReady() {
  return (
    <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800 space-y-2">
      <p className="font-semibold">Le module « Cultes » n'est pas encore activé.</p>
      <p>
        Il faut d'abord exécuter le script <code className="bg-white/70 px-1 rounded">supabase_culte_brief_debrief.sql</code> dans
        l'éditeur SQL de Supabase, puis recharger cette page.
      </p>
    </div>
  );
}
