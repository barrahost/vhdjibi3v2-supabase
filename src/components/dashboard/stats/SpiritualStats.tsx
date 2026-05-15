import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Soul } from '../../../types/database.types';
import { StatCard } from './StatCard';
import { Heart, BookOpen, Droplets, Users2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export function SpiritualStats() {
  const [stats, setStats] = useState({
    totalSouls: 0,
    bornAgain: 0,
    baptized: 0,
    academy: 0,
    lifeBearers: 0,
    serving: 0,
    servingByDepartment: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Écouter les changements sur les âmes en temps réel
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'souls'),
          where('status', '==', 'active'),
          where('shepherdId', '!=', null)
        ),
        (snapshot) => {
          const souls = snapshot.docs.map(doc => ({
            ...doc.data()
          })) as Soul[];

          const totalSouls = souls.length;
          const bornAgain = souls.filter(soul => soul?.spiritualProfile?.isBornAgain).length;
          const baptized = souls.filter(soul => soul?.spiritualProfile?.isBaptized).length;
          const academy = souls.filter(soul => soul?.spiritualProfile?.isEnrolledInAcademy).length;
          const lifeBearers = souls.filter(soul => soul?.spiritualProfile?.isEnrolledInLifeBearers).length;
          
          // Compter les âmes en service
          const servingByDepartment: Record<string, number> = {};
          let totalServing = 0;

          souls.forEach(soul => {
            if (soul?.spiritualProfile?.departments?.length > 0) {
              totalServing++;
              soul.spiritualProfile.departments.forEach(dept => {
                servingByDepartment[dept.name] = (servingByDepartment[dept.name] || 0) + 1;
              });
            }
          });

          setStats({
            totalSouls,
            bornAgain,
            baptized,
            academy,
            lifeBearers,
            serving: totalServing,
            servingByDepartment
          });

          setLoading(false);
        },
        (error) => {
          console.error('Error fetching spiritual stats for active and assigned souls:', error);
          toast.error('Erreur lors du chargement des statistiques spirituelles des âmes actives et assignées');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up spiritual stats listener for active and assigned souls:', error);
      toast.error('Erreur lors de l\'initialisation des statistiques des âmes actives et assignées');
      setLoading(false);
    }
  }, []);

  const calculatePercentage = (value: number) => {
    if (stats.totalSouls === 0) return '0';
    return ((value / stats.totalSouls) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="text-gray-500">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <StatCard
        title="Nés de nouveau"
        value={stats.bornAgain}
        icon={Heart}
        trend={`${calculatePercentage(stats.bornAgain)}%`}
        trendLabel="des âmes"
        iconClassName="text-red-600"
      />
      
      <StatCard
        title="Baptisés"
        value={stats.baptized}
        icon={Droplets}
        trend={`${calculatePercentage(stats.baptized)}%`}
        trendLabel="des âmes"
        iconClassName="text-blue-600"
      />
      
      <StatCard
        title="Académie VDH"
        value={stats.academy}
        icon={BookOpen}
        trend={`${calculatePercentage(stats.academy)}%`}
        trendLabel="des âmes"
        iconClassName="text-amber-600"
      />
      
      <StatCard
        title="École PDV"
        value={stats.lifeBearers}
        icon={Users2}
        trend={`${calculatePercentage(stats.lifeBearers)}%`}
        trendLabel="des âmes"
        iconClassName="text-emerald-600"
      />
      
      <StatCard
        title="En service"
        value={stats.serving}
        icon={Briefcase}
        trend={`${calculatePercentage(stats.serving)}%`}
        trendLabel="des âmes"
        iconClassName="text-purple-600"
        details={Object.entries(stats.servingByDepartment).map(([dept, count]) => ({
          label: dept,
          value: count
        }))}
      />
    </div>
  );
}