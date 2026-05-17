import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search } from 'lucide-react';
import { AttendanceTableHeader } from './AttendanceTableHeader';
import { AttendanceTableRow } from './AttendanceTableRow';
import EditAttendanceModal from './EditAttendanceModal';
import { AttendanceRecord, Soul } from '../../types/attendance.types';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function AttendanceList() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [souls, setSouls] = useState<Record<string, Soul>>({});
  const [loading, setLoading] = useState(true);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    field: 'date' | 'fullName' | 'present';
    direction: 'asc' | 'desc';
  }>({
    field: 'date',
    direction: 'desc'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user from localStorage
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) {
          toast.error('Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        // Récupérer le profil berger depuis users
        const { data: userRows, error: userErr } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', currentUserId)
          .limit(1);

        if (userErr) throw userErr;
        if (!userRows || userRows.length === 0) {
          toast.error('Berger non trouvé');
          setLoading(false);
          return;
        }

        const shepherdId = userRows[0].id;
        const userRole = userRows[0].role;
        const isAdminUser = userRole === 'admin' || userRole === 'super_admin';

        // L'admin voit toutes les présences ; un berger ne voit que les siennes
        const attQuery = supabase
          .from('attendances')
          .select('*')
          .order('date', { ascending: false });
        if (!isAdminUser) attQuery.eq('shepherd_id', shepherdId);

        const { data: attendancesRows, error: attErr } = await attQuery;

        if (attErr) throw attErr;

        const attendancesData: AttendanceRecord[] = (attendancesRows ?? []).map((doc: any) => ({
          id: doc.id,
          soulId: doc.soul_id,
          shepherdId: doc.shepherd_id,
          date: doc.date ? new Date(doc.date) : new Date(),
          present: doc.present,
          notes: doc.notes,
        })) as AttendanceRecord[];

        // Récupérer les informations des âmes
        const soulsData: Record<string, Soul> = {};
        const soulIds = [...new Set(attendancesData.map(a => a.soulId).filter(Boolean))];
        if (soulIds.length > 0) {
          const { data: soulsRows } = await supabase
            .from('souls')
            .select('id, full_name, phone, location, gender')
            .in('id', soulIds);
          (soulsRows ?? []).forEach((s: any) => {
            soulsData[s.id] = {
              id: s.id,
              fullName: s.full_name,
              phone: s.phone,
              location: s.location,
              gender: s.gender,
            } as Soul;
          });
        }

        setSouls(soulsData);
        setAttendances(attendancesData);
        setLoading(false);

        // Real-time subscription for updates
        const channel = supabase
          .channel('attendances-list')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'attendances', filter: `shepherd_id=eq.${shepherdId}` },
            async () => {
              const { data: freshRows } = await supabase
                .from('attendances')
                .select('*')
                .eq('shepherd_id', shepherdId)
                .order('date', { ascending: false });
              const fresh: AttendanceRecord[] = (freshRows ?? []).map((doc: any) => ({
                id: doc.id,
                soulId: doc.soul_id,
                shepherdId: doc.shepherd_id,
                date: doc.date ? new Date(doc.date) : new Date(),
                present: doc.present,
                notes: doc.notes,
              })) as AttendanceRecord[];
              setAttendances(fresh);
            })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      } catch (error) {
        console.error('Error loading attendances:', error);
        toast.error('Erreur lors du chargement des présences');
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Filtrer les présences
  const filteredAttendances = attendances.filter(attendance => {
    const soul = souls[attendance.soulId];
    if (!soul) return false;
    return soul.fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Trier les présences
  const sortedAttendances = [...filteredAttendances].sort((a, b) => {
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    switch (sortConfig.field) {
      case 'date':
        return (a.date.getTime() - b.date.getTime()) * modifier;
      case 'fullName':
        const soulA = souls[a.soulId];
        const soulB = souls[b.soulId];
        if (!soulA || !soulB) return 0;
        return soulA.fullName.localeCompare(soulB.fullName) * modifier;
      case 'present':
        return (Number(a.present) - Number(b.present)) * modifier;
      default:
        return 0;
    }
  });

  const handleSort = (field: typeof sortConfig.field) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Chargement des présences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une âme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <AttendanceTableHeader
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAttendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucune présence trouvée
                  </td>
                </tr>
              ) : (
                sortedAttendances.map((attendance) => (
                  <AttendanceTableRow
                    key={attendance.id}
                    attendance={attendance}
                    soul={souls[attendance.soulId]}
                    onEdit={() => setEditingAttendance(attendance)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingAttendance && (
        <EditAttendanceModal
          attendance={editingAttendance}
          isOpen={!!editingAttendance}
          onClose={() => setEditingAttendance(null)}
        />
      )}
    </div>
  );
}
