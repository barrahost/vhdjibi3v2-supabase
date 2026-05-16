import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

export function RetentionStats() {
  const [stats, setStats] = useState({
    totalSouls: 0, averageRetention: 0,
    retentionOneMonth: 0, retentionThreeMonths: 0, retentionSixMonths: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRetentionStats = async () => {
      try {
        const { data: soulsRaw, error } = await supabase
          .from('souls')
          .select('id, first_visit_date, shepherd_id')
          .eq('status', 'active')
          .not('shepherd_id', 'is', null);

        if (error) throw error;

        const souls = soulsRaw ?? [];
        if (souls.length === 0) { setLoading(false); return; }

        const now = new Date();
        const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
        const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3);
        const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

        let totalDays = 0, validCount = 0, r1 = 0, r3 = 0, r6 = 0;

        souls.forEach((s: any) => {
          if (!s.first_visit_date) return;
          const firstVisit = new Date(s.first_visit_date);
          if (isNaN(firstVisit.getTime())) return;
          validCount++;
          totalDays += Math.floor((now.getTime() - firstVisit.getTime()) / 86400000);
          if (firstVisit <= oneMonthAgo) r1++;
          if (firstVisit <= threeMonthsAgo) r3++;
          if (firstVisit <= sixMonthsAgo) r6++;
        });

        setStats({
          totalSouls: validCount,
          averageRetention: validCount > 0 ? Math.floor(totalDays / validCount) : 0,
          retentionOneMonth: r1, retentionThreeMonths: r3, retentionSixMonths: r6
        });
      } catch (error) {
        console.error('Error fetching retention stats:', error);
        toast.error('Erreur lors du chargement des statistiques de rétention');
      } finally {
        setLoading(false);
      }
    };
    fetchRetentionStats();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"><div className="h-16" /></div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Ancienneté moyenne" value={stats.averageRetention} icon={Clock} trend={`${stats.averageRetention}`} trendLabel="jours" />
      <StatCard title="Rétention (1 mois)" value={stats.retentionOneMonth} icon={Users} trend={`${stats.totalSouls ? ((stats.retentionOneMonth / stats.totalSouls) * 100).toFixed(1) : '0'}%`} trendLabel="des âmes" />
      <StatCard title="Rétention (3 mois)" value={stats.retentionThreeMonths} icon={Users} trend={`${stats.totalSouls ? ((stats.retentionThreeMonths / stats.totalSouls) * 100).toFixed(1) : '0'}%`} trendLabel="des âmes" iconClassName="text-blue-600" />
      <StatCard title="Rétention (6 mois)" value={stats.retentionSixMonths} icon={Users} trend={`${stats.totalSouls ? ((stats.retentionSixMonths / stats.totalSouls) * 100).toFixed(1) : '0'}%`} trendLabel="des âmes" iconClassName="text-purple-600" />
    </div>
  );
}
