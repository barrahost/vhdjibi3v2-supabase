import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Search } from 'lucide-react';
import { AttendanceTableHeader } from './AttendanceTableHeader';
import { AttendanceTableRow } from './AttendanceTableRow';
import EditAttendanceModal from './EditAttendanceModal';
import { AttendanceRecord, Soul } from '../../types/attendance.types';
import toast from 'react-hot-toast';

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
        // Récupérer l'ID du berger depuis la collection users
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('status', '==', 'active')
        );
        const userDoc = await getDocs(userQuery);
        
        if (!userDoc.empty) {
          // Vérifier si l'utilisateur a un profil berger actif
          const userData = userDoc.docs[0].data();
          const hasShepherdProfile = userData.businessProfiles?.some(
            (profile: any) => profile.type === 'shepherd' && profile.isActive
          ) || userData.role === 'shepherd' || userData.role === 'intern';

          if (!hasShepherdProfile) {
            toast.error('Accès non autorisé - profil berger requis');
            setLoading(false);
            return;
          }

          const shepherdId = userDoc.docs[0].id;

          // Récupérer les présences
          const attendancesQuery = query(
            collection(db, 'attendances'),
            where('shepherdId', '==', shepherdId),
            orderBy('date', 'desc')
          );

          const unsubscribe = onSnapshot(attendancesQuery, async (snapshot) => {
            const attendancesData: AttendanceRecord[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data() as Omit<AttendanceRecord, 'id' | 'date'>,
              date: doc.data().date.toDate()
            })) as AttendanceRecord[];

            // Récupérer les informations des âmes
            const soulsData: Record<string, Soul> = {};
            for (const attendance of attendancesData) {
              if (!soulsData[attendance.soulId]) {
                // Utiliser getDoc au lieu de getDocs car nous cherchons un document spécifique
                const soulDoc = await getDoc(doc(db, 'souls', attendance.soulId));
                if (soulDoc.exists()) {
                  soulsData[attendance.soulId] = {
                    id: attendance.soulId,
                    ...soulDoc.data()
                  } as Soul;
                }
              }
            }

            setSouls(soulsData);
            setAttendances(attendancesData);
            setLoading(false);
          });

          return () => unsubscribe();
        } else {
          toast.error('Berger non trouvé');
          setLoading(false);
        }
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