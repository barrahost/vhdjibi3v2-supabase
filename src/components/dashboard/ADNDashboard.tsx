import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StatCard } from './stats/StatCard';
import { Users, UserCheck, UserX, User, AlertTriangle } from 'lucide-react';
import { RecentActivity } from './stats/RecentActivity';
import { SoulEvolutionChart } from './stats/SoulEvolutionChart';
import PendingActionsWidget from './PendingActionsWidget';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import toast from 'react-hot-toast';

type Period = '7d' | '30d' | '90d' | '365d' | 'all';

const periodLabel: Record<Period, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '3 derniers mois',
  '365d': 'Cette année',
  'all': 'Depuis le début',
};

interface SoulLite {
  id: string;
  createdAt: Date;
  shepherdId?: string;
  isUndecided?: boolean;
  gender?: string;
  status?: string;
  serviceFamilyId?: string;
}

export function ADNDashboard() {
  const navigate = useNavigate();
  const { families } = useServiceFamilies(true);
  const [souls, setSouls] = useState<SoulLite[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const soulsRef = collection(db, 'souls');

    const unsubscribe = onSnapshot(
      soulsRef,
      (snapshot) => {
        try {
          const data: SoulLite[] = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              createdAt: d.createdAt?.toDate() || new Date(),
              shepherdId: d.shepherdId as string | undefined,
              isUndecided: d.isUndecided as boolean,
              gender: d.gender as string,
              status: d.status as string,
              serviceFamilyId: d.serviceFamilyId as string | undefined,
            };
          });
          setSouls(data);
          setError(null);
        } catch (err) {
          console.error('Error processing ADN snapshot:', err);
          setError("Erreur lors du traitement des statistiques");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error listening to souls:', error);
        setError("Erreur de synchronisation des statistiques");
        toast.error("Erreur de synchronisation");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const cutoff = useMemo(() => {
    if (period === 'all') return new Date(0);
    const d = new Date();
    const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[period];
    d.setDate(d.getDate() - days);
    return d;
  }, [period]);

  const stats = useMemo(() => {
    const totalSouls = souls.length;
    const activeAssignedSouls = souls.filter(s => s.status === 'active' && s.shepherdId && !s.isUndecided).length;
    const activeUnassignedSouls = souls.filter(s => s.status === 'active' && !s.shepherdId && !s.isUndecided).length;
    const undecidedSouls = souls.filter(s => s.isUndecided).length;
    const newSoulsInPeriod = souls.filter(s => {
      const c = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
      return c >= cutoff;
    }).length;
    const activeAssignedMaleCount = souls.filter(s =>
      s.status === 'active' && s.shepherdId && !s.isUndecided && s.gender === 'male'
    ).length;
    const activeAssignedFemaleCount = souls.filter(s =>
      s.status === 'active' && s.shepherdId && !s.isUndecided && s.gender === 'female'
    ).length;
    return {
      totalSouls,
      activeAssignedSouls,
      activeUnassignedSouls,
      undecidedSouls,
      newSoulsInPeriod,
      activeAssignedMaleCount,
      activeAssignedFemaleCount,
    };
  }, [souls, cutoff]);

  const byFamily = useMemo(() => {
    const map = new Map<string, number>();
    for (const soul of souls) {
      const key = soul.serviceFamilyId || '__none__';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [souls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord ADN</h1>

      <PendingActionsWidget role="adn" />

      {/* Sélecteur de période */}
      <div className="flex gap-2 flex-wrap">
        {(['7d', '30d', '90d', '365d', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? 'bg-[#00665C] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {periodLabel[p]}
          </button>
        ))}
      </div>

      {/* Hero card — métrique principale */}
      <div className="bg-gradient-to-br from-[#00665C] to-[#00887A] rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Total des âmes enregistrées</p>
        <p className="text-5xl font-bold mt-1 tracking-tight">{stats.totalSouls}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm opacity-95">
          <span className="inline-flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            <strong>{stats.activeAssignedSouls}</strong> assignées
          </span>
          <button
            onClick={() => navigate('/souls?filter=unassigned')}
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <Users className="w-4 h-4" />
            <strong>{stats.activeUnassignedSouls}</strong> non assignées
          </button>
          <button
            onClick={() => navigate('/undecided-souls')}
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <AlertTriangle className="w-4 h-4" />
            <strong>{stats.undecidedSouls}</strong> indécises
          </button>
        </div>
      </div>

      {/* Cartes secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={`Nouvelles âmes (${periodLabel[period]})`}
          value={stats.newSoulsInPeriod}
          icon={UserCheck}
          trend={`${stats.totalSouls ? ((stats.newSoulsInPeriod / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="du total"
          iconClassName="text-emerald-600"
          onClick={() => navigate('/souls?filter=this_month')}
          linkLabel="Voir la liste"
        />

        <StatCard
          title="Indécises"
          value={stats.undecidedSouls}
          icon={AlertTriangle}
          trend={`${stats.totalSouls ? ((stats.undecidedSouls / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="du total"
          iconClassName="text-amber-600"
          onClick={() => navigate('/undecided-souls')}
          linkLabel="Voir la liste"
        />

        <StatCard
          title="Hommes assignés"
          value={stats.activeAssignedMaleCount}
          icon={User}
          trend={`${stats.activeAssignedSouls ? ((stats.activeAssignedMaleCount / stats.activeAssignedSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="des assignés"
          iconClassName="text-blue-600"
        />

        <StatCard
          title="Femmes assignées"
          value={stats.activeAssignedFemaleCount}
          icon={User}
          trend={`${stats.activeAssignedSouls ? ((stats.activeAssignedFemaleCount / stats.activeAssignedSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="des assignées"
          iconClassName="text-pink-600"
        />
      </div>

      {/* Répartition par famille de service */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="font-semibold text-[#00665C] mb-3">Répartition par famille de service</h2>
        <div className="space-y-2">
          {families.map(fam => {
            const count = byFamily.get(fam.id) || 0;
            const pct = stats.totalSouls ? Math.round((count / stats.totalSouls) * 100) : 0;
            return (
              <div key={fam.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-32 sm:w-40 truncate" title={fam.name}>{fam.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00665C] rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right tabular-nums">
                  {count} <span className="text-xs text-gray-500">({pct}%)</span>
                </span>
              </div>
            );
          })}
          {byFamily.has('__none__') && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500 w-32 sm:w-40">Sans famille</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${stats.totalSouls ? Math.round(((byFamily.get('__none__') || 0) / stats.totalSouls) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-16 text-right tabular-nums">
                {byFamily.get('__none__')}
                <span className="text-xs text-gray-500"> ({stats.totalSouls ? Math.round(((byFamily.get('__none__') || 0) / stats.totalSouls) * 100) : 0}%)</span>
              </span>
            </div>
          )}
          {families.length === 0 && !byFamily.has('__none__') && (
            <p className="text-sm text-gray-500 italic">Aucune famille de service configurée.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">
          Évolution des âmes enregistrées
        </h2>
        <SoulEvolutionChart />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">
          Activités récentes
        </h2>
        <RecentActivity />
      </div>
    </div>
  );
}