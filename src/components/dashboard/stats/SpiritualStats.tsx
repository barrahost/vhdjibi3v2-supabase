import { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { Heart, BookOpen, Droplets, Users2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

export function SpiritualStats() {
  const [stats, setStats] = useState({
    totalSouls: 0, bornAgain: 0, baptized: 0, academy: 0, lifeBearers: 0, serving: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: souls, error } = await supabase
          .from('souls')
          .select('id, spiritual_profile, shepherd_id')
          .eq('status', 'active')
          .not('shepherd_id', 'is', null);

        if (error) throw error;

        const rows = souls ?? [];
        const totalSouls = rows.length;

        // spiritual_profile est un objet JSONB avec les clés camelCase
        const bornAgain    = rows.filter((s: any) => s.spiritual_profile?.isBornAgain).length;
        const baptized     = rows.filter((s: any) => s.spiritual_profile?.isBaptized).length;
        const academy      = rows.filter((s: any) => s.spiritual_profile?.isEnrolledInAcademy).length;
        const lifeBearers  = rows.filter((s: any) => s.spiritual_profile?.isEnrolledInLifeBearers).length;
        const serving      = rows.filter((s: any) =>
          Array.isArray(s.spiritual_profile?.departments) && s.spiritual_profile.departments.length > 0
        ).length;

        setStats({ totalSouls, bornAgain, baptized, academy, lifeBearers, serving });
      } catch (error) {
        console.error('Error fetching spiritual stats:', error);
        toast.error('Erreur lors du chargement des statistiques spirituelles');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const pct = (value: number) =>
    stats.totalSouls === 0 ? '0' : ((value / stats.totalSouls) * 100).toFixed(1);

  if (loading) return (
    <div className="flex items-center justify-center h-24">
      <div className="text-gray-500">Chargement des statistiques...</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <StatCard title="Nés de nouveau"  value={stats.bornAgain}   icon={Heart}     trend={`${pct(stats.bornAgain)}%`}   trendLabel="des âmes" iconClassName="text-red-600" />
      <StatCard title="Baptisés"         value={stats.baptized}    icon={Droplets}  trend={`${pct(stats.baptized)}%`}    trendLabel="des âmes" iconClassName="text-blue-600" />
      <StatCard title="Académie VDH"     value={stats.academy}     icon={BookOpen}  trend={`${pct(stats.academy)}%`}     trendLabel="des âmes" iconClassName="text-amber-600" />
      <StatCard title="École PDV"        value={stats.lifeBearers} icon={Users2}    trend={`${pct(stats.lifeBearers)}%`} trendLabel="des âmes" iconClassName="text-emerald-600" />
      <StatCard title="En service"       value={stats.serving}     icon={Briefcase} trend={`${pct(stats.serving)}%`}     trendLabel="des âmes" iconClassName="text-purple-600" />
    </div>
  );
}
