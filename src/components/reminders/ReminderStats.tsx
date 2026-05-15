import { useEffect, useState } from 'react';
import { Soul, Interaction } from '../../types/database.types';
import { StatCard } from '../dashboard/stats/StatCard';
import { Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReminderStatsProps {
  souls: Soul[];
  interactions: Interaction[];
}

export function ReminderStats({ souls, interactions }: ReminderStatsProps) {
  const [stats, setStats] = useState({
    totalSouls: 0,
    averageDays: 0,
    needsInteraction: 0,
    upToDate: 0
  });

  useEffect(() => {
    const today = new Date();
    let totalDays = 0;
    let needsInteraction = 0;
    let upToDate = 0;

    souls.forEach(soul => {
      const soulInteractions = interactions.filter(i => i.soulId === soul.id);
      const lastInteraction = soulInteractions.length > 0
        ? new Date(Math.max(...soulInteractions.map(i => i.date.getTime())))
        : null;
      
      const daysWithoutInteraction = lastInteraction
        ? Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysWithoutInteraction >= 5) {
        needsInteraction++;
      } else {
        upToDate++;
      }

      if (lastInteraction) {
        totalDays += daysWithoutInteraction;
      }
    });

    setStats({
      totalSouls: souls.length,
      averageDays: souls.length > 0 ? Math.round(totalDays / souls.length) : 0,
      needsInteraction,
      upToDate
    });
  }, [souls, interactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total des âmes"
        value={stats.totalSouls}
        icon={Users}
        trend={`${stats.totalSouls}`}
        trendLabel="âmes assignées"
      />
      <StatCard
        title="Moyenne des jours"
        value={stats.averageDays}
        icon={Clock}
        trend={`${stats.averageDays}`}
        trendLabel="jours sans interaction"
      />
      <StatCard
        title="Nécessitent attention"
        value={stats.needsInteraction}
        icon={AlertTriangle}
        trend={`${((stats.needsInteraction / stats.totalSouls) * 100).toFixed(1)}%`}
        trendLabel="du total"
        iconClassName="text-yellow-500"
      />
      <StatCard
        title="À jour"
        value={stats.upToDate}
        icon={CheckCircle}
        trend={`${((stats.upToDate / stats.totalSouls) * 100).toFixed(1)}%`}
        trendLabel="du total"
        iconClassName="text-green-500"
      />
    </div>
  );
}