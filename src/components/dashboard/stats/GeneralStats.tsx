import { useEffect, useState } from 'react';
import { Soul } from '../../../types/database.types';
import { Users, UserCheck, User, AlertTriangle } from 'lucide-react';
import { StatCard } from './StatCard';
import { isShepherdUser } from '../../../utils/roleHelpers';
import toast from 'react-hot-toast';
import { SoulEvolutionChart } from './SoulEvolutionChart';
import { supabase } from '../../../lib/supabase';

export function GeneralStats() {
  const [stats, setStats] = useState({
    totalSouls: 0, assignedActiveSouls: 0, undecidedSouls: 0,
    unassignedDecidedActiveSouls: 0, totalShepherds: 0,
    assignedActiveMaleCount: 0, assignedActiveFemaleCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ data: soulsRaw, error: soulsErr }, { data: usersRaw, error: usersErr }] = await Promise.all([
          supabase.from('souls').select('id, shepherd_id, is_undecided, status, gender'),
          supabase.from('users').select('id, role, status').eq('status', 'active'),
        ]);

        if (soulsErr) throw soulsErr;
        if (usersErr) throw usersErr;

        const souls = soulsRaw ?? [];
        const activeShepherds = (usersRaw ?? []).filter((u: any) => isShepherdUser(u));

        const totalSouls = souls.length;
        const assignedActiveSouls = souls.filter((s: any) => s.shepherd_id && s.status === 'active').length;
        const undecidedSouls = souls.filter((s: any) => s.is_undecided).length;
        const unassignedDecidedActiveSouls = souls.filter((s: any) => !s.shepherd_id && !s.is_undecided && s.status === 'active').length;
        const assignedActiveMaleCount = souls.filter((s: any) => s.shepherd_id && s.status === 'active' && s.gender === 'male').length;
        const assignedActiveFemaleCount = souls.filter((s: any) => s.shepherd_id && s.status === 'active' && s.gender === 'female').length;

        setStats({
          totalSouls, assignedActiveSouls, undecidedSouls,
          unassignedDecidedActiveSouls, totalShepherds: activeShepherds.length,
          assignedActiveMaleCount, assignedActiveFemaleCount,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"><div className="h-16" /></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Âmes totales enregistrées" value={stats.totalSouls} icon={Users} trend={`${stats.totalSouls}`} trendLabel="âmes au total" />
        <StatCard title="Âmes assignées et actives" value={stats.assignedActiveSouls} icon={UserCheck} trend={`${stats.totalSouls ? ((stats.assignedActiveSouls / stats.totalSouls) * 100).toFixed(1) : '0'}%`} trendLabel="du total" iconClassName="text-green-600" />
        <StatCard title="Âmes indécises (Non assignées)" value={stats.undecidedSouls} icon={AlertTriangle} trend={`${stats.totalSouls ? ((stats.undecidedSouls / stats.totalSouls) * 100).toFixed(1) : '0'}%`} trendLabel="du total" iconClassName="text-amber-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Âmes non assignées (actives)" value={stats.unassignedDecidedActiveSouls} icon={User} trend={`${stats.totalSouls ? ((stats.unassignedDecidedActiveSouls / stats.totalSouls) * 100).toFixed(1) : '0'}%`} trendLabel="du total" iconClassName="text-orange-600" />
        <StatCard title="Total des berger(e)s" value={stats.totalShepherds} icon={UserCheck} trend={`${stats.totalShepherds}`} trendLabel="berger(e)s actif(ve)s" />
        <StatCard title="Hommes (Assignés actifs)" value={stats.assignedActiveMaleCount} icon={User} trend={`${stats.assignedActiveSouls ? ((stats.assignedActiveMaleCount / stats.assignedActiveSouls) * 100).toFixed(1) : '0'}%`} trendLabel="des assignés actifs" iconClassName="text-blue-600" />
        <StatCard title="Femmes (Assignées actives)" value={stats.assignedActiveFemaleCount} icon={User} trend={`${stats.assignedActiveSouls ? ((stats.assignedActiveFemaleCount / stats.assignedActiveSouls) * 100).toFixed(1) : '0'}%`} trendLabel="des assignées actives" iconClassName="text-pink-600" />
      </div>
      <div><SoulEvolutionChart /></div>
    </div>
  );
}
