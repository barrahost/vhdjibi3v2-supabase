import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import { SoulEvolutionChart } from './stats/SoulEvolutionChart';
import {
  Users, Heart, Megaphone, MessageCircle, AlertTriangle, CheckCircle2,
  ArrowRight, Plus, Upload, BarChart2, Cake, Map, Loader2, UserX, Clock
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface KPI { label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode; href?: string; alert?: boolean; }
interface Alert { id: string; label: string; count: number; href: string; }
interface RecentSoul { id: string; fullName: string; location: string; shepherdId?: string; createdAt: any; }
interface RecentInteraction { id: string; type: string; date: Date; soulId: string; }

// ─── Composant principal ───────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentSouls, setRecentSouls] = useState<RecentSoul[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<RecentInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Charger toutes les données en parallèle
        const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0,0,0,0);

        const [soulsRes, evangelizedRes, interactionsRes, recentSoulsRes, recentInterRes, interactionsCountRes] = await Promise.all([
          supabase.from('souls').select('id,shepherd_id,service_family_id,is_undecided').eq('church_id', getChurchId()).eq('status', 'active'),
          supabase.from('evangelized_souls').select('id,imported_to_soul_id').eq('church_id', getChurchId()).neq('status', 'imported'),
          supabase.from('interactions').select('id,date').eq('church_id', getChurchId()).gte('date', weekStart.toISOString()),
          supabase.from('souls').select('id,full_name,location,shepherd_id,created_at').eq('church_id', getChurchId()).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
          supabase.from('interactions').select('id,type,date,soul_id').eq('church_id', getChurchId()).order('date', { ascending: false }).limit(5),
          supabase.from('interactions').select('id', { count: 'exact', head: true }).eq('church_id', getChurchId()),
        ]);

        if (cancelled) return;

        const souls = soulsRes.data || [];
        const noShepherd = souls.filter((s: any) => !s.shepherd_id).length;
        const undecided = souls.filter((s: any) => s.is_undecided).length;
        const noFamily = souls.filter((s: any) => !s.service_family_id && !s.is_undecided).length;

        const evangelized = evangelizedRes.data || [];
        const pendingEvang = evangelized.filter((s: any) => !s.imported_to_soul_id).length;

        const weekInteractions = (interactionsRes.data || []).length;
        const totalInteractions = interactionsCountRes.count || 0;

        setKpis([
          {
            label: 'Âmes actives',
            value: souls.length,
            sub: `${noShepherd} sans berger`,
            color: 'text-[#00665C]',
            icon: <Heart className="w-5 h-5" />,
            href: '/ames',
            alert: noShepherd > 0
          },
          {
            label: 'Âmes évangélisées en suivi',
            value: pendingEvang,
            sub: 'pas encore reçues',
            color: 'text-amber-600',
            icon: <Megaphone className="w-5 h-5" />,
            href: '/ames-evangelisees'
          },
          {
            label: 'Interactions cette semaine',
            value: weekInteractions,
            sub: `${totalInteractions} au total`,
            color: 'text-blue-600',
            icon: <MessageCircle className="w-5 h-5" />,
            href: '/interactions'
          },
          {
            label: 'Âmes indécises',
            value: undecided,
            sub: 'à recontacter',
            color: undecided > 0 ? 'text-red-600' : 'text-gray-400',
            icon: <UserX className="w-5 h-5" />,
            href: '/ames-indecises',
            alert: undecided > 0
          },
        ]);

        // Alertes
        const newAlerts: Alert[] = [];
        if (noShepherd > 0) newAlerts.push({ id: 'no-shepherd', label: `${noShepherd} âme${noShepherd > 1 ? 's' : ''} sans berger`, count: noShepherd, href: '/ames' });
        if (undecided > 0) newAlerts.push({ id: 'undecided', label: `${undecided} âme${undecided > 1 ? 's' : ''} indécise${undecided > 1 ? 's' : ''} à recontacter`, count: undecided, href: '/ames-indecises' });
        if (noFamily > 0) newAlerts.push({ id: 'no-family', label: `${noFamily} âme${noFamily > 1 ? 's' : ''} sans famille de service`, count: noFamily, href: '/ames' });
        if (pendingEvang > 0) newAlerts.push({ id: 'pending-evang', label: `${pendingEvang} âme${pendingEvang > 1 ? 's' : ''} évangélisée${pendingEvang > 1 ? 's' : ''} en attente de réception`, count: pendingEvang, href: '/ames-evangelisees' });
        setAlerts(newAlerts);

        // Activité récente
        setRecentSouls((recentSoulsRes.data || []).map((d: any) => ({
          id: d.id,
          fullName: d.full_name,
          location: d.location,
          shepherdId: d.shepherd_id,
          createdAt: d.created_at,
        } as RecentSoul)));
        setRecentInteractions((recentInterRes.data || []).map((d: any) => ({
          id: d.id,
          type: d.type,
          date: new Date(d.date),
          soulId: d.soul_id,
        })));

      } catch (err) {
        console.error('AdminDashboard load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#00665C] mr-2" />
        <span className="text-gray-500">Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/statistiques')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/5 self-start sm:self-auto"
        >
          <BarChart2 className="w-4 h-4" />
          Voir les statistiques
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <button
            key={kpi.label}
            onClick={() => kpi.href && navigate(kpi.href)}
            className={`bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow ${kpi.alert ? 'border-amber-300 bg-amber-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`${kpi.color}`}>{kpi.icon}</span>
              {kpi.alert && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs font-medium text-gray-700 mt-0.5">{kpi.label}</p>
            {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche : Alertes + Accès rapides */}
        <div className="space-y-6">

          {/* Alertes */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Actions requises</h2>
              {alerts.length > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="divide-y">
              {alerts.length === 0 ? (
                <div className="px-4 py-4 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Tout est à jour !
                </div>
              ) : alerts.map(alert => (
                <div key={alert.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="flex-1 text-gray-800">{alert.label}</span>
                  <button
                    onClick={() => navigate(alert.href)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded"
                  >
                    Voir <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Accès rapides */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Accès rapides</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Ajouter une âme', icon: <Plus className="w-4 h-4" />, href: '/ames', color: 'bg-[#00665C] text-white hover:bg-[#00665C]/90' },
                { label: 'Âmes évangélisées', icon: <Megaphone className="w-4 h-4" />, href: '/ames-evangelisees', color: 'bg-amber-500 text-white hover:bg-amber-600' },
                { label: 'Statistiques', icon: <BarChart2 className="w-4 h-4" />, href: '/statistiques', color: 'bg-blue-600 text-white hover:bg-blue-700' },
                { label: 'Carte des âmes', icon: <Map className="w-4 h-4" />, href: '/carte', color: 'bg-purple-600 text-white hover:bg-purple-700' },
                { label: 'Anniversaires', icon: <Cake className="w-4 h-4" />, href: '/anniversaires', color: 'bg-pink-500 text-white hover:bg-pink-600' },
                { label: 'Interactions', icon: <MessageCircle className="w-4 h-4" />, href: '/interactions', color: 'bg-gray-700 text-white hover:bg-gray-800' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-colors ${item.color}`}
                >
                  {item.icon}
                  <span className="text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite : Activité récente */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dernières âmes */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00665C]" />
                <h2 className="font-semibold text-gray-900 text-sm">Dernières âmes ajoutées</h2>
              </div>
              <button onClick={() => navigate('/ames')} className="text-xs text-[#00665C] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y">
              {recentSouls.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400">Aucune âme récente</p>
              ) : recentSouls.map(soul => (
                <div key={soul.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00665C]/10 flex items-center justify-center text-xs font-semibold text-[#00665C]">
                      {(soul.fullName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{soul.fullName}</p>
                      <p className="text-xs text-gray-400">{soul.location}</p>
                    </div>
                  </div>
                  {soul.shepherdId
                    ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Assignée</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Sans berger</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Dernières interactions */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Interactions récentes</h2>
              </div>
              <button onClick={() => navigate('/interactions')} className="text-xs text-[#00665C] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y">
              {recentInteractions.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400">Aucune interaction récente</p>
              ) : recentInteractions.map(inter => (
                <div key={inter.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      inter.type === 'call' ? 'bg-blue-100 text-blue-700' :
                      inter.type === 'visit' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {inter.type === 'call' ? '📞' : inter.type === 'visit' ? '🏠' : '💬'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inter.type === 'call' ? 'Appel' : inter.type === 'visit' ? 'Visite' : 'Message'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(inter.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Évolution des âmes */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Évolution de la congrégation</h2>
          <button onClick={() => navigate('/statistiques')} className="text-xs text-[#00665C] hover:underline flex items-center gap-1">
            Stats complètes <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4">
          <SoulEvolutionChart />
        </div>
      </div>

    </div>
  );
}
