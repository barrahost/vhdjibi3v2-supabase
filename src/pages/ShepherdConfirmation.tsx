import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { CheckSquare, Square, User as UserIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  ShepherdConfirmationService,
  SoulForConfirmation,
} from '../services/shepherdConfirmation.service';

type PageState = 'loading' | 'ready' | 'submitting' | 'done' | 'invalid' | 'already_used';

export default function ShepherdConfirmation() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>('loading');
  const [shepherdName, setShepherdName] = useState('');
  const [souls, setSouls] = useState<SoulForConfirmation[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ confirmed: number; removed: number } | null>(null);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }

    const load = async () => {
      try {
        const info = await ShepherdConfirmationService.getTokenInfo(token);

        if (info.status === 'used') { setState('already_used'); return; }
        if (info.expiresAt < new Date()) { setState('invalid'); return; }

        const soulList = await ShepherdConfirmationService.getSoulsForToken(token);
        setShepherdName(info.shepherdName);
        setSouls(soulList);
        // Toutes cochées par défaut — le berger décoche celles qu'il ne suit pas
        setCheckedIds(new Set(soulList.map(s => s.id)));
        setState('ready');
      } catch {
        setState('invalid');
      }
    };

    load();
  }, [token]);

  const toggle = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!token) return;

    const confirmedIds = [...checkedIds];
    const uncheckedCount = souls.length - checkedIds.size;

    if (uncheckedCount > 0) {
      const ok = window.confirm(
        `${uncheckedCount} âme(s) seront retirées de ta liste et passeront sans berger.\n\nConfirmer ?`
      );
      if (!ok) return;
    }

    setState('submitting');
    try {
      const res = await ShepherdConfirmationService.submitConfirmation(token, confirmedIds);
      setResult(res);
      setState('done');
    } catch {
      setState('ready');
      toast.error('Erreur lors de la soumission. Réessaie.');
    }
  };

  // ── États hors "ready" ──────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#00665C] animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-800">Lien invalide ou expiré</h1>
          <p className="text-sm text-gray-500">
            Ce lien n'est plus valide. Demande un nouveau lien à l'administrateur.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'already_used') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-800">Déjà validé</h1>
          <p className="text-sm text-gray-500">
            Tu as déjà utilisé ce lien. Contacte l'administrateur si tu veux faire une
            nouvelle confirmation.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-14 h-14 text-[#00665C] mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Merci {shepherdName} !</h1>
          {result && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-semibold text-[#00665C]">{result.confirmed}</span> âme(s)
                confirmée(s) dans ta liste.
              </p>
              {result.removed > 0 && (
                <p>
                  <span className="font-semibold text-gray-500">{result.removed}</span> âme(s)
                  passées sans berger.
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Ce lien ne peut plus être utilisé.</p>
        </div>
      </div>
    );
  }

  // ── État "ready" / "submitting" ─────────────────────────────────────────────

  const uncheckedCount = souls.length - checkedIds.size;

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#00665C] text-white px-4 pt-10 pb-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-white/60 mb-1 uppercase tracking-wide">Vases d'Honneur</p>
            <h1 className="text-xl font-bold">{shepherdName}</h1>
            <p className="text-sm text-white/80 mt-1.5 leading-snug">
              Décoche les âmes que tu ne suis <span className="font-semibold">pas</span> ou
              que tu n'as plus de contact. Elles passeront sans berger.
            </p>
          </div>
        </div>

        {/* Barre de stats + raccourcis */}
        <div className="bg-white border-b border-gray-100 px-4 py-2.5 sticky top-0 z-10">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{checkedIds.size}</span>
              <span className="text-gray-400"> / {souls.length}</span>
              {uncheckedCount > 0 && (
                <span className="ml-2 text-xs text-red-500 font-medium">
                  {uncheckedCount} à retirer
                </span>
              )}
            </span>
            <div className="flex gap-3 text-xs">
              <button
                onClick={() => setCheckedIds(new Set(souls.map(s => s.id)))}
                className="text-[#00665C] font-medium hover:underline"
              >
                Tout cocher
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setCheckedIds(new Set())}
                className="text-gray-400 hover:underline"
              >
                Tout décocher
              </button>
            </div>
          </div>
        </div>

        {/* Liste des âmes */}
        <div className="flex-1 max-w-lg mx-auto w-full pb-32">
          {souls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 space-y-2">
              <UserIcon className="w-10 h-10" />
              <p className="text-sm">Aucune âme assignée</p>
            </div>
          ) : (
            <div className="mt-3 mx-3 bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-gray-50">
              {souls.map(soul => {
                const checked = checkedIds.has(soul.id);
                return (
                  <button
                    key={soul.id}
                    type="button"
                    onClick={() => toggle(soul.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:opacity-70 ${
                      checked ? 'bg-white' : 'bg-red-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold ${
                        checked
                          ? 'bg-[#00665C]/10 text-[#00665C]'
                          : 'bg-red-100 text-red-300'
                      }`}
                    >
                      {soul.photoUrl ? (
                        <img src={soul.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        soul.fullName.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Nom + téléphone */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          checked ? 'text-gray-900' : 'text-red-400 line-through'
                        }`}
                      >
                        {soul.fullName}
                      </p>
                      {soul.phone && (
                        <p className="text-xs text-gray-400 truncate">{soul.phone}</p>
                      )}
                    </div>

                    {/* Icône checkbox */}
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-[#00665C] flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-200 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer fixe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
          <div className="max-w-lg mx-auto space-y-1.5">
            {uncheckedCount > 0 && (
              <p className="text-xs text-center text-red-400">
                {uncheckedCount} âme(s) seront retirées de ta liste
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={state === 'submitting'}
              className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {state === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
              {state === 'submitting' ? 'Envoi en cours...' : 'Valider ma liste'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
