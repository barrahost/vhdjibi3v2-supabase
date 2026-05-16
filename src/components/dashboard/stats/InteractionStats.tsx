import { useEffect, useState } from 'react';
import { Phone, Users, MessageSquare, Calendar } from 'lucide-react';
import { StatCard } from './StatCard';
import { supabase } from '../../../lib/supabase';

export function InteractionStats() {
  const [stats, setStats] = useState({
    weekly: 0,
    byType: { call: 0, visit: 0, message: 0 }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        const { data: interactions, error } = await supabase
          .from('interactions')
          .select('id, type, date, soul_id')
          .gte('date', weekStart.toISOString());

        if (error) throw error;

        const weekly = (interactions ?? []).length;
        const byType = { call: 0, visit: 0, message: 0 };
        (interactions ?? []).forEach((r: any) => {
          if (r.type in byType) byType[r.type as keyof typeof byType]++;
        });

        setStats({ weekly, byType });
      } catch (error) {
        console.error('Error loading interaction stats:', error);
      }
    };
    fetchStats();
  }, []);

  const pct = (value: number) => stats.weekly === 0 ? '0.0' : ((value / stats.weekly) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard title="Interactions cette semaine" value={stats.weekly} icon={Calendar} trend={`${stats.weekly}`} trendLabel="cette semaine" />
      <StatCard title="Appels" value={stats.byType.call} icon={Phone} trend={`${pct(stats.byType.call)}%`} trendLabel="du total" />
      <StatCard title="Visites" value={stats.byType.visit} icon={Users} trend={`${pct(stats.byType.visit)}%`} trendLabel="du total" />
      <StatCard title="Messages" value={stats.byType.message} icon={MessageSquare} trend={`${pct(stats.byType.message)}%`} trendLabel="du total" />
    </div>
  );
}
