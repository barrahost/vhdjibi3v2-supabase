import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Droplets } from 'lucide-react';
import { BaptismService } from '../../services/baptism.service';
import { percent, type BaptismSummary } from '../../lib/baptism';

/**
 * Carte du tableau de bord du responsable du département Baptême : où en sont les âmes, et un accès direct
 * aux listes à suivre (à baptiser, pas encore nées de nouveau) dans le suivi du baptême.
 */
export function BaptismDashboardCard() {
  const [summary, setSummary] = useState<BaptismSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    BaptismService.fetchSummary()
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((error) => {
        console.error('Error loading baptism summary:', error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tile = 'flex-1 min-w-[130px] rounded-xl border px-3 py-2.5 text-left transition-colors';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#00665C]" /> Suivi du baptême
        </h2>
        <Link to="/bapteme" className="text-xs text-[#00665C] hover:underline flex items-center">
          Toutes les âmes <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {failed ? (
        <p className="text-sm text-gray-400">Impossible de charger le suivi du baptême pour le moment.</p>
      ) : !summary ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link to="/bapteme?vue=a-baptiser" className={`${tile} border-amber-200 bg-amber-50 hover:bg-amber-100`}>
            <p className="text-2xl font-bold text-amber-800 leading-none">{summary.toBaptize}</p>
            <p className="mt-1 text-xs text-amber-800">à baptiser</p>
            <p className="text-[10px] text-amber-700/80">nés de nouveau, pas encore baptisés</p>
          </Link>
          <Link to="/bapteme?vue=pas-nes-de-nouveau" className={`${tile} border-gray-200 bg-gray-50 hover:bg-gray-100`}>
            <p className="text-2xl font-bold text-gray-800 leading-none">{summary.notBornAgain}</p>
            <p className="mt-1 text-xs text-gray-700">pas encore nés de nouveau</p>
          </Link>
          <Link to="/bapteme?vue=baptises" className={`${tile} border-blue-200 bg-blue-50 hover:bg-blue-100`}>
            <p className="text-2xl font-bold text-blue-800 leading-none">{summary.baptized}</p>
            <p className="mt-1 text-xs text-blue-800">baptisés ({percent(summary.baptized, summary.total)})</p>
          </Link>
        </div>
      )}
    </div>
  );
}
