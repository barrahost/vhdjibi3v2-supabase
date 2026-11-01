import { BarChart2 } from 'lucide-react';
import InteractionStatsDashboard from '../components/stats/InteractionStatsDashboard';
import type { StatsScope } from '../services/interactionStats.service';

const TITLES: Record<Exclude<StatsScope, 'church'>, { title: string; description: string }> = {
  family: {
    title: 'Statistiques de ma famille',
    description: 'Appels, visites et messages des bergers de votre famille, et les âmes à ne pas oublier.',
  },
  shepherd: {
    title: 'Mes statistiques',
    description: 'Vos appels, visites et messages, et les âmes à rappeler.',
  },
};

/** Statistiques des interactions pour un responsable de famille ou un berger. */
export default function InteractionStatsPage({ scope }: { scope: Exclude<StatsScope, 'church'> }) {
  const { title, description } = TITLES[scope];
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#00665C]" />
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <InteractionStatsDashboard scope={scope} />
    </div>
  );
}
