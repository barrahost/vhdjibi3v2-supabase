import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart2, Heart, TrendingUp, MessageCircle, Megaphone, Download } from 'lucide-react';
import { GeneralStats } from '../components/dashboard/stats/GeneralStats';
import { RetentionStats } from '../components/dashboard/stats/RetentionStats';
import { InteractionStats } from '../components/dashboard/stats/InteractionStats';
import { SpiritualStats } from '../components/dashboard/stats/SpiritualStats';
import { SoulEvolutionChart } from '../components/dashboard/stats/SoulEvolutionChart';
import { EvangelizationStats } from '../components/dashboard/stats/EvangelizationStats';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import toast from 'react-hot-toast';

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
  const { hasPermission } = usePermissions();
  const [exporting, setExporting] = useState(false);

  // Export CSV : recap des chiffres cles (vue d'ensemble), calcule a la volee.
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const churchId = getChurchId();
      const [{ data: soulsData, error: soulsErr }, { data: evangData, error: evangErr }] = await Promise.all([
        supabase.from('souls').select('id, gender, shepherd_id, is_undecided, service_family_id, status').eq('church_id', churchId),
        supabase.from('evangelized_souls').select('id, imported_to_soul_id').eq('church_id', churchId),
      ]);
      if (soulsErr) throw soulsErr;
      if (evangErr) throw evangErr;

      const souls = soulsData ?? [];
      const active = souls.filter((s: any) => s.status === 'active');
      const evang = evangData ?? [];
      const recues = evang.filter((s: any) => !!s.imported_to_soul_id).length;
      const totalEvang = evang.length;

      const rows: [string, string | number][] = [
        ['Total ames enregistrees', souls.length],
        ['Ames actives', active.length],
        ['Ames inactives', souls.length - active.length],
        ['Ames indecises (actives)', active.filter((s: any) => s.is_undecided).length],
        ['Hommes (actives)', active.filter((s: any) => s.gender === 'male').length],
        ['Femmes (actives)', active.filter((s: any) => s.gender === 'female').length],
        ['Sans berger (actives)', active.filter((s: any) => !s.shepherd_id).length],
        ['Sans famille de service (actives, decidees)', active.filter((s: any) => !s.service_family_id && !s.is_undecided).length],
        ['Ames evangelisees (total)', totalEvang],
        ['Evangelisees recues dans l\'eglise', recues],
        ['Evangelisees en attente', totalEvang - recues],
        ['Taux de conversion (recues / total evangelisees)', totalEvang > 0 ? `${Math.round((recues / totalEvang) * 100)}%` : '0%'],
      ];

      const today = new Date().toISOString().split('T')[0];
      const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
      const lines = [
        `Statistiques - ${churchId || 'eglise'} - ${today}`,
        '',
        'Indicateur;Valeur',
        ...rows.map(([k, v]) => `${escape(k)};${escape(v)}`),
      ];
      // BOM pour que les accents s'affichent correctement dans Excel
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistiques-${churchId || 'eglise'}-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export CSV genere');
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#00665C]" />
            Statistiques
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue consolidée de la santé et de la croissance de la congrégation
          </p>
        </div>
        {hasPermission(PERMISSIONS.EXPORT_DATA) && (
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="self-start inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] rounded-md hover:bg-[#00665C]/10 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export en cours...' : 'Exporter (CSV)'}
          </button>
        )}
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
