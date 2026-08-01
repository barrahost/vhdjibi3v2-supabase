import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { telHref, whatsappHref } from '../utils/phoneValidation';
import { Trophy, Phone, MessageCircle, Heart, Droplets, BookOpen, Sprout, Briefcase, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * "Mes âmes gagnées" — vue LECTURE SEULE pour l'évangéliste.
 * Liste les âmes qu'il a gagnées et qui ont été reçues dans l'église :
 * famille, berger, parcours spirituel. Le suivi appartient désormais au
 * berger ; l'évangéliste garde le lien personnel et un droit de regard.
 */

interface WonSoul {
  id: string;
  fullName: string;
  phone: string;
  createdAt?: Date;
  firstVisitDate?: Date;
  familyName: string | null;
  shepherdName: string | null;
  isServant: boolean;
  spiritual: {
    isBornAgain: boolean;
    isBaptized: boolean;
    isEnrolledInAcademy: boolean;
    isEnrolledInLifeBearers: boolean;
  };
}

const STEP_BADGES: { key: keyof WonSoul['spiritual']; label: string; icon: React.ReactNode; cls: string }[] = [
  { key: 'isBornAgain',           label: 'Né(e) de nouveau', icon: <Heart className="w-3 h-3" />,    cls: 'bg-green-100 text-green-700' },
  { key: 'isBaptized',            label: 'Baptisé(e)',       icon: <Droplets className="w-3 h-3" />, cls: 'bg-blue-100 text-blue-700' },
  { key: 'isEnrolledInAcademy',   label: 'Académie',         icon: <BookOpen className="w-3 h-3" />, cls: 'bg-purple-100 text-purple-700' },
  { key: 'isEnrolledInLifeBearers', label: 'Porteurs de Vie', icon: <Sprout className="w-3 h-3" />,   cls: 'bg-teal-100 text-teal-700' },
];

export default function EvangelistWonSouls() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<WonSoul[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) { setLoading(false); return; }
        const userId = JSON.parse(userStr).id;

        const { data: rows, error } = await supabase
          .from('souls')
          .select('id, full_name, phone, created_at, first_visit_date, service_family_id, shepherd_id, spiritual_profile, is_servant, status')
          .eq('church_id', getChurchId())
          .eq('evangelist_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        const familyIds = [...new Set((rows || []).map((r: any) => r.service_family_id).filter(Boolean))];
        const shepherdIds = [...new Set((rows || []).map((r: any) => r.shepherd_id).filter(Boolean))];

        const [famRes, shepRes] = await Promise.all([
          familyIds.length
            ? supabase.from('service_families').select('id, name').eq('church_id', getChurchId()).in('id', familyIds)
            : Promise.resolve({ data: [] }),
          shepherdIds.length
            ? supabase.from('users').select('id, full_name').eq('church_id', getChurchId()).in('id', shepherdIds)
            : Promise.resolve({ data: [] }),
        ]);
        const famNames = Object.fromEntries((famRes.data || []).map((f: any) => [f.id, f.name]));
        const shepNames = Object.fromEntries((shepRes.data || []).map((s: any) => [s.id, s.full_name]));

        setSouls((rows || []).map((r: any) => {
          const sp = r.spiritual_profile || {};
          return {
            id: r.id,
            fullName: r.full_name || '',
            phone: r.phone || '',
            createdAt: r.created_at ? new Date(r.created_at) : undefined,
            firstVisitDate: r.first_visit_date ? new Date(r.first_visit_date) : undefined,
            familyName: r.service_family_id ? (famNames[r.service_family_id] || null) : null,
            shepherdName: r.shepherd_id ? (shepNames[r.shepherd_id] || null) : null,
            isServant: !!r.is_servant,
            spiritual: {
              isBornAgain: !!sp.isBornAgain,
              isBaptized: !!sp.isBaptized,
              isEnrolledInAcademy: !!sp.isEnrolledInAcademy,
              isEnrolledInLifeBearers: !!sp.isEnrolledInLifeBearers,
            },
          };
        }));
      } catch (e) {
        console.error('Error loading won souls:', e);
        toast.error('Erreur lors du chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = souls.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#F2B636]" /> Mes âmes gagnées
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Les âmes que tu as gagnées et qui sont entrées dans l'église. Leur suivi est assuré par
          leur berger(e) — garde le contact et réjouis-toi de leur parcours !
        </p>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{souls.length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Reçues à l'église</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{souls.filter(s => s.spiritual.isBornAgain).length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Né(e)s de nouveau</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{souls.filter(s => s.spiritual.isBaptized).length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Baptisé(e)s</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {/* Liste — lecture seule */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {searchTerm
              ? 'Aucune âme ne correspond à ta recherche.'
              : "Aucune de tes âmes évangélisées n'a encore été reçue à l'église. Continue le suivi dans « À relancer » !"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(soul => (
            <div key={soul.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{soul.fullName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {soul.firstVisitDate && <span>Reçue le {formatDate(soul.firstVisitDate)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {soul.phone && (
                    <>
                      <a href={telHref(soul.phone) ?? undefined} className="p-1.5 text-[#00665C] hover:bg-[#00665C]/10 rounded-full" title="Appeler">
                        <Phone className="w-4 h-4" />
                      </a>
                      <a href={whatsappHref(soul.phone) ?? undefined} target="_blank" rel="noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded-full" title="WhatsApp">
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">Famille : <strong>{soul.familyName || 'Non assignée'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Heart className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">Berger(e) : <strong>{soul.shepherdName || 'Non assigné(e)'}</strong></span>
                </div>
              </div>

              {/* Parcours spirituel */}
              <div className="mt-3 flex items-center flex-wrap gap-1.5">
                {STEP_BADGES.filter(b => soul.spiritual[b.key]).map(b => (
                  <span key={b.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${b.cls}`}>
                    {b.icon} {b.label}
                  </span>
                ))}
                {soul.isServant && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                    <Briefcase className="w-3 h-3" /> B.O.S.S
                  </span>
                )}
                {!soul.isServant && STEP_BADGES.every(b => !soul.spiritual[b.key]) && (
                  <span className="text-[11px] text-gray-400">Parcours à venir — prie pour elle !</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
