import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { formatDate } from '../../utils/dateUtils';
import {
  Heart, Users, Sparkles, TrendingUp, TrendingDown, Presentation,
  CalendarDays, HandHelping, HandHeart, Droplets, ChevronRight,
} from 'lucide-react';

/**
 * Tableau de bord Pasteur — regard pastoral, pas opérationnel :
 * l'église en un coup d'œil, le dernier culte, ce qui attend sa décision
 * (congés, besoins), et la vie spirituelle. Composition de données existantes.
 */

interface PastorStats {
  totalSouls: number;
  newThisMonth: number;
  decisionsThisMonth: number;
  followedRate: number; // % d'âmes avec berger
  bornAgain: number;
  baptized: number;
}

interface LastWorship {
  date: string;
  meetingType: string | null;
  participants: number;
  newMembers: number;
  prevParticipants: number | null;
}

export function PastorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PastorStats | null>(null);
  const [lastWorship, setLastWorship] = useState<LastWorship | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<{ name: string; period: string }[]>([]);
  const [needs, setNeeds] = useState<{ high: number; medium: number; low: number }>({ high: 0, medium: 0, low: 0 });
  const [prayers, setPrayers] = useState<{ category: string; subject: string; date?: Date }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const churchId = getChurchId();
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthStartIso = monthStart.toISOString();

        const [soulsRes, worshipRes, leavesRes, needsRes, prayersRes] = await Promise.all([
          supabase.from('souls')
            .select('id, shepherd_id, created_at, wants_to_give_life, spiritual_profile')
            .eq('church_id', churchId).eq('status', 'active'),
          supabase.from('culte_reports')
            .select('service_date, meeting_type_name, data')
            .eq('church_id', churchId).eq('report_type', 'worship')
            .order('service_date', { ascending: false }).limit(2),
          supabase.from('leave_requests')
            .select('user_name, start_date, end_date')
            .eq('church_id', churchId).eq('status', 'pending')
            .order('submitted_at', { ascending: true }).limit(5),
          supabase.from('culte_report_needs')
            .select('priority')
            .eq('church_id', churchId).eq('is_addressed', false),
          supabase.from('prayer_requests')
            .select('category, subject, submitted_at')
            .eq('church_id', churchId)
            .order('submitted_at', { ascending: false }).limit(4),
        ]);
        if (cancelled) return;

        const souls = soulsRes.data || [];
        const withShepherd = souls.filter((s: any) => s.shepherd_id).length;
        const newSouls = souls.filter((s: any) => s.created_at && s.created_at >= monthStartIso);
        setStats({
          totalSouls: souls.length,
          newThisMonth: newSouls.length,
          decisionsThisMonth: newSouls.filter((s: any) => s.wants_to_give_life === true).length,
          followedRate: souls.length ? Math.round((withShepherd / souls.length) * 100) : 0,
          bornAgain: souls.filter((s: any) => s.spiritual_profile?.isBornAgain).length,
          baptized: souls.filter((s: any) => s.spiritual_profile?.isBaptized).length,
        });

        const [last, prev] = worshipRes.data || [];
        if (last) {
          setLastWorship({
            date: last.service_date,
            meetingType: last.meeting_type_name,
            participants: Number(last.data?.totalParticipants) || 0,
            newMembers: Number(last.data?.totalNewMembers) || 0,
            prevParticipants: prev ? (Number(prev.data?.totalParticipants) || 0) : null,
          });
        }

        setPendingLeaves((leavesRes.data || []).map((l: any) => ({
          name: l.user_name,
          period: `${(l.start_date || '').split('-').reverse().join('/')} au ${(l.end_date || '').split('-').reverse().join('/')}`,
        })));

        const counts = { high: 0, medium: 0, low: 0 };
        (needsRes.data || []).forEach((n: any) => {
          if (n.priority === 'high') counts.high++;
          else if (n.priority === 'medium') counts.medium++;
          else counts.low++;
        });
        setNeeds(counts);

        setPrayers((prayersRes.data || []).map((p: any) => ({
          category: p.category,
          subject: p.subject,
          date: p.submitted_at ? new Date(p.submitted_at) : undefined,
        })));
      } catch (e) {
        console.error('Error loading pastor dashboard:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const totalNeeds = needs.high + needs.medium + needs.low;
  const trend = lastWorship && lastWorship.prevParticipants !== null
    ? lastWorship.participants - lastWorship.prevParticipants
    : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">L'église en un coup d'œil</h1>
      </div>

      {/* 1. Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Âmes actives', value: stats?.totalSouls ?? 0, icon: <Heart className="w-4 h-4 text-[#00665C]" /> },
          { label: 'Nouvelles ce mois', value: stats?.newThisMonth ?? 0, icon: <Sparkles className="w-4 h-4 text-[#F2B636]" /> },
          { label: 'Décisions pour Christ (mois)', value: stats?.decisionsThisMonth ?? 0, icon: <HandHeart className="w-4 h-4 text-green-600" /> },
          { label: 'Âmes suivies (berger)', value: `${stats?.followedRate ?? 0}%`, icon: <Users className="w-4 h-4 text-blue-600" /> },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2">{card.icon}
              <p className="text-[11px] text-gray-500 uppercase tracking-wide leading-tight">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 2. Dernier culte */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Presentation className="w-4 h-4 text-[#00665C]" /> Dernier culte
          </h2>
          <button onClick={() => navigate('/rapports/worship')} className="text-xs text-[#00665C] hover:underline flex items-center">
            Tous les rapports <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {lastWorship ? (
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-sm text-gray-500">{(lastWorship.date || '').split('-').reverse().join('/')}{lastWorship.meetingType ? ` — ${lastWorship.meetingType}` : ''}</p>
              <div className="flex items-end gap-5 mt-1.5">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{lastWorship.participants}</p>
                  <p className="text-xs text-gray-500">participants</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{lastWorship.newMembers}</p>
                  <p className="text-xs text-gray-500">nouveaux</p>
                </div>
                {trend !== null && (
                  <div className={`flex items-center gap-1 text-sm font-medium pb-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {trend >= 0 ? '+' : ''}{trend} vs culte précédent
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucun rapport de culte pour le moment.</p>
        )}
      </div>

      {/* 3. À décider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-600" /> Congés en attente
              {pendingLeaves.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                  {pendingLeaves.length}
                </span>
              )}
            </h2>
            <button onClick={() => navigate('/absences')} className="text-xs text-[#00665C] hover:underline flex items-center">
              Traiter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune demande en attente. 👍</p>
          ) : (
            <ul className="space-y-2">
              {pendingLeaves.map((l, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800 truncate">{l.name}</span>
                  <span className="text-gray-500 text-xs flex-shrink-0 ml-2">{l.period}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <HandHelping className="w-4 h-4 text-red-500" /> Besoins signalés
              {totalNeeds > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {totalNeeds}
                </span>
              )}
            </h2>
            <button onClick={() => navigate('/besoins-rapports')} className="text-xs text-[#00665C] hover:underline flex items-center">
              Gérer <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {totalNeeds === 0 ? (
            <p className="text-sm text-gray-400">Aucun besoin en attente. 👍</p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {needs.high > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{needs.high} urgent{needs.high > 1 ? 's' : ''}</span>}
              {needs.medium > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{needs.medium} moyen{needs.medium > 1 ? 's' : ''}</span>}
              {needs.low > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{needs.low} faible{needs.low > 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>
      </div>

      {/* 4. Vie spirituelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-blue-600" /> Parcours spirituels
          </h2>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats?.bornAgain ?? 0}</p>
              <p className="text-xs text-gray-500">né(e)s de nouveau</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats?.baptized ?? 0}</p>
              <p className="text-xs text-gray-500">baptisé(e)s</p>
            </div>
            <button onClick={() => navigate('/statistiques?tab=spiritual')} className="text-xs text-[#00665C] hover:underline flex items-center ml-auto">
              Détails <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <HandHeart className="w-4 h-4 text-[#00665C]" /> Chaîne de prière
            </h2>
            <button onClick={() => navigate('/prieres')} className="text-xs text-[#00665C] hover:underline flex items-center">
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {prayers.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun sujet récent.</p>
          ) : (
            <ul className="space-y-2">
              {prayers.map((p, i) => (
                <li key={i} className="text-sm">
                  <span className="text-xs font-semibold text-[#00665C]">{p.category}</span>
                  <p className="text-gray-700 truncate">{p.subject}</p>
                  {p.date && <p className="text-[11px] text-gray-400">{formatDate(p.date)}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
