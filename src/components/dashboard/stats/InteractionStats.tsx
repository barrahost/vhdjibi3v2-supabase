import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Phone, Users, MessageSquare, Calendar } from 'lucide-react';
import { StatCard } from './StatCard';

export function InteractionStats() {
  const [stats, setStats] = useState({
    weekly: 0,
    byType: {
      call: 0,
      visit: 0,
      message: 0
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // D'abord récupérer les âmes actives et assignées
        const soulsQuery = query(
          collection(db, 'souls'),
          where('status', '==', 'active'),
          where('shepherdId', '!=', null)
        );
        const soulsSnapshot = await getDocs(soulsQuery);
        const activeSoulIds = soulsSnapshot.docs.map(doc => doc.id);
        
        if (activeSoulIds.length === 0) {
          setStats({
            weekly: 0,
            byType: {
              call: 0,
              visit: 0,
              message: 0
            }
          });
          return;
        }

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        
        const interactionsRef = collection(db, 'interactions');
        const snapshot = await getDocs(interactionsRef);

        const stats = {
          weekly: 0,
          byType: {
            call: 0,
            visit: 0,
            message: 0
          }
        };

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Ne considérer que les interactions avec des âmes actives et assignées
          if (!activeSoulIds.includes(data.soulId)) {
            return;
          }
          
          const date = data.date?.toDate?.() || new Date(data.date);

          // Compter les interactions de la semaine
          if (date >= weekStart) {
            stats.weekly++;
            
            // Compter par type seulement pour cette semaine
            if (data.type && typeof data.type === 'string') {
              stats.byType[data.type as keyof typeof stats.byType]++;
            }
          }
        });

        setStats(stats);
      } catch (error) {
        console.error('Error loading interaction stats for active and assigned souls:', error);
      }
    };

    fetchStats();
  }, []);

  const calculatePercentage = (value: number) => {
    if (stats.weekly === 0) return '0.0';
    return ((value / stats.weekly) * 100).toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Interactions cette semaine"
        value={stats.weekly}
        icon={Calendar}
        trend={`${stats.weekly}`}
        trendLabel="cette semaine"
      />
      
      <StatCard
        title="Appels"
        value={stats.byType.call}
        icon={Phone}
        trend={`${calculatePercentage(stats.byType.call)}%`}
        trendLabel="du total"
      />
      
      <StatCard
        title="Visites"
        value={stats.byType.visit}
        icon={Users}
        trend={`${calculatePercentage(stats.byType.visit)}%`}
        trendLabel="du total"
      />
      
      <StatCard
        title="Messages"
        value={stats.byType.message}
        icon={MessageSquare}
        trend={`${calculatePercentage(stats.byType.message)}%`}
        trendLabel="du total"
      />
    </div>
  );
}