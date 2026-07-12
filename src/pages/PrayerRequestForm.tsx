import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  HandHeart, Loader2, MessageCircle, Video, Clock,
  Sparkles, Home, Briefcase, Coins, HeartPulse, MoreHorizontal, Check,
} from 'lucide-react';
import { PrayerRequestService, PRAYER_CATEGORIES, PrayerCategory } from '../services/prayerRequest.service';
import { getChurchId } from '../lib/churchId';
import { useChurch } from '../contexts/ChurchContext';

type PageState = 'ready' | 'submitting' | 'done';

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/KcVuNvQVXFo9F64tc3J5lv?s=sw&p=i&ilr=4';
const WHATSAPP_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(WHATSAPP_GROUP_LINK)}`;
const ZOOM_LINK = 'https://us06web.zoom.us/j/83073021522?pwd=BpVbGvIVbBY8bLmT7awfYHR6aj4vlr.1';
const SUBJECT_MAX_LENGTH = 500;

const CATEGORY_ICONS: Record<PrayerCategory, React.ComponentType<{ className?: string }>> = {
  'Déblocage Spirituel': Sparkles,
  'Déblocage Familial': Home,
  'Déblocage Professionnel': Briefcase,
  'Déblocage Financier': Coins,
  'Déblocage Santé': HeartPulse,
  'Autre': MoreHorizontal,
};

export default function PrayerRequestForm() {
  const { loading: churchLoading } = useChurch();
  const [pageState, setPageState] = useState<PageState>('ready');
  const [category, setCategory] = useState<PrayerCategory | ''>('');
  const [subject, setSubject] = useState('');

  const canSubmit = category !== '' && subject.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPageState('submitting');
    try {
      await PrayerRequestService.submitPrayerRequest(getChurchId(), category as PrayerCategory, subject.trim());
      setPageState('done');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'envoi. Réessaie.');
      setPageState('ready');
    }
  };

  const handleReset = () => {
    setCategory('');
    setSubject('');
    setPageState('ready');
  };

  if (churchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00665C] animate-spin" aria-label="Chargement" />
      </div>
    );
  }

  const ScheduleBadge = ({ tone = 'light' }: { tone?: 'light' | 'dark' }) => (
    <div
      className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
        tone === 'light' ? 'bg-white/10' : 'bg-black/5 text-gray-600'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${tone === 'light' ? 'text-amber-300' : 'text-gray-400'}`} />
      Tous les mardis, de 00h à 6h du matin
    </div>
  );

  if (pageState === 'done') {
    return (
      <>
        <Toaster position="top-center" />
        <style>{`
          @keyframes prf-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .prf-animate { animation: prf-fade-up 400ms ease-out both; }
          @media (prefers-reduced-motion: reduce) { .prf-animate { animation: none; } }
        `}</style>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="bg-[#00665C] text-white px-4 pt-10 pb-8 text-center prf-animate">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/15 flex items-center justify-center">
              <Check className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold">Sujet envoyé !</h1>
            <p className="text-sm text-white/80 mt-1.5">Merci, ton sujet sera porté dans la prière.</p>
            <ScheduleBadge tone="light" />
          </div>

          <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-4">
            <div className="bg-emerald-600 rounded-2xl p-5 text-center space-y-4 prf-animate" style={{ animationDelay: '80ms' }}>
              <div className="bg-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-900">
                  <MessageCircle className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <h2 className="font-bold">Rejoins le groupe WhatsApp</h2>
                </div>
                <p className="text-xs text-gray-500">Chaîne de Prière</p>
                <img
                  src={WHATSAPP_QR_URL}
                  alt="QR code à scanner avec WhatsApp pour rejoindre le groupe de la chaîne de prière"
                  className="w-40 h-40 mx-auto"
                  width={160}
                  height={160}
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-white/90 leading-relaxed px-2">
                Scanne ce code QR avec la caméra de WhatsApp, ou clique directement sur le bouton ci-dessous.
              </p>
              <a
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full min-h-[48px] leading-[3rem] bg-white text-emerald-700 font-semibold rounded-xl transition-transform active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Rejoindre le groupe WhatsApp
              </a>
            </div>

            <a
              href={ZOOM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-amber-500 text-white font-semibold rounded-xl transition-transform active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 prf-animate"
              style={{ animationDelay: '140ms' }}
            >
              <Video className="w-4 h-4" aria-hidden="true" />
              Rejoindre la rencontre Zoom
            </a>

            <button
              onClick={handleReset}
              className="w-full min-h-[44px] border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:border-[#00665C]/50 hover:text-[#00665C] transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00665C]/40 prf-animate"
              style={{ animationDelay: '200ms' }}
            >
              Soumettre un autre sujet
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <style>{`
        @keyframes prf-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .prf-animate { animation: prf-fade-up 400ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .prf-animate { animation: none; } }
      `}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Bandeau */}
        <div className="bg-[#00665C] text-white px-4 pt-10 pb-8">
          <div className="max-w-md mx-auto text-center">
            <p className="text-xs text-amber-300 mb-1 uppercase tracking-widest font-semibold">
              Vases d'Honneur — Assemblée Grâce Confondante (AGC)
            </p>
            <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2">
              <HandHeart className="w-6 h-6 text-amber-300" aria-hidden="true" />
              Chaîne de Prière
            </h1>
            <p className="text-sm text-white/70 mt-2">Dépose ton sujet, la communauté prie avec toi.</p>
            <ScheduleBadge tone="light" />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5 pb-32">

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 prf-animate">
            <h2 id="category-label" className="text-sm font-semibold text-gray-700">
              Pour quel type de sujet souhaites-tu poster ta demande de prière ?
            </h2>
            <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 gap-2.5">
              {PRAYER_CATEGORIES.map(cat => {
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
                      selected
                        ? 'border-[#00665C] bg-[#00665C]/5 text-[#00665C]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selected ? 'text-[#00665C]' : 'text-gray-400'}`} aria-hidden="true" />
                    <span className={`text-xs leading-tight font-medium ${selected ? 'font-semibold' : ''}`}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 prf-animate" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center justify-between">
              <label htmlFor="prayer-subject" className="text-sm font-semibold text-gray-700">
                Quel est ton sujet ?
              </label>
              <span className="text-xs text-gray-400" aria-hidden="true">
                {subject.length}/{SUBJECT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="prayer-subject"
              value={subject}
              onChange={e => setSubject(e.target.value.slice(0, SUBJECT_MAX_LENGTH))}
              rows={5}
              placeholder="Écris ton sujet de prière ici..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C] resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 prf-animate" style={{ animationDelay: '120ms' }}>
            <h2 className="text-sm font-semibold text-gray-700">Rejoins la chaîne de prière</h2>
            <a
              href={WHATSAPP_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 min-h-[64px] rounded-xl border-2 border-emerald-100 bg-emerald-50 hover:border-emerald-200 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-800">Groupe WhatsApp</p>
                <p className="text-xs text-emerald-600">Rejoindre les échanges de prière</p>
              </div>
            </a>
            <a
              href={ZOOM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 min-h-[64px] rounded-xl border-2 border-amber-100 bg-amber-50 hover:border-amber-200 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">Rencontre Zoom</p>
                <p className="text-xs text-amber-700">Rejoindre le temps de prière en direct</p>
              </div>
            </a>
          </div>
        </div>

        {/* Footer fixe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || pageState === 'submitting'}
              className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-40 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00665C]/50"
            >
              {pageState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {pageState === 'submitting' ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
