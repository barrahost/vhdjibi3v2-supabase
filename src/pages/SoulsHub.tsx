import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS, ROLES } from '../constants/roles';
import SoulManagement from './SoulManagement';
import UndecidedSouls from './UndecidedSouls';
import EvangelizedSoulManagement from './EvangelizedSoulManagement';

type SoulTab = 'all' | 'undecided' | 'evangelized';

const TAB_LABELS: Record<SoulTab, string> = {
  all: 'Toutes',
  undecided: 'Indécises',
  evangelized: 'Évangélisées',
};

interface SoulsHubProps {
  /** Onglet à ouvrir par défaut si l'URL n'en précise pas (ex: routes historiques /ames-indecises) */
  defaultTab?: SoulTab;
}

export default function SoulsHub({ defaultTab = 'all' }: SoulsHubProps = {}) {
  const { hasPermission } = usePermissions();
  const { activeRole, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Le profil ADN n'a pas d'usage pour la liste "Évangélisées" (gestion en masse,
  // répartition...) — son seul besoin (rechercher une âme évangélisée en attente)
  // passe déjà par la recherche du bouton "Ajouter", pas par cet onglet.
  const currentRole = activeRole || userRole;
  const availableTabs = useMemo(() => {
    const tabs: SoulTab[] = [];
    if (hasPermission(PERMISSIONS.MANAGE_SOULS)) tabs.push('all', 'undecided');
    if (hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && currentRole !== ROLES.ADN) tabs.push('evangelized');
    return tabs;
  }, [hasPermission, currentRole]);

  const urlTab = searchParams.get('tab') as SoulTab | null;
  const resolveInitialTab = (): SoulTab => {
    if (urlTab && availableTabs.includes(urlTab)) return urlTab;
    if (availableTabs.includes(defaultTab)) return defaultTab;
    return availableTabs[0] ?? 'all';
  };
  const [tab, setTab] = useState<SoulTab>(resolveInitialTab());

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(resolveInitialTab());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTabs]);

  const [counts, setCounts] = useState<Record<SoulTab, number>>({ all: 0, undecided: 0, evangelized: 0 });

  const changeTab = (next: SoulTab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const loadCounts = async () => {
      const [allRes, undecidedRes, evangelizedRes] = await Promise.all([
        supabase.from('souls').select('id', { count: 'exact', head: true })
          .eq('church_id', getChurchId()).eq('is_undecided', false)
          .or('status.eq.active,status.is.null'),
        supabase.from('souls').select('id', { count: 'exact', head: true })
          .eq('church_id', getChurchId()).eq('is_undecided', true).eq('status', 'active'),
        supabase.from('evangelized_souls').select('id', { count: 'exact', head: true })
          .eq('church_id', getChurchId()).eq('status', 'active'),
      ]);
      setCounts({
        all: allRes.count ?? 0,
        undecided: undecidedRes.count ?? 0,
        evangelized: evangelizedRes.count ?? 0,
      });
    };
    loadCounts();

    const channel = supabase
      .channel('souls-hub-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'souls' }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evangelized_souls' }, loadCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Un seul onglet accessible (ex: profil Évangéliste) — on affiche la page telle quelle,
  // sans barre d'onglets, pour ne rien changer à son expérience actuelle.
  if (availableTabs.length <= 1) {
    const only = availableTabs[0] ?? defaultTab;
    if (only === 'undecided') return <UndecidedSouls />;
    if (only === 'evangelized') return <EvangelizedSoulManagement />;
    return <SoulManagement />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Âmes</h1>
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          {availableTabs.map((key) => (
            <button
              key={key}
              onClick={() => changeTab(key)}
              className={`flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-brand-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {TAB_LABELS[key]}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-white text-gray-500'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'all' && <SoulManagement embedded />}
      {tab === 'undecided' && <UndecidedSouls embedded />}
      {tab === 'evangelized' && <EvangelizedSoulManagement embedded />}
    </div>
  );
}
