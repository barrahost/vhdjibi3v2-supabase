import { useCallback, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  Loader2, Check, UserCircle2, EyeOff, ArrowRight, Sparkles, PartyPopper, HeartPulse, Shield, Home, Briefcase, Coins, Cross, HandHeart, MoreHorizontal, Mic, Megaphone,
} from 'lucide-react';
import { TestimonyService, TESTIMONY_CATEGORIES, TESTIMONY_CONTENT_MAX, formatDuration, type TestimonyCategory } from '../services/testimony.service';
import { useChurch } from '../contexts/ChurchContext';
import { validatePhoneNumber } from '../utils/phoneValidation';
import { PhoneInput } from '../components/ui/PhoneInput';
import { AudioRecorder, type RecordedAudio } from '../components/testimonies/AudioRecorder';

type PageState = 'identify' | 'ready' | 'submitting' | 'done';

// Identité retenue sur ce téléphone pour ne pas la ressaisir à chaque témoignage (simple confort)
const IDENTITY_KEY = 'temoignage:identite';
function loadIdentity(): { fullName: string; phone: string } {
  try {
    const raw = JSON.parse(localStorage.getItem(IDENTITY_KEY) || '{}');
    return { fullName: String(raw.fullName || ''), phone: String(raw.phone || '') };
  } catch {
    return { fullName: '', phone: '' };
  }
}
function saveIdentity(identity: { fullName: string; phone: string }) {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    /* navigation privée : on redemandera */
  }
}

// 1er novembre 2026 : l'Assemblée Grâce Confondante fête sa première année. Le bandeau s'efface ensuite tout seul.
const ANNIVERSARY_UNTIL = '2026-11-15';
const showAnniversary = () => new Date().toISOString().slice(0, 10) <= ANNIVERSARY_UNTIL;

const CATEGORY_ICONS: Record<TestimonyCategory, React.ComponentType<{ className?: string }>> = {
  'Guérison': HeartPulse,
  'Délivrance': Shield,
  'Famille': Home,
  'Travail & études': Briefcase,
  'Finances': Coins,
  'Salut & conversion': Cross,
  'Prière exaucée': HandHeart,
  'Autre': MoreHorizontal,
};

/**
 * Page publique : chacun dépose son témoignage, par écrit ou en audio. Demande du pasteur : on s'identifie d'abord
 * (nom + téléphone) pour écarter les envois fantaisistes ; on peut ensuite demander que le témoignage reste anonyme
 * en public (les pasteurs connaissent l'identité, le nom n'est jamais cité au culte ni publié).
 */
export default function TestimonyForm() {
  const { loading: churchLoading } = useChurch();
  const [pageState, setPageState] = useState<PageState>('identify');
  // Progression de l'envoi de l'audio (%), affichée pendant l'envoi
  const [progress, setProgress] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);
  const [category, setCategory] = useState<TestimonyCategory | ''>('');
  const [content, setContent] = useState('');
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [publicAnonymous, setPublicAnonymous] = useState(false);
  const [fullName, setFullName] = useState(() => loadIdentity().fullName);
  const [phone, setPhone] = useState(() => loadIdentity().phone);
  const [shareConsent, setShareConsent] = useState(false);
  // Enregistrement en cours ou en préparation : on attend qu'il soit prêt avant d'envoyer
  const [recording, setRecording] = useState(false);
  const onRecorderBusy = useCallback((busy: boolean) => setRecording(busy), []);
  // Récapitulatif à confirmer avant l'envoi
  const [reviewing, setReviewing] = useState(false);

  const phoneCheck = validatePhoneNumber(phone);
  const identityOk = fullName.trim().length >= 2 && !!phoneCheck?.isValid;
  const hasTestimony = content.trim().length > 0 || !!audio;
  const canSubmit = identityOk && !recording && category !== '' && hasTestimony;
  const missing = recording
    ? "Termine l'enregistrement (bouton « Arrêter ») avant d'envoyer"
    : category === '' ? 'Choisis le type de témoignage' : !hasTestimony ? 'Écris ou enregistre ton témoignage' : '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setReviewing(false);
    setSendError(null);
    setProgress(0);
    setPageState('submitting');
    try {
      await TestimonyService.submit({
        category: category as TestimonyCategory,
        content,
        audio: audio ? { blob: audio.blob, duration: audio.duration } : null,
        contact: { fullName: fullName.trim(), phone: phoneCheck!.formattedNumber! },
        publicAnonymous,
        shareConsent,
        onProgress: setProgress,
      });
      setPageState('done');
    } catch (e: any) {
      // Reste affiché sous le bouton (et non un message qui disparaît) : la personne peut réessayer ou nous le montrer
      setSendError(`Ton témoignage n'a pas pu être envoyé : ${e?.message || 'erreur inconnue'}. Tes réponses sont conservées : vérifie ta connexion et réessaie.`);
      toast.error("Ton témoignage n'a pas pu être envoyé.", { duration: 6000 });
      setPageState('ready');
    }
  };

  // Un autre témoignage : l'identité est gardée, on repart du formulaire
  const handleReset = () => {
    setCategory('');
    setContent('');
    setAudio(null);
    setPublicAnonymous(false);
    setShareConsent(false);
    setSendError(null);
    setPageState('ready');
  };

  const continueWithIdentity = () => {
    if (!identityOk) return;
    saveIdentity({ fullName: fullName.trim(), phone });
    setPageState('ready');
    window.scrollTo(0, 0);
  };

  if (churchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00665C] animate-spin" aria-label="Chargement" />
      </div>
    );
  }

  const animations = (
    <style>{`
      @keyframes tf-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .tf-animate { animation: tf-fade-up 400ms ease-out both; }
      @media (prefers-reduced-motion: reduce) { .tf-animate { animation: none; } }
    `}</style>
  );

  if (pageState === 'done') {
    return (
      <>
        <Toaster position="top-center" />
        {animations}
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="bg-[#00665C] text-white px-4 pt-10 pb-8 text-center tf-animate">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/15 flex items-center justify-center">
              <Check className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold">Témoignage envoyé !</h1>
            <p className="text-sm text-white/80 mt-1.5">Merci de rendre gloire à Dieu pour ce qu'Il a fait.</p>
          </div>
          <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-4">
            <p className="text-sm text-gray-600 text-center tf-animate" style={{ animationDelay: '80ms' }}>
              « Ils l'ont vaincu à cause du sang de l'Agneau et à cause de la parole de leur témoignage. » — Apocalypse 12:11
            </p>
            <button
              onClick={handleReset}
              className="w-full min-h-[44px] border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:border-[#00665C]/50 hover:text-[#00665C] transition-colors active:scale-[0.98] tf-animate"
              style={{ animationDelay: '140ms' }}
            >
              Partager un autre témoignage
            </button>
          </div>
        </div>
      </>
    );
  }

  const banner = (
    <div className="bg-[#00665C] text-white px-4 pt-10 pb-8">
      <div className="max-w-md mx-auto text-center">
        <p className="text-xs text-amber-300 mb-1 uppercase tracking-widest font-semibold">
          Vases d'Honneur — Assemblée Grâce Confondante (AGC)
        </p>
        <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-300" aria-hidden="true" />
          Mon témoignage
        </h1>
        <p className="text-sm text-white/70 mt-2">Raconte ce que Dieu a fait pour toi, par écrit ou en audio.</p>
        {showAnniversary() && (
          <div className="mt-4 rounded-xl bg-white/10 px-3 py-2.5 text-left flex items-start gap-2.5" data-testid="anniversary-banner">
            <PartyPopper className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-white/90">
              <span className="font-semibold text-amber-300">1 an de l'AGC — 1er novembre.</span> Pour célébrer la première
              année de notre Assemblée, partage ce que Dieu a fait dans ta vie cette année.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Étape 1 : identification (nom + téléphone), avant d'accéder au formulaire ──
  if (pageState === 'identify') {
    return (
      <>
        <Toaster position="top-center" />
        {animations}
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {banner}
          <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-4">
            <form
              className="bg-white rounded-2xl shadow-sm p-4 space-y-3 tf-animate"
              onSubmit={(e) => {
                e.preventDefault();
                continueWithIdentity();
              }}
              data-testid="identity-step"
            >
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-[#00665C]" aria-hidden="true" />
                D'abord, qui es-tu ?
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ton nom et ton numéro ne sont visibles que par les pasteurs. À l'étape suivante, tu pourras demander que ton
                témoignage reste anonyme : ton nom ne sera alors jamais cité au culte ni publié.
              </p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ton nom et prénoms"
                autoComplete="name"
                aria-label="Nom et prénoms"
                className="w-full h-12 px-3 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
              />
              <PhoneInput value={phone} onChange={setPhone} placeholder="Ton numéro de téléphone" />
              {phone.trim().length > 0 && phoneCheck && !phoneCheck.isValid && <p className="text-xs text-red-500">{phoneCheck.error}</p>}
              <button
                type="submit"
                disabled={!identityOk}
                className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl disabled:opacity-40 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      {animations}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Bandeau (même que l'étape 1) */}
        {banner}

        <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5 pb-36">
          <div className="flex items-center gap-2 rounded-xl bg-white border px-3 py-2 text-sm tf-animate" data-testid="identity-summary">
            <UserCircle2 className="w-4 h-4 text-[#00665C] flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0 truncate text-gray-700">
              Tu témoignes en tant que <span className="font-semibold">{fullName.trim()}</span>
            </span>
            <button type="button" onClick={() => setPageState('identify')} className="text-xs font-medium text-[#00665C] hover:underline flex-shrink-0">
              Modifier
            </button>
          </div>

          {/* Type */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 tf-animate">
            <h2 id="testimony-category-label" className="text-sm font-semibold text-gray-700">
              De quel témoignage s'agit-il ?
            </h2>
            <div role="radiogroup" aria-labelledby="testimony-category-label" className="grid grid-cols-2 gap-2.5">
              {TESTIMONY_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center justify-center gap-1.5 text-center px-3 py-3.5 min-h-[84px] rounded-xl border-2 transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00665C]/40 ${
                      selected ? 'border-[#00665C] bg-[#00665C]/5 text-[#00665C]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selected ? 'text-[#00665C]' : 'text-gray-400'}`} aria-hidden="true" />
                    <span className={`text-xs leading-tight font-medium ${selected ? 'font-semibold' : ''}`}>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 tf-animate" style={{ animationDelay: '60ms' }}>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-[#00665C]" aria-hidden="true" />
                Raconte-le en audio
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Plus simple que d'écrire : appuie, parle, puis réécoute avant d'envoyer.
                {publicAnonymous && ' Même anonyme, ta voix peut être reconnue si l’audio est diffusé.'}
              </p>
            </div>
            <AudioRecorder value={audio} onChange={setAudio} onBusyChange={onRecorderBusy} />
          </div>

          {/* Texte */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 tf-animate" style={{ animationDelay: '90ms' }}>
            <div className="flex items-center justify-between">
              <label htmlFor="testimony-content" className="text-sm font-semibold text-gray-700">
                {audio ? 'Un mot par écrit (facultatif)' : 'Ou écris ton témoignage'}
              </label>
              <span className="text-xs text-gray-400" aria-hidden="true">
                {content.length}/{TESTIMONY_CONTENT_MAX}
              </span>
            </div>
            <textarea
              id="testimony-content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, TESTIMONY_CONTENT_MAX))}
              rows={6}
              placeholder="Raconte ce que le Seigneur a fait..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C] resize-none"
            />
          </div>

          {/* Anonymat en public */}
          <div className="bg-white rounded-2xl shadow-sm p-4 tf-animate" style={{ animationDelay: '120ms' }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publicAnonymous}
                onChange={(e) => setPublicAnonymous(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]/40"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <EyeOff className="w-4 h-4 text-[#00665C]" aria-hidden="true" />
                  Je souhaite que mon témoignage reste anonyme
                </span>
                <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Ton nom n'est visible que par les pasteurs. Si tu coches cette case, il ne sera jamais cité au culte ni publié.
                </span>
              </span>
            </label>
          </div>

          {/* Partage */}
          <div className="bg-white rounded-2xl shadow-sm p-4 tf-animate" style={{ animationDelay: '150ms' }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shareConsent}
                onChange={(e) => setShareConsent(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]/40"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Megaphone className="w-4 h-4 text-[#00665C]" aria-hidden="true" />
                  J'accepte que mon témoignage soit partagé
                </span>
                <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Lu ou diffusé au culte, publié pour encourager l'église{publicAnonymous ? ' — sans ton nom, puisque tu restes anonyme' : ''}.
                  Sans cette case, il reste réservé aux pasteurs.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Pied de page fixe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
          <div className="max-w-md mx-auto space-y-1.5">
            {sendError && pageState !== 'submitting' && (
              <p className="text-xs text-red-600 text-center" role="alert" data-testid="send-error">
                {sendError}
              </p>
            )}
            {pageState === 'submitting' && audio && (
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                <div className="h-full bg-[#00665C] transition-all" style={{ width: `${Math.max(3, progress)}%` }} />
              </div>
            )}
            {missing && <p className="text-xs text-gray-400 text-center">{missing}</p>}
            <button
              onClick={() => setReviewing(true)}
              disabled={!canSubmit || pageState === 'submitting'}
              className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-40 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
            >
              {pageState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {pageState === 'submitting'
                ? audio
                  ? progress >= 100
                    ? 'Enregistrement du témoignage...'
                    : `Envoi de l'audio... ${progress} %`
                  : 'Envoi en cours...'
                : sendError
                  ? 'Réessayer l’envoi'
                  : 'Envoyer mon témoignage'}
            </button>
          </div>
        </div>
        {/* Récapitulatif avant l'envoi */}
        {reviewing && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setReviewing(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="testimony-review-title"
              className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="testimony-review-title" className="text-lg font-bold text-gray-900">Envoyer ton témoignage ?</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><span className="text-gray-500">Type :</span> <span className="font-medium">{category}</span></li>
                <li>
                  <span className="text-gray-500">Audio :</span>{' '}
                  <span className="font-medium">{audio ? `oui${audio.duration ? ` (${formatDuration(audio.duration)})` : ''}` : 'non'}</span>
                </li>
                <li>
                  <span className="text-gray-500">Texte :</span>{' '}
                  {content.trim() ? <span className="italic line-clamp-3">« {content.trim()} »</span> : <span className="font-medium">aucun</span>}
                </li>
                <li>
                  <span className="text-gray-500">Identité (pour les pasteurs) :</span>{' '}
                  <span className="font-medium">{fullName.trim()} — {phoneCheck?.formattedNumber || phone.trim()}</span>
                </li>
                <li>
                  <span className="text-gray-500">Anonyme en public :</span> <span className="font-medium">{publicAnonymous ? 'oui, ton nom ne sera jamais cité' : 'non'}</span>
                </li>
                <li>
                  <span className="text-gray-500">Partage :</span>{' '}
                  <span className="font-medium">{shareConsent ? (publicAnonymous ? 'autorisé, sans ton nom' : 'autorisé') : 'réservé aux pasteurs'}</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500">Une fois envoyé, ton témoignage ne peut plus être modifié depuis cette page.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewing(false)}
                  className="min-h-[48px] rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="min-h-[48px] rounded-xl bg-[#00665C] text-white text-sm font-semibold"
                >
                  Confirmer l'envoi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
