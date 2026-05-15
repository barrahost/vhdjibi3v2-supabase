import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart2, Heart, TrendingUp, MessageCircle, Megaphone } from 'lucide-react';
import { GeneralStats } from '../components/dashboard/stats/GeneralStats';
import { RetentionStats } from '../components/dashboard/stats/RetentionStats';
import { InteractionStats } from '../components/dashboard/stats/InteractionStats';
import { SpiritualStats } from '../components/dashboard/stats/SpiritualStats';
import { SoulEvolutionChart } from '../components/dashboard/stats/SoulEvolutionChart';
import { EvangelizationStats } from '../components/dashboard/stats/EvangelizationStats';

type TabId = 'overview' | 'pastoral' | 'spiritual' | 'evangelization';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: <BarChart2 className="w-4 h-4" />,
    description: 'Chiffres clés et évolution de la congrégation'
  },
  {
    id: 'pastoral',
    label: 'Suivi pastoral',
    icon: <Heart className="w-4 h-4" />,
    description: 'Rétention, interactions et engagement des âmes'
  },
  {
    id: 'spiritual',
    label: 'Progression spirituelle',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Baptêmes, académie, départements'
  },
  {
    id: 'evangelization',
    label: 'Évangélisation',
    icon: <Megaphone className="w-4 h-4" />,
    description: 'Âmes évangélisées, reçues et taux de conversion'
  },
];

export default function StatistiquesAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get('tab') as TabId) || 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl);

  useEffect(() => {
    const tab = (searchParams.get('tab') as TabId) || 'overview';
    if (TABS.find(t => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#00665C]" />
          Statistiques
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue consolidée de la santé et de la croissance de la congrégation
        </p>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-[#00665C] text-[#00665C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Description de l'onglet actif */}
      <div className="bg-[#00665C]/5 border border-[#00665C]/20 rounded-md px-4 py-2 flex items-center gap-2 text-sm text-[#00665C]">
        {active.icon}
        <span>{active.description}</span>
      </div>

      {/* Contenu */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <>
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-4">Chiffres clés</h2>
              <GeneralStats />
            </section>
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-4">Évolution des âmes</h2>
              <SoulEvolutionChart />
            </section>
          </>
        )}

        {activeTab === 'pastoral' && (
          <>
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-4">Interactions cette semaine</h2>
              <InteractionStats />
            </section>
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-4">Rétention & ancienneté</h2>
              <RetentionStats />
            </section>
          </>
        )}

        {activeTab === 'spiritual' && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Progression spirituelle</h2>
            <SpiritualStats />
          </section>
        )}

        {activeTab === 'evangelization' && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Évangélisation</h2>
            <EvangelizationStats />
          </section>
        )}
      </div>
    </div>
  );
}
