import { useEffect, useState, useCallback } from 'react';
import { X, ArrowRight, CheckCircle, Megaphone, Heart, BookOpen } from 'lucide-react';
import type { TourRole } from '../../hooks/useOnboarding';

/* ─── Step definition ───────────────────────────────────────────── */
interface TourStep {
  target?: string;
  title: string;
  body: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  /** ID of an accordion item to open before highlighting the target */
  openAccordion?: string;
}

/* ─── Steps per role ────────────────────────────────────────────── */
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
      openAccordion: 'monitoring',
    },
    {
      target: '[data-tour="nav-interactions-shepherd"]',
      title: 'Vos interactions',
      body: 'Enregistrez ici chaque appel, visite ou message. Un suivi régulier (au moins une fois par semaine) est la clé d\'un bon berger.',
      position: 'right',
      openAccordion: 'monitoring',
    },
    {
      target: '[data-tour="nav-reminders"]',
      title: 'Rappels',
      body: 'L\'application vous alertera automatiquement quand une âme n\'a pas eu d\'interaction depuis plus de 5 jours. Ne laissez personne sans nouvelles.',
      position: 'right',
      openAccordion: 'monitoring',
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
const PADDING = 12;

function getTargetRect(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // If element has zero dimensions it's hidden (accordion closed)
  if (r.width === 0 && r.height === 0) return null;
  return {
    x: r.left - PADDING,
    y: r.top - PADDING,
    w: r.width + PADDING * 2,
    h: r.height + PADDING * 2,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

/**
 * Open the accordion that contains the target element.
 * Finds the closest [aria-expanded="false"] button ancestor or sibling button
 * and clicks it to expand.
 */
function openAccordionForTarget(selector: string): Promise<void> {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (!el) { resolve(); return; }

    // Walk up DOM to find a hidden accordion container (max-h-0)
    let node: Element | null = el.parentElement;
    while (node) {
      if (node.getAttribute('aria-hidden') === 'true') {
        // Found the hidden panel — find its toggle button via aria-controls
        const panelId = node.id;
        if (panelId) {
          const btn = document.querySelector(`[aria-controls="${panelId}"]`);
          if (btn instanceof HTMLElement) {
            btn.click();
            // Wait for CSS transition (300ms) + a bit of buffer
            setTimeout(resolve, 400);
            return;
          }
        }
        break;
      }
      node = node.parentElement;
    }
    resolve();
  });
}

/**
 * If an accordionId is provided, open the accordion button whose
 * aria-controls matches `submenu-${accordionId}`.
 */
function openAccordionById(accordionId: string): Promise<void> {
  return new Promise(resolve => {
    const panelId = `submenu-${accordionId}`;
    const panel = document.getElementById(panelId);
    // Already open?
    if (panel && panel.getAttribute('aria-hidden') !== 'true') { resolve(); return; }

    const btn = document.querySelector(`[aria-controls="${panelId}"]`);
    if (btn instanceof HTMLElement) {
      btn.click();
      setTimeout(resolve, 400);
    } else {
      resolve();
    }
  });
}

function scrollIntoViewIfNeeded(selector: string) {
  const el = document.querySelector(selector);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

/* ─── Main component ────────────────────────────────────────────── */
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

  const recalc = useCallback(async () => {
    if (!current?.target) { setRect(null); return; }

    // 1. Open accordion if needed
    if (current.openAccordion) {
      await openAccordionById(current.openAccordion);
    } else {
      // Try to auto-detect hidden ancestor
      await openAccordionForTarget(current.target);
    }

    // 2. Scroll into view
    scrollIntoViewIfNeeded(current.target);

    // 3. Recalculate position after scroll + animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRect(getTargetRect(current.target!));
        forceUpdate(n => n + 1);
      });
    });
  }, [current]);

  useEffect(() => {
    recalc();

    const onResize = () => {
      if (!current?.target) return;
      setRect(getTargetRect(current.target));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [recalc, current]);

  const isCenter = current?.position === 'center' || !current?.target || !rect;

  /* ── Bubble positioning ─────────────────────────────────────── */
  function bubbleStyle(): React.CSSProperties {
    if (isCenter || !rect) {
      return {
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380,
        maxWidth: 'calc(100vw - 32px)',
      };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const BUBBLE_W = 320;
    const BUBBLE_H = 200;
    const GAP = 18;

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
    } else {
      top = Math.min(rect.y + rect.h + GAP, vh - BUBBLE_H - 8);
      left = Math.max(8, Math.min(rect.cx - BUBBLE_W / 2, vw - BUBBLE_W - 8));
    }

    return { position: 'fixed', top, left, width: BUBBLE_W };
  }

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9998, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && !isCenter && (
              <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="8" fill="black" />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.60)" mask="url(#tour-spotlight)" />
        {rect && !isCenter && (
          <rect
            x={rect.x} y={rect.y} width={rect.w} height={rect.h}
            rx="8" fill="none" stroke="#F2B636" strokeWidth="2.5" opacity="0.9"
          />
        )}
      </svg>

      {/* Click capture layer */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} aria-hidden />

      {/* Tooltip bubble */}
      <div
        style={{ ...bubbleStyle(), zIndex: 9999 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00665C] to-[#00865C] px-5 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {current.icon && (
              <span className="flex-shrink-0 flex items-center justify-center">
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
            title="Fermer le tutoriel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{current.body}</p>
        </div>

        {/* Footer: progress dots + buttons */}
        <div className="px-5 pb-5 flex items-center justify-between">
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
