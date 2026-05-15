import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDate } from '../utils/dateUtils';
import { CustomTable } from '../components/ui/CustomTable';
import { Search } from 'lucide-react';
import { CustomPagination } from '../components/ui/CustomPagination';
import ShepherdFilter from '../components/souls/filters/ShepherdFilter';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function AttendanceView() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [souls, setSouls] = useState<Record<string, any>>({});
  const [shepherds, setShepherds] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShepherdId, setSelectedShepherdId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const columns = [
    {
      key: 'date',
      title: 'Date',
      render: (value: Date) => (
        <span className="text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'soulId',
      title: 'Âme',
      render: (value: string) => {
        const soul = souls[value];
        return soul ? (
          <div>
            <span className="font-medium text-gray-900">{soul.fullName}</span>
            <span className="ml-2 text-sm text-gray-500">{soul.phone}</span>
          </div>
        ) : (
          <span className="text-gray-500">Âme inconnue</span>
        );
      }
    },
    {
      key: 'shepherdId',
      title: 'Berger(e)',
      render: (value: string) => {
        const shepherd = shepherds[value];
        return shepherd ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
            {shepherd.fullName}
          </span>
        ) : (
          <span className="text-gray-500">Berger(e) inconnu(e)</span>
        );
      }
    },
    {
      key: 'present',
      title: 'Statut',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Présent(e)' : 'Absent(e)'}
        </span>
      )
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value: string) => value || '-'
    }
  ];

  useEffect(() => {
    let baseQuery = query(
      collection(db, 'attendances'),
      where('date', '>=', new Date(dateRange.startDate)),
      where('date', '<=', new Date(dateRange.endDate)),
      orderBy('date', 'desc') 
    );


    if (selectedShepherdId) {
      baseQuery = query(
        collection(db, 'attendances'),
        where('shepherdId', '==', selectedShepherdId),
        orderBy('date', 'desc')
      );
    }

    const unsubscribe = onSnapshot(baseQuery, async (snapshot) => {
      const attendancesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));

      // Charger les informations des âmes et des bergers
      const soulsData: Record<string, any> = {};
      const shepherdsData: Record<string, any> = {};

      // Récupérer les IDs uniques
      const uniqueSoulIds = [...new Set(attendancesData.map((a: any) => a.soulId).filter(Boolean))];
      const uniqueShepherdIds = [...new Set(attendancesData.map((a: any) => a.shepherdId).filter(Boolean))];

      // Charger les âmes
      for (const soulId of uniqueSoulIds) {
        try {
          const soulDoc = await getDoc(doc(db, 'souls', soulId));
          if (soulDoc.exists()) {
            soulsData[soulId] = {
              id: soulId,
              ...soulDoc.data()
            };
          }
        } catch (error) {
          console.error(`Error loading soul ${soulId}:`, error);
        }
      }

      // Charger les bergers
      for (const shepherdId of uniqueShepherdIds) {
        try {
          const shepherdDoc = await getDoc(doc(db, 'users', shepherdId));
          if (shepherdDoc.exists()) {
            shepherdsData[shepherdId] = {
              id: shepherdId,
              ...shepherdDoc.data()
            };
          }
        } catch (error) {
          console.error(`Error loading shepherd ${shepherdId}:`, error);
        }
      }

      setSouls(soulsData);
      setShepherds(shepherdsData);
      setAttendances(attendancesData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading attendances:', error);
      toast.error('Erreur lors du chargement des présences');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedShepherdId, dateRange]);

  // Filtrer les présences
  const filteredAttendances = attendances.filter(attendance => {
    const soul = souls[attendance.soulId];
    if (!soul) return false;

    return soul.fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredAttendances.length / ITEMS_PER_PAGE);
  const paginatedAttendances = filteredAttendances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des présences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Historique des Présences</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
          </div>

          <ShepherdFilter
            value={selectedShepherdId}
            onChange={setSelectedShepherdId}
          />
          
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
        </div>

        <CustomTable
          data={paginatedAttendances}
          columns={columns}
        />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAttendances.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </div>
  );
}