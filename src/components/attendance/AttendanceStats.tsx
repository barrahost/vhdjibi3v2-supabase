import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../dashboard/stats/StatCard';
import { Users, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

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
      try {
        // Get current user from localStorage
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) {
          toast.error('Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        // Récupérer le profil berger
        const { data: userRows, error: userErr } = await supabase
          .from('users')
          .select('id, role')
          .eq('church_id', getChurchId())
          .eq('id', currentUserId)
          .limit(1);

        if (userErr) throw userErr;
        if (!userRows || userRows.length === 0) {
          toast.error('Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        const shepherdId = userRows[0].id;
        const userRole = userRows[0].role;
        const isAdminUser = userRole === 'admin' || userRole === 'super_admin';

        // Récupérer toutes les présences (admin = toutes, berger = les siennes)
        const statsQuery = supabase
          .from('attendances')
          .select('id, present')
          .eq('church_id', getChurchId());
        if (!isAdminUser) statsQuery.eq('shepherd_id', shepherdId);

        const { data: attendancesRows, error: attErr } = await statsQuery;

        if (attErr) throw attErr;

        const totalAttendances = (attendancesRows ?? []).length;
        const presentCount = (attendancesRows ?? []).filter((r: any) => r.present).length;
        const absentCount = totalAttendances - presentCount;
        const attendanceRate = totalAttendances > 0
          ? (presentCount / totalAttendances) * 100
          : 0;

        setStats({ totalAttendances, presentCount, absentCount, attendanceRate });
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
