import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Soul } from '../types/database.types';
import { Search, Filter, ChevronDown, ChevronUp, TrendingUp, Heart, Droplets, BookOpen, Users2, Briefcase } from 'lucide-react';
import { ProgressionTimeline } from '../components/souls/progression/ProgressionTimeline';
import { CustomPagination } from '../components/ui/CustomPagination';
import ShepherdFilter from '../components/souls/filters/ShepherdFilter';
import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/dashboard/stats/StatCard';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 5;

export default function SpiritualProgression() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShepherdId, setSelectedShepherdId] = useState<string | null>(null);
  const [expandedSoulId, setExpandedSoulId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalSouls = souls.length;
    const bornAgain = souls.filter(s => s.spiritualProfile.isBornAgain).length;
    const baptized = souls.filter(s => s.spiritualProfile.isBaptized).length;
    const academy = souls.filter(s => s.spiritualProfile.isEnrolledInAcademy).length;
    const lifeBearers = souls.filter(s => s.spiritualProfile.isEnrolledInLifeBearers).length;
    const serving = souls.filter(s => s.spiritualProfile.departments?.length > 0).length;

    return {
      totalSouls,
      bornAgain,
      baptized,
      academy,
      lifeBearers,
      serving,
      bornAgainPercent: totalSouls ? (bornAgain / totalSouls) * 100 : 0,
      baptizedPercent: totalSouls ? (baptized / totalSouls) * 100 : 0,
      academyPercent: totalSouls ? (academy / totalSouls) * 100 : 0,
      lifeBearersPercent: totalSouls ? (lifeBearers / totalSouls) * 100 : 0,
      servingPercent: totalSouls ? (serving / totalSouls) * 100 : 0
    };
  }, [souls]);

  useEffect(() => {
    try {
      // Construire la requête de base
      let baseQuery = query(
        collection(db, 'souls'),
        where('status', '==', 'active')
      );

      // Ajouter le filtre par berger si sélectionné
      if (selectedShepherdId) {
        baseQuery = query(
          collection(db, 'souls'),
          where('status', '==', 'active'),
          where('shepherdId', '==', selectedShepherdId)
        );
      }

      const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
        const soulsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            firstVisitDate: doc.data().firstVisitDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          } as Soul))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setSouls(soulsData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading souls:', error);
        toast.error('Erreur lors du chargement des âmes');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up souls listener:', error);
      toast.error('Erreur lors de l\'initialisation');
      setLoading(false);
    }
  }, [selectedShepherdId]);

  // Filtrer les âmes par recherche
  const filteredSouls = souls.filter(soul =>
    soul.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Pagination
  const totalPages = Math.ceil(filteredSouls.length / ITEMS_PER_PAGE);
  const paginatedSouls = filteredSouls.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
    setExpandedSoulId(null);
  }, [searchTerm, selectedShepherdId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Progression Spirituelle</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
        >
          <Filter className="w-4 h-4 mr-1.5" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          title="Total des âmes"
          value={stats.totalSouls}
          icon={TrendingUp}
          trend={`${stats.totalSouls}`}
          trendLabel="âmes au total"
          iconClassName="text-[#00665C]"
        />
        <StatCard
          title="Nés de nouveau"
          value={stats.bornAgain}
          icon={Heart}
          trend={`${stats.bornAgainPercent.toFixed(1)}%`}
          trendLabel="des âmes"
          iconClassName="text-red-600"
          details={[
            { label: 'Nés de nouveau', value: stats.bornAgain },
            { label: 'En attente', value: stats.totalSouls - stats.bornAgain }
          ]}
        />
        <StatCard
          title="Baptisés"
          value={stats.baptized}
          icon={Droplets}
          trend={`${stats.baptizedPercent.toFixed(1)}%`}
          trendLabel="des âmes"
          iconClassName="text-blue-600"
          details={[
            { label: 'Baptisés', value: stats.baptized },
            { label: 'Non baptisés', value: stats.totalSouls - stats.baptized }
          ]}
        />
        <StatCard
          title="Académie VDH"
          value={stats.academy}
          icon={BookOpen}
          trend={`${stats.academyPercent.toFixed(1)}%`}
          trendLabel="des âmes"
          iconClassName="text-amber-600" 
          details={[
            { label: 'Inscrits', value: stats.academy },
            { label: 'Non inscrits', value: stats.totalSouls - stats.academy }
          ]}
        />
        <StatCard
          title="École PDV"
          value={stats.lifeBearers}
          icon={Users2}
          trend={`${stats.lifeBearersPercent.toFixed(1)}%`}
          trendLabel="des âmes"
          iconClassName="text-emerald-600"
          details={[
            { label: 'Inscrits', value: stats.lifeBearers },
            { label: 'Non inscrits', value: stats.totalSouls - stats.lifeBearers }
          ]}
        />
        <StatCard
          title="En service"
          value={stats.serving}
          icon={Briefcase}
          trend={`${stats.servingPercent.toFixed(1)}%`}
          trendLabel="des âmes"
          iconClassName="text-purple-600"
          details={[
            { label: 'En service', value: stats.serving },
            { label: 'Hors service', value: stats.totalSouls - stats.serving }
          ]}
        />
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h3 className="text-base font-medium text-gray-900">Filtres</h3>
          
          <ShepherdFilter
            value={selectedShepherdId}
            onChange={setSelectedShepherdId}
          />
          
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une âme par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSouls.length} résultat{filteredSouls.length !== 1 ? 's' : ''} trouvé{filteredSouls.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Liste des âmes avec accordéon */}
      <div className="bg-white rounded-lg border divide-y">
        {paginatedSouls.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Aucune âme trouvée
            </p>
          </div>
        ) : (
          paginatedSouls.map(soul => (
            <div key={soul.id} className="overflow-hidden">
              <button
                onClick={() => setExpandedSoulId(expandedSoulId === soul.id ? null : soul.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{soul.fullName}</h3>
                  <p className="text-sm text-gray-500">{soul.phone}</p>
                </div>
                {expandedSoulId === soul.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Contenu de l'accordéon */}
              <div className={`transition-all duration-500 ease-in-out ${
                expandedSoulId === soul.id 
                  ? 'max-h-[1000px] opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-6">
                  <ProgressionTimeline spiritualProfile={soul.spiritualProfile} />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => {
                setCurrentPage(page);
                setExpandedSoulId(null);
              }}
              totalItems={filteredSouls.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>
    </div>
  );
}