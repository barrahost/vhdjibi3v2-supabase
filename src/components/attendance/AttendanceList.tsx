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
    if (!user) return;

    const loadData = async () => {
      try {
        // Récupérer le profil berger depuis users
        const userRows = await getDocs(supabase)
          .from('users')
          .select('id, role, business_profiles')
          .eq('uid', user.uid)
          .eq('status', 'active')
          .limit(1);

        if (!userRows || userRows.length === 0) {
          toast.error('Berger non trouvé');
          setLoading(false);
          return;
        }

        const userData = userRows[0];
        const hasShepherdProfile =
          userData.business_profiles?.some(
            (profile: any) => profile.type === 'shepherd' && profile.isActive
          ) ||
          userData.role === 'shepherd' ||
          userData.role === 'intern';

        if (!hasShepherdProfile) {
          toast.error('Accès non autorisé - profil berger requis');
          setLoading(false);
          return;
        }

        const shepherdId = userData.id;

        // Récupérer les présences
        const attendancesRows = await getDocs(supabase)
          .from('attendances')
          .select('*')
          .eq('shepherd_id', shepherdId)
          .order('date', { ascending: false });

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
          const soulsRows = await getDocs(supabase)
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
              const freshRows = await getDocs(supabase)
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