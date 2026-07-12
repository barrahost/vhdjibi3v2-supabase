import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { HandHeart, Loader2, MessageCircle, Video, Clock } from 'lucide-react';
import { PrayerRequestService, PRAYER_CATEGORIES, PrayerCategory } from '../services/prayerRequest.service';
import { getChurchId } from '../lib/churchId';
import { useChurch } from '../contexts/ChurchContext';

type PageState = 'ready' | 'submitting' | 'done';

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/KcVuNvQVXFo9F64tc3J5lv?s=sw&p=i&ilr=4';
const WHATSAPP_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(WHATSAPP_GROUP_LINK)}`;
const ZOOM_LINK = 'https://us06web.zoom.us/j/83073021522?pwd=BpVbGvIVbBY8bLmT7awfYHR6aj4vlr.1';

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
        <Loader2 className="w-8 h-8 text-[#00665C] animate-spin" />
      </div>
    );
  }

  if (pageState === 'done') {
    return (
      <>
        <Toaster position="top-center" />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="bg-[#00665C] text-white px-4 pt-10 pb-8 text-center">
            <HandHeart className="w-10 h-10 mx-auto mb-3" />
            <h1 className="text-xl font-bold">Sujet envoyé !</h1>
            <p className="text-sm text-white/80 mt-1.5">Merci, ton sujet sera porté dans la prière.</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              Tous les mardis, de 00h à 6h du matin
            </div>
          </div>

          <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-4">
            <div className="bg-emerald-600 rounded-2xl p-5 text-center space-y-4">
              <div className="bg-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-900">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold">Rejoins le groupe WhatsApp</h2>
                </div>
                <p className="text-xs text-gray-500">Chaîne de Prière</p>
                <img
                  src={WHATSAPP_QR_URL}
                  alt="QR code du groupe WhatsApp"
                  className="w-40 h-40 mx-auto"
                  width={160}
                  height={160}
                />
              </div>
              <p className="text-xs text-white/90 leading-relaxed px-2">
                Scanne ce code QR avec la caméra de WhatsApp, ou clique directement sur le bouton ci-dessous.
              </p>
              <a
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-12 leading-[3rem] bg-white text-emerald-700 font-semibold rounded-xl"
              >
                Rejoindre le groupe WhatsApp
              </a>
            </div>

            <a
              href={ZOOM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 text-white font-semibold rounded-xl"
            >
              <Video className="w-4 h-4" />
              Rejoindre la rencontre Zoom
            </a>

            <button
              onClick={handleReset}
              className="w-full h-11 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:border-[#00665C]/50 hover:text-[#00665C] transition-colors"
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
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Bandeau */}
        <div className="bg-gradient-to-br from-[#0B1D3A] to-[#132A52] text-white px-4 pt-10 pb-8">
          <div className="max-w-md mx-auto text-center">
            <p className="text-xs text-amber-300 mb-1 uppercase tracking-widest font-semibold">Vases d'Honneur</p>
            <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2">
              <HandHeart className="w-6 h-6 text-amber-300" />
              Chaîne de Prière
            </h1>
            <p className="text-sm text-white/70 mt-2">Dépose ton sujet, la communauté prie avec toi.</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              Tous les mardis, de 00h à 6h du matin
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5 pb-32">

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Pour quel type de sujet souhaites-tu poster ta demande de prière ?
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {PRAYER_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                    category === cat
                      ? 'border-[#00665C] bg-[#00665C]/5 text-[#00665C] font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">Quel est ton sujet ?</h2>
            <textarea
              value={subject}
              onChange={e => setSubject(e.target.value)}
              rows={5}
              placeholder="Écris ton sujet de prière ici..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C] resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Rejoins la chaîne de prière</h2>
            <a
              href={WHATSAPP_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50 hover:border-emerald-200 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
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
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-blue-100 bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-800">Rencontre Zoom</p>
                <p className="text-xs text-blue-600">Rejoindre le temps de prière en direct</p>
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
              className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-40 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {pageState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
              {pageState === 'submitting' ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
