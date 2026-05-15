import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { StatCard } from './StatCard';
import { Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export function RetentionStats() {
  const [stats, setStats] = useState({
    totalSouls: 0,
    averageRetention: 0,
    retentionOneMonth: 0,
    retentionThreeMonths: 0,
    retentionSixMonths: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRetentionStats = async () => {
      try {
        setLoading(true);
        const soulsQuery = query(
          collection(db, 'souls'),
          where('status', '==', 'active'),
          where('shepherdId', '!=', null)
        );
        const snapshot = await getDocs(soulsQuery);
        const totalSouls = snapshot.size;
        
        if (totalSouls === 0) {
          setStats({
            totalSouls: 0,
            averageRetention: 0,
            retentionOneMonth: 0,
            retentionThreeMonths: 0,
            retentionSixMonths: 0
          });
          return;
        }

        const now = new Date();
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        let totalDays = 0;
        let validSoulsCount = 0;
        let retentionOneMonth = 0;
        let retentionThreeMonths = 0;
        let retentionSixMonths = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.firstVisitDate) return;

          let firstVisit: Date;
          
          // Gestion des différents formats de date possibles
          if (data.firstVisitDate instanceof Timestamp) {
            firstVisit = data.firstVisitDate.toDate();
          } else if (data.firstVisitDate instanceof Date) {
            firstVisit = data.firstVisitDate;
          } else if (typeof data.firstVisitDate === 'string') {
            firstVisit = new Date(data.firstVisitDate);
          } else {
            return; // Skip if date format is invalid
          }

          // Vérifier si la date est valide
          if (isNaN(firstVisit.getTime())) return;

          validSoulsCount++;
          const daysSinceFirstVisit = Math.floor((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
          totalDays += daysSinceFirstVisit;

          if (firstVisit <= oneMonthAgo) retentionOneMonth++;
          if (firstVisit <= threeMonthsAgo) retentionThreeMonths++;
          if (firstVisit <= sixMonthsAgo) retentionSixMonths++;
        });

        const averageRetention = validSoulsCount > 0 ? Math.floor(totalDays / validSoulsCount) : 0;

        setStats({
          totalSouls: validSoulsCount,
          averageRetention,
          retentionOneMonth,
          retentionThreeMonths,
          retentionSixMonths
        });
      } catch (error) {
        console.error('Error fetching retention stats for active and assigned souls:', error);
        toast.error('Erreur lors du chargement des statistiques de rétention des âmes actives et assignées');
      } finally {
        setLoading(false);
      }
    };

    fetchRetentionStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Ancienneté moyenne"
        value={stats.averageRetention}
        icon={Clock}
        trend={`${stats.averageRetention}`}
        trendLabel="jours"
      />
      <StatCard
        title="Rétention (1 mois)"
        value={stats.retentionOneMonth}
        icon={Users}
        trend={`${stats.totalSouls ? ((stats.retentionOneMonth / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
        trendLabel="des âmes"
      />
      <StatCard
        title="Rétention (3 mois)"
        value={stats.retentionThreeMonths}
        icon={Users}
        trend={`${stats.totalSouls ? ((stats.retentionThreeMonths / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
        trendLabel="des âmes"
        iconClassName="text-blue-600"
      />
      <StatCard
        title="Rétention (6 mois)"
        value={stats.retentionSixMonths}
        icon={Users}
        trend={`${stats.totalSouls ? ((stats.retentionSixMonths / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
        trendLabel="des âmes"
        iconClassName="text-purple-600"
      />
    </div>
  );
}