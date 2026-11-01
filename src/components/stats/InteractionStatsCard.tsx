import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FORGOTTEN_AFTER_DAYS, computeInteractionStats, periodFor, previousPeriod, trend, type InteractionStatsResult } from '../../lib/interactionStats';
import { loadInteractionStatsData } from '../../services/interactionStats.service';

/** Résumé du mois pour le tableau de bord du berger, avec un lien vers ses statistiques complètes. */
export default function InteractionStatsCard() {
  const { user } = useAuth();
  const keys = useMemo(() => [user?.id, user?.uid].filter(Boolean) as string[], [user?.id, user?.uid]);
  const [stats, setStats] = useState<InteractionStatsResult | null>(null);

  useEffect(() => {
    if (!keys.length) return;
    let cancelled = false;
    const now = new Date();
    const period = periodFor('month', now);
    // Mois précédent pour comparer, et au moins 31 jours pour repérer les âmes sans contact
    const since = new Date(Math.min(previousPeriod(period).from.getTime(), now.getTime() - 31 * 86_400_000));
    loadInteractionStatsData('shepherd', keys, since)
      .then((data) => !cancelled && setStats(computeInteractionStats({ ...data, period, now })))
      .catch((e) => console.error('Résumé des interactions :', e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')]);

  if (!stats || !stats.kpis.soulsFollowed) return null;
  const { kpis } = stats;
  const evolution = trend(kpis.total, kpis.previousTotal);
  const coverage = Math.round((kpis.soulsContacted / kpis.soulsFollowed) * 100);

  return (
    <Link
      to="/mes-statistiques"
      data-testid="interaction-stats-card"
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:border-brand-200 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-sm sm:text-base font-semibold text-brand-700 flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4" />
          Mon suivi ce mois-ci
        </h2>
        <span className="text-xs text-brand-700 font-medium inline-flex items-center">
          Mes statistiques <ChevronRight className="w-4 h-4" />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xl font-bold text-gray-900">{kpis.total}</p>
          <p className="text-[11px] text-gray-500">interactions</p>
          {evolution !== null && (
            <p className={`text-[11px] font-medium ${evolution >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {evolution > 0 ? '+' : ''}
              {evolution} % vs mois préc.
            </p>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{coverage} %</p>
          <p className="text-[11px] text-gray-500">
            âmes contactées ({kpis.soulsContacted}/{kpis.soulsFollowed})
          </p>
        </div>
        <div>
          <p className={`text-xl font-bold ${stats.forgotten.length ? 'text-amber-600' : 'text-emerald-600'}`}>{stats.forgotten.length}</p>
          <p className="text-[11px] text-gray-500 inline-flex items-center gap-0.5">
            {stats.forgotten.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
            sans contact {FORGOTTEN_AFTER_DAYS} j+
          </p>
        </div>
      </div>
    </Link>
  );
}
