import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { EvangelizedSoul } from '../types/evangelized.types';
import { telHref } from '../utils/phoneValidation';
import { Phone, Sparkles, Clock } from 'lucide-react';
import InteractionModal from '../components/interactions/InteractionModal';
import toast from 'react-hot-toast';

interface InteractionLite {
  id: string;
  soulId: string;
  date: Date;
}

const RELANCE_THRESHOLD_DAYS = 3;

function getLatePill(daysSince: number | null) {
  if (daysSince === null) return { label: 'Jamais contacté(e)', color: 'bg-red-100 text-red-700' };
  return { label: `Il y a ${daysSince} j`, color: daysSince > 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700' };
}

export default function EvangelistRelances() {
  const { user } = useAuth();
  const [evangelistId, setEvangelistId] = useState<string | null>(null);
  const [souls, setSouls] = useState<EvangelizedSoul[]>([]);
  const [interactions, setInteractions] = useState<InteractionLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactingSoul, setInteractingSoul] = useState<EvangelizedSoul | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) { setLoading(false); return; }
        const localUser = JSON.parse(userStr);
        const userId = localUser.id;

        const [soulsRes, interRes] = await Promise.all([
          supabase.from('evangelized_souls').select('*').eq('church_id', getChurchId()).eq('evangelist_id', userId).eq('status', 'active'),
          supabase.from('interactions').select('id, soul_id, date').eq('church_id', getChurchId()).eq('shepherd_id', userId),
        ]);
        if (cancelled) return;

        const mapped = (soulsRes.data ?? [])
          .filter((row: any) => !row.imported_to_soul_id)
          .map((row: any) => ({
            id: row.id,
            fullName: row.full_name,
            phone: row.phone,
            location: row.location,
            evangelizationDate: row.evangelization_date ? new Date(row.evangelization_date) : new Date(),
            evangelistId: row.evangelist_id,
            status: row.status,
          } as EvangelizedSoul));
        setSouls(mapped);
        setEvangelistId(userId);
        setInteractions((interRes.data ?? []).map((r: any) => ({ id: r.id, soulId: r.soul_id, date: new Date(r.date) })));
      } catch (error) {
        console.error('Error loading relances:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const queue = useMemo(() => {
    return souls
      .map((soul) => {
        const soulInter = interactions.filter((i) => i.soulId === soul.id);
        const lastContact = soulInter.length > 0
          ? new Date(Math.max(...soulInter.map((i) => i.date.getTime())))
          : null;
        const daysSince = lastContact
          ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return { soul, daysSince };
      })
      .filter((x) => x.daysSince === null || x.daysSince >= RELANCE_THRESHOLD_DAYS)
      .sort((a, b) => {
        if (a.daysSince === null && b.daysSince === null) return 0;
        if (a.daysSince === null) return -1;
        if (b.daysSince === null) return 1;
        return b.daysSince - a.daysSince;
      });
  }, [souls, interactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">À relancer</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Contacts non rappelés depuis {RELANCE_THRESHOLD_DAYS}+ jours — les plus en retard en haut
          </p>
        </div>
        {queue.length > 0 && (
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            {queue.length} à traiter
          </span>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-8 flex flex-col items-center gap-2 text-center">
          <Sparkles className="w-6 h-6 text-brand-700" />
          <p className="text-sm font-semibold text-brand-900">Aucune relance en attente</p>
          <p className="text-xs text-brand-700">Votre file est à jour.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(({ soul, daysSince }) => {
            const pill = getLatePill(daysSince);
            return (
              <div key={soul.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {soul.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <p className="text-sm font-semibold text-gray-900">{soul.fullName}</p>
                    <p className="text-xs text-gray-500">{soul.location} · {soul.phone || '—'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pill.color}`}>{pill.label}</span>
                </div>
                <div className="flex gap-2">
                  {telHref(soul.phone) && (
                    <a
                      href={telHref(soul.phone)!}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-brand-200 hover:text-brand-700 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Appeler
                    </a>
                  )}
                  <button
                    onClick={() => setInteractingSoul(soul)}
                    className="flex-[1.5] flex items-center justify-center gap-1.5 h-10 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" /> Noter le résultat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {interactingSoul && evangelistId && (
        <InteractionModal
          isOpen={!!interactingSoul}
          onClose={() => setInteractingSoul(null)}
          soulId={interactingSoul.id}
          shepherdId={evangelistId}
          soulName={interactingSoul.fullName}
          sourceCollection="evangelized_souls"
        />
      )}
    </div>
  );
}
