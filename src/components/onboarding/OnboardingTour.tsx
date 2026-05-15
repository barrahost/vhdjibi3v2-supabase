import { useEffect, useState, useCallback } from 'react';
import { X, ArrowRight, CheckCircle, Megaphone, Heart, BookOpen } from 'lucide-react';
import type { TourRole } from '../../hooks/useOnboarding';

/* ─── Définition d'une étape ───────────────────────────────────── */
interface TourStep {
  target?: string;          // sélecteur CSS data-tour="…" ou querySelector
  title: string;
  body: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

/* ─── Étapes par rôle ───────────────────────────────────────────── */
const STEPS: Record<TourRole, TourStep[]> = {
  evangelist: [
    {
      title: 'Bienvenue sur Bergerie ! 🙏',
      body: 'Cette application vous permet de suivre vos âmes évangélisées et d\'enregistrer vos interactions. Nous allons vous guider en quelques étapes.',
      position: 'center',
      icon: <Megaphone className="w-10 h-10 text-[#F2B636]" />,
    },
    {
      target: '[data-tour="nav-evangelized-souls"]',
      title: 'Vos âmes évangélisées',
      body: 'C\'est votre espace principal. Vous y retrouvez toutes les personnes rencontrées lors de vos sorties et pouvez en ajouter de nouvelles.',
      position: 'right',
    },
    {
      target: '[data-tour="btn-add-evangelized-soul"]',
      title: 'Ajouter une âme',
      body: 'Après chaque rencontre, cliquez ici pour enregistrer la personne : nom, téléphone, lieu, et si elle a donné sa vie à Jésus.',
      position: 'bottom',
    },
    {
      target: '[data-tour="nav-interactions-evangelist"]',
      title: 'Vos interactions',
      body: 'Retrouvez ici tout l\'historique de vos appels, visites et messages. Un bon suivi commence par des interactions régulières.',
      position: 'right',
    },
    {
      target: '[data-tour="profile-switcher"]',
      title: 'Votre profil actif',
      body: 'Si vous avez plusieurs rôles dans l\'église (évangéliste et berger, par exemple), vous pouvez basculer entre eux ici sans vous reconnecter.',
      position: 'bottom',
    },
    {
      title: 'Vous êtes prêt(e) ! ✅',
      body: 'Vous pouvez retrouver ce tutoriel à tout moment depuis votre profil utilisateur. Bonne évangélisation !',
      position: 'center',
      icon: <CheckCircle className="w-10 h-10 text-[#00665C]" />,
    },
  ],

  shepherd: [
    {
      title: 'Bienvenue sur Bergerie ! 🙏',
      body: 'Cette application vous aide à prendre soin de vos âmes. Nous allons vous guider en quelques étapes pour que vous soyez opérationnel rapidement.',
      position: 'center',
      icon: <Heart className="w-10 h-10 text-[#00665C]" />,
    },
    {
      target: '[data-tour="nav-assigned-souls"]',
      title: 'Mes Âmes',
      body: 'Voici la liste des âmes qui vous sont confiées. Vous pouvez voir leur profil, leurs interactions passées et leur progression spirituelle.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-interactions-shepherd"]',
      title: 'Vos interactions',
      body: 'Enregistrez ici chaque appel, visite ou message. Un suivi régulier (au moins une fois par semaine) est la clé d\'un bon berger.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-reminders"]',
      title: 'Rappels',
      body: 'L\'application vous alertera automatiquement quand une âme n\'a pas eu d\'interaction depuis plus de 5 jours. Ne laissez personne sans nouvelles.',
      position: 'right',
    },
    {
      target: '[data-tour="notification-bell"]',
      title: 'Cloche de notifications',
      body: 'Cette cloche vous signale en temps réel les âmes qui nécessitent une attention particulière. Un badge rouge apparaît dès qu\'une action est requise.',
      position: 'bottom',
    },
    {
      target: '[data-tour="profile-switcher"]',
      title: 'Votre profil actif',
      body: 'Si vous avez plusieurs rôles (berger et responsable de famille, par exemple), vous pouvez basculer entre eux ici sans vous reconnecter.',
      position: 'bottom',
    },
    {
      title: 'Vous êtes prêt(e) ! ✅',
      body: 'Ce tutoriel est accessible à tout moment depuis votre profil. Que Dieu guide chacun de vos suivis !',
      position: 'center',
      icon: <BookOpen className="w-10 h-10 text-[#00665C]" />,
    },
  ],
};

/* ─── Helpers ───────────────────────────────────────────────────── */
const PADDING = 10;

function getTargetRect(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: r.left - PADDING,
    y: r.top - PADDING,
    w: r.width + PADDING * 2,
    h: r.height + PADDING * 2,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

function scrollIntoViewIfNeeded(selector: string) {
  const el = document.querySelector(selector);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

/* ─── Composant principal ───────────────────────────────────────── */
interface OnboardingTourProps {
  role: TourRole;
  step: number;
  onAdvance: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ role, step, onAdvance, onSkip }: OnboardingTourProps) {
  const steps = STEPS[role];
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const [rect, setRect] = useState<ReturnType<typeof getTargetRect>>(null);
  const [, forceUpdate] = useState(0);

  // Recalculer la position de la cible
  const recalc = useCallback(() => {
    if (!current?.target) { setRect(null); return; }
    scrollIntoViewIfNeeded(current.target);
    // Attendre que le scroll + DOM soient stables
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRect(getTargetRect(current.target!));
        forceUpdate(n => n + 1);
      });
    });
  }, [current]);

  useEffect(() => {
    recalc();
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [recalc]);

  const isCenter = current?.position === 'center' || !current?.target || !rect;

  /* ── Positionnement de la bulle ─────────────────────────────── */
  function bubbleStyle(): React.CSSProperties {
    if (isCenter || !rect) {
      return {
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
      };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const BUBBLE_W = 300;
    const BUBBLE_H = 180; // estimation
    const GAP = 16;

    const pos = current.position ?? 'bottom';

    let top = 0, left = 0;

    if (pos === 'right') {
      top = Math.max(8, Math.min(rect.y + rect.h / 2 - BUBBLE_H / 2, vh - BUBBLE_H - 8));
      left = Math.min(rect.x + rect.w + GAP, vw - BUBBLE_W - 8);
    } else if (pos === 'left') {
      top = Math.max(8, Math.min(rect.y + rect.h / 2 - BUBBLE_H / 2, vh - BUBBLE_H - 8));
      left = Math.max(8, rect.x - BUBBLE_W - GAP);
    } else if (pos === 'top') {
      top = Math.max(8, rect.y - BUBBLE_H - GAP);
      left = Math.max(8, Math.min(rect.cx - BUBBLE_W / 2, vw - BUBBLE_W - 8));
    } else { // bottom
      top = Math.min(rect.y + rect.h + GAP, vh - BUBBLE_H - 8);
      left = Math.max(8, Math.min(rect.cx - BUBBLE_W / 2, vw - BUBBLE_W - 8));
    }

    return { position: 'fixed', top, left, width: BUBBLE_W };
  }

  return (
    <>
      {/* ── Overlay sombre avec trou (SVG mask) ── */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9998, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && !isCenter && (
              <rect
                x={rect.x} y={rect.y}
                width={rect.w} height={rect.h}
                rx="8" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-spotlight)"
        />
        {/* Bordure lumineuse autour de la cible */}
        {rect && !isCenter && (
          <rect
            x={rect.x} y={rect.y}
            width={rect.w} height={rect.h}
            rx="8"
            fill="none"
            stroke="#F2B636"
            strokeWidth="2"
            opacity="0.8"
          />
        )}
      </svg>

      {/* Couche d'interaction (clic dehors = passer) */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        aria-hidden
      />

      {/* ── Bulle tooltip ── */}
      <div
        style={{ ...bubbleStyle(), zIndex: 9999 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
      >
        {/* En-tête coloré */}
        <div className="bg-gradient-to-r from-[#00665C] to-[#00665C]/80 px-5 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {current.icon && (
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {current.icon}
              </span>
            )}
            <h3 className="text-white font-semibold text-sm leading-tight">
              {current.title}
            </h3>
          </div>
          <button
            onClick={onSkip}
            className="flex-shrink-0 ml-3 text-white/60 hover:text-white transition-colors"
            title="Passer le tutoriel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{current.body}</p>
        </div>

        {/* Pied : progression + boutons */}
        <div className="px-5 pb-4 flex items-center justify-between">
          {/* Points de progression */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-5 h-2 bg-[#00665C]'
                    : i < step
                    ? 'w-2 h-2 bg-[#00665C]/40'
                    : 'w-2 h-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                onClick={onSkip}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
              >
                Passer
              </button>
            )}
            <button
              onClick={isLast ? onSkip : onAdvance}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00665C] hover:bg-[#00665C]/90 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isLast ? 'Terminer' : 'Suivant'}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
