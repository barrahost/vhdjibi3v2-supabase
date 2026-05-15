import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../dashboard/stats/StatCard';
import { Users, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendanceStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAttendances: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        // Récupérer l'ID du berger depuis la collection users
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('status', '==', 'active')
        );
        const userDoc = await getDocs(userQuery);
        
        if (userDoc.empty) {
          toast.error('Utilisateur non trouvé');
          return;
        }

        // Vérifier si l'utilisateur a un profil berger actif
        const userData = userDoc.docs[0].data();
        const hasShepherdProfile = userData.businessProfiles?.some(
          (profile: any) => profile.type === 'shepherd' && profile.isActive
        ) || userData.role === 'shepherd' || userData.role === 'intern';

        if (!hasShepherdProfile) {
          toast.error('Accès non autorisé - profil berger requis');
          return;
        }

        const shepherdId = userDoc.docs[0].id;

        // Récupérer toutes les présences
        const attendancesQuery = query(
          collection(db, 'attendances'),
          where('shepherdId', '==', shepherdId)
        );
        const attendancesSnapshot = await getDocs(attendancesQuery);
        
        const totalAttendances = attendancesSnapshot.size;
        const presentCount = attendancesSnapshot.docs.filter(
          doc => doc.data().present
        ).length;
        const absentCount = totalAttendances - presentCount;
        const attendanceRate = totalAttendances > 0
          ? (presentCount / totalAttendances) * 100
          : 0;

        setStats({
          totalAttendances,
          presentCount,
          absentCount,
          attendanceRate
        });
      } catch (error) {
        console.error('Error loading attendance stats:', error);
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total des présences"
        value={stats.totalAttendances}
        icon={Users}
        trend={`${stats.totalAttendances}`}
        trendLabel="enregistrements"
      />
      
      <StatCard
        title="Présents"
        value={stats.presentCount}
        icon={UserCheck}
        trend={`${stats.attendanceRate.toFixed(1)}%`}
        trendLabel="de présence"
        iconClassName="text-green-600"
      />
      
      <StatCard
        title="Absents"
        value={stats.absentCount}
        icon={UserX}
        trend={`${(100 - stats.attendanceRate).toFixed(1)}%`}
        trendLabel="d'absence"
        iconClassName="text-red-600"
      />
    </div>
  );
}