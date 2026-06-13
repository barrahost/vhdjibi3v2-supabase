import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Soul, Interaction } from '../../types/database.types';
import { StatCard } from './stats/StatCard';
import { Users, MessageSquare, AlertTriangle, Phone, Sparkles, MessageCircle } from 'lucide-react';
import PendingActionsWidget from './PendingActionsWidget';
import InteractionModal from '../interactions/InteractionModal';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { telHref, whatsappHref } from '../../utils/phoneValidation';
import { isShepherdUser } from '../../utils/roleHelpers';

export function ShepherdDashboard() {
  const { user } = useAuth();
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [shepherdId, setShepherdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactionSoul, setInteractionSoul] = useState<Soul | null>(null);

  // 1) Identifier le berger une seule fois
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) {
          toast.error('Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        const { data: userRows, error: userErr } = await supabase
          .from('users')
          .select('id, role, business_profiles')
          .eq('church_id', getChurchId())
          .eq('id', currentUserId)
          .limit(1);

        if (userErr) throw userErr;
        if (!userRows || userRows.length === 0) {
          if (!cancelled) {
            toast.error('Utilisateur non trouvé');
            setLoading(false);
          }
          return;
        }

        const userData = userRows[0];
        const hasShepherdRole = isShepherdUser({
          role: userData.role,
          businessProfiles: userData.business_profiles || []
        });

        if (!hasShepherdRole) {
          if (!cancelled) {
            toast.error('Vous devez avoir un profil Berger pour accéder à ce tableau de bord');
            setLoading(false);
          }
          return;
        }

        if (!cancelled) setShepherdId(userData.id);
      } catch (error) {
        console.error('Error loading shepherd identity:', error);
        if (!cancelled) {
          toast.error('Erreur lors du chargement des données');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // 2) Charger les âmes et interactions une fois le shepherdId connu
  useEffect(() => {
    if (!shepherdId) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const [soulsResult, interactionsResult] = await Promise.all([
          supabase.from('souls').select('*').eq('church_id', getChurchId()).eq('shepherd_id', shepherdId).eq('status', 'active'),
          supabase.from('interactions').select('id, soul_id, shepherd_id, date, type, notes, created_at').eq('church_id', getChurchId()).eq('shepherd_id', shepherdId).order('created_at', { ascending: false }).limit(50),
        ]);

        if (soulsResult.error) console.error('[ShepherdDashboard] souls error:', soulsResult.error);
        if (interactionsResult.error) console.error('[ShepherdDashboard] interactions error:', interactionsResult.error);

        if (!cancelled) {
          setSouls((soulsResult.data ?? []).map((r: any) => ({
            id: r.id,
            fullName: r.full_name || r.fullName || '',
            phone: r.phone || '',
            spiritualStatus: r.spiritual_profile?.spiritualStatus || r.spiritual_status || null,
            originSource: r.origin_source || r.originSource || null,
            status: r.status || 'active',
            firstVisitDate: r.first_visit_date ? new Date(r.first_visit_date) : null,
            shepherdId: r.shepherd_id || null,
          } as unknown as Soul)));

          const mapped = (interactionsResult.data ?? []).map((r: any) => ({
            id: r.id,
            soulId: r.soul_id,
            shepherdId: r.shepherd_id,
            date: r.date ? new Date(r.date) : (r.created_at ? new Date(r.created_at) : new Date()),
            type: r.type,
            notes: r.notes,
          } as unknown as Interaction));
          setRecentInteractions(mapped);
          setLoading(false);
        }
      } catch (error) {
        console.error('[ShepherdDashboard] Error loading dashboard data:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Realtime subscriptions
    const soulsChannel = supabase
      .channel('shepherd-souls-' + shepherdId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'souls', filter: 'shepherd_id=eq.' + shepherdId }, async () => {
        const { data } = await supabase.from('souls').select('*').eq('church_id', getChurchId()).eq('shepherd_id', shepherdId).eq('status', 'active');
        if (!cancelled) setSouls((data ?? []).map((r: any) => ({ id: r.id, fullName: r.full_name || r.fullName || '', phone: r.phone || '', spiritualStatus: r.spiritual_profile?.spiritualStatus || r.spiritual_status || null, originSource: r.origin_source || null, status: r.status || 'active', firstVisitDate: r.first_visit_date ? new Date(r.first_visit_date) : null, shepherdId: r.shepherd_id || null } as unknown as Soul)));
      })
      .subscribe();

    const interactionsChannel = supabase
      .channel('shepherd-interactions-' + shepherdId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions', filter: 'shepherd_id=eq.' + shepherdId }, async () => {
        const { data } = await supabase.from('interactions').select('id, soul_id, shepherd_id, date, type, notes').eq('church_id', getChurchId()).eq('shepherd_id', shepherdId);
        if (!cancelled) {
          const mapped = (data ?? []).map((r: any) => ({ id: r.id, soulId: r.soul_id, shepherdId: r.shepherd_id, date: r.date ? new Date(r.date) : new Date(), type: r.type, notes: r.notes } as unknown as Interaction));
          setRecentInteractions(mapped.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(soulsChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [shepherdId]);

  // Stats dérivées en temps réel
  const stats = useMemo(() => {
    const attentionThreshold = new Date();
    attentionThreshold.setDate(attentionThreshold.getDate() - 14);

    const soulsNeedingAttention = souls.filter(soul => {
      const soulInteractions = recentInteractions.filter(i => (i as any).soulId === soul.id);
      if (soulInteractions.length === 0) return true;
      const lastInteraction = new Date(Math.max(...soulInteractions.map(i => i.date.getTime())));
      return lastInteraction < attentionThreshold;
    }).length;

    return {
      totalSouls: souls.length,
      totalInteractions: recentInteractions.length,
      soulsNeedingAttention,
    };
  }, [souls, recentInteractions]);

  const soulsWithLastContact = useMemo(() => {
    return souls.map(soul => {
      const soulInteractions = recentInteractions.filter(i => (i as any).soulId === soul.id);
      const lastContact = soulInteractions.length > 0
        ? new Date(Math.max(...soulInteractions.map(i => i.date.getTime())))
        : null;
      const daysSince = lastContact
        ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return { ...soul, lastContact, daysSince };
    }).sort((a, b) => {
      if (a.daysSince === null && b.daysSince === null) return 0;
      if (a.daysSince === null) return -1;
      if (b.daysSince === null) return 1;
      return b.daysSince - a.daysSince;
    });
  }, [souls, recentInteractions]);

  const spiritualStats = useMemo(() => {
    const total = souls.length;
    const bornAgainOrMore = souls.filter((s: any) =>
      ['bornAgain', 'baptized', 'academy'].includes(s.spiritualStatus)
    ).length;
    const spiritualProgressRate = total > 0 ? Math.round((bornAgainOrMore / total) * 100) : 0;

    const byStatus = {
      bornAgain: souls.filter((s: any) => s.spiritualStatus === 'bornAgain').length,
      baptized: souls.filter((s: any) => s.spiritualStatus === 'baptized').length,
      academy: souls.filter((s: any) => s.spiritualStatus === 'academy').length,
      decided: souls.filter((s: any) => s.spiritualStatus === 'decided').length,
      undecided: souls.filter((s: any) => s.spiritualStatus === 'undecided').length,
    };

    const fromEvangelization = souls.filter((s: any) => s.originSource === 'evangelisation').length;
    const fromCulte = souls.filter((s: any) => s.originSource !== 'evangelisation').length;

    return { spiritualProgressRate, byStatus, fromEvangelization, fromCulte, total };
  }, [souls]);

  const getContactBadge = (daysSince: number | null) => {
    if (daysSince === null) return { label: 'Jamais contacté', color: 'bg-gray-100 text-gray-600' };
    if (daysSince === 0) return { label: "Aujourd'hui", color: 'bg-green-100 text-green-700' };
    if (daysSince <= 7) return { label: `Il y a ${daysSince} j`, color: 'bg-green-100 text-green-700' };
    if (daysSince <= 14) return { label: `Il y a ${daysSince} j`, color: 'bg-yellow-100 text-yellow-700' };
    return { label: `Il y a ${daysSince} j`, color: 'bg-red-100 text-red-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon Tableau de bord</h1>

      {shepherdId && <PendingActionsWidget role="shepherd" shepherdId={shepherdId} />}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mes âmes"
          value={stats.totalSouls}
          icon={Users}
          trend={`${stats.totalSouls}`}
          trendLabel="âmes assignées"
        />
        <StatCard
          title="Interactions"
          value={stats.totalInteractions}
          icon={MessageSquare}
          trend={stats.totalSouls > 0
            ? `${(stats.totalInteractions / stats.totalSouls).toFixed(1)}`
            : '0'}
          trendLabel="par âme"
        />
        <StatCard
          title="Nécessitent attention"
          value={stats.soulsNeedingAttention}
          icon={AlertTriangle}
          trend={stats.totalSouls > 0
            ? `${((stats.soulsNeedingAttention / stats.totalSouls) * 100).toFixed(1)}%`
            : '0%'}
          trendLabel="des âmes"
          iconClassName="text-yellow-500"
        />
        <StatCard
          title="Progression spirituelle"
          value={spiritualStats.spiritualProgressRate}
          icon={Sparkles}
          trend={`${spiritualStats.spiritualProgressRate}%`}
          trendLabel="né de nouveau ou +"
          iconClassName="text-green-600"
        />
      </div>

      {/* Mes âmes — suivi par urgence de contact */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#00665C]">Mes âmes — suivi</h2>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {stats.soulsNeedingAttention} à contacter
          </span>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {soulsWithLastContact.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune âme assignée pour le moment
            </div>
          ) : (
            soulsWithLastContact.map(soul => {
              const badge = getContactBadge(soul.daysSince);
              return (
                <div key={soul.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{soul.fullName}</span>
                      {(soul as any).originSource === 'evangelisation' && (
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-normal">
                          évangélisation
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{soul.phone || '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    {telHref(soul.phone) && (
                      <a
                        href={telHref(soul.phone)!}
                        title="Appeler"
                        className="inline-flex items-center justify-center w-8 h-8 text-[#00665C] border border-[#00665C]/40 rounded-lg hover:bg-[#00665C]/10 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {whatsappHref(soul.phone) && (
                      <a
                        href={whatsappHref(soul.phone)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                        className="inline-flex items-center justify-center w-8 h-8 text-[#25D366] border border-[#25D366]/40 rounded-lg hover:bg-[#25D366]/10 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setInteractionSoul(soul)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#00665C] text-white rounded-lg hover:bg-[#00554C] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Contacter</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Progression spirituelle */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-[#00665C] text-sm mb-4">Progression spirituelle de mes âmes</h3>
        {[
          { label: 'Né de nouveau', count: spiritualStats.byStatus.bornAgain, color: '#0F6E56' },
          { label: 'Baptisé',       count: spiritualStats.byStatus.baptized,  color: '#1D9E75' },
          { label: 'Académie',      count: spiritualStats.byStatus.academy,   color: '#5DCAA5' },
          { label: 'Décidé',        count: spiritualStats.byStatus.decided,   color: '#9FE1CB' },
          { label: 'Non décidé',    count: spiritualStats.byStatus.undecided, color: '#D3D1C7' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded h-2">
              <div style={{ width: `${spiritualStats.total > 0 ? Math.round((count / spiritualStats.total) * 100) : 0}%`, background: color, height: '8px', borderRadius: '4px' }} />
            </div>
            <span className="text-xs font-medium w-6 text-right">{count}</span>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-400 mb-2">Origine</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded">
              {spiritualStats.fromEvangelization} évangélisation
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {spiritualStats.fromCulte} culte direct
            </span>
          </div>
        </div>
      </div>

      {interactionSoul && shepherdId && (
        <InteractionModal
          isOpen={!!interactionSoul}
          onClose={() => setInteractionSoul(null)}
          soulId={interactionSoul.id}
          shepherdId={shepherdId}
          soulName={interactionSoul.fullName}
        />
      )}
    </div>
  );
}
