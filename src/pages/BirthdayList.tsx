import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Calendar, Gift, Users, Bell, Trash2, Plus } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../utils/dateUtils';
import { CustomPagination } from '../components/ui/CustomPagination';
import { StatCard } from '../components/dashboard/stats/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import BirthdayForm from '../components/birthdays/BirthdayForm';
import toast from 'react-hot-toast';
import { getDaysUntilBirthday } from '../utils/dateUtils';

const ITEMS_PER_PAGE = 10;

export default function BirthdayList() {
  const { userRole } = useAuth();
  const { hasPermission } = usePermissions();
  const canManageBirthdays = userRole === 'super_admin' || hasPermission('MANAGE_BIRTHDAYS');
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'current' | 'next'>('all');
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    nextMonth: 0,
    upcoming: 0
  });
  const [selectedStat, setSelectedStat] = useState<'all' | 'current' | 'next' | 'upcoming'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fonction pour calculer les jours restants
  const getDaysRemaining = (birthDate: string) => {
    const [month, day] = birthDate.split('-').map(Number);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Créer la date d'anniversaire pour cette année
    let birthdayThisYear = new Date(currentYear, month - 1, day);
    
    // Si l'anniversaire est déjà passé cette année, utiliser l'année prochaine
    if (today > birthdayThisYear) {
      birthdayThisYear = new Date(currentYear + 1, month - 1, day);
    }
    
    // Calculer la différence en jours
    const diffTime = birthdayThisYear.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculer les statistiques
  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const nextMonth = (currentMonth + 1) % 12;

    const thisMonthCount = birthdays.filter(birthday => {
      const month = parseInt(birthday.birthDate.split('-')[0]) - 1;
      return month === currentMonth;
    }).length;

    const nextMonthCount = birthdays.filter(birthday => {
      const month = parseInt(birthday.birthDate.split('-')[0]) - 1;
      return month === nextMonth;
    }).length;

    const upcomingCount = birthdays.filter(birthday => {
      const daysUntil = getDaysUntilBirthday(`2024-${birthday.birthDate}`);
      return daysUntil <= 30;
    }).length;

    setStats({
      total: birthdays.length,
      thisMonth: thisMonthCount,
      nextMonth: nextMonthCount,
      upcoming: upcomingCount
    });
  }, [birthdays]);

  const handleDelete = async (birthdayId: string) => {
    if (!canManageBirthdays) {
      toast.error('Vous n\'avez pas la permission de supprimer des anniversaires');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet anniversaire ?')) {
      try {
        await deleteDoc(doc(db, 'birthdays', birthdayId));
        toast.success('Anniversaire supprimé avec succès');
      } catch (error) {
        console.error('Error deleting birthday:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const columns = [
    {
      key: 'fullName',
      title: 'Nom et Prénoms',
      render: (value: string, birthday: any) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {birthday.nickname && (
            <span className="ml-2 text-sm text-gray-500">
              ({birthday.nickname})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'birthDate',
      title: 'Date d\'anniversaire',
      render: (value: string) => (
        <div className="text-sm">
          <div className="font-medium">
            {new Date(2024, parseInt(value.split('-')[0]) - 1, parseInt(value.split('-')[1])).toLocaleDateString('fr-FR', { 
              day: 'numeric',
              month: 'long'
            })}
          </div>
          <div className="text-gray-500 mt-1">
            Dans {getDaysRemaining(value)} jours
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Téléphone',
      render: (value: string) => value
    },
    ...(canManageBirthdays ? [{
      key: 'actions',
      title: 'Actions',
      render: (_: any, birthday: any) => (
        <div className="flex justify-end">
          <button
            onClick={() => handleDelete(birthday.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }] : [])
  ];

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    
    let baseQuery = query(
      collection(db, 'birthdays'),
      orderBy('birthDate', 'asc')
    );

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const birthdaysData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrer selon le mois
      const filteredData = birthdaysData.filter((birthday: any) => {
        const month = parseInt(birthday.birthDate?.split('-')[0] || '1') - 1;
        if (filter === 'current') {
          return month === currentMonth;
        } else if (filter === 'next') {
          return month === nextMonth;
        }
        return true;
      });

      // Trier par jours restants
      filteredData.sort((a: any, b: any) => getDaysUntilBirthday(a.birthDate) - getDaysUntilBirthday(b.birthDate));
      
      setBirthdays(filteredData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading birthdays:', error);
      toast.error('Erreur lors du chargement des anniversaires');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleStatusChange = async (birthdayId: string, status: 'approved' | 'rejected') => {
    try {
      const birthdayRef = doc(db, 'birthdays', birthdayId);
      await updateDoc(birthdayRef, {
        status,
        updatedAt: new Date()
      });
      toast.success(`Anniversaire ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
    } catch (error) {
      console.error('Error updating birthday status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Filtrer les anniversaires
  const filteredBirthdays = birthdays.filter(birthday =>
    birthday.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    birthday.phone.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Trier par nombre de jours restants
    const daysA = getDaysUntilBirthday(a.birthDate);
    const daysB = getDaysUntilBirthday(b.birthDate);
    return daysA - daysB;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBirthdays.length / ITEMS_PER_PAGE);
  const paginatedBirthdays = filteredBirthdays.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des anniversaires...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Anniversaires</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un anniversaire
        </button>
      </div>
      
      {/* Cartes de statistiques cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => {
            setSelectedStat('all');
            setFilter('all');
          }}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <StatCard
            title="Total"
            value={stats.total}
            icon={Users}
            trend={`${stats.total}`}
            trendLabel="anniversaires"
            className={selectedStat === 'all' ? 'ring-2 ring-[#00665C]' : ''}
          />
        </div>
        
        <div
          onClick={() => {
            setSelectedStat('current');
            setFilter('current');
          }}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <StatCard
            title="Ce mois-ci"
            value={stats.thisMonth}
            icon={Gift}
            trend={`${((stats.thisMonth / stats.total) * 100).toFixed(1)}%`}
            trendLabel="du total"
            iconClassName="text-pink-600"
            className={selectedStat === 'current' ? 'ring-2 ring-[#00665C]' : ''}
          />
        </div>
        
        <div
          onClick={() => {
            setSelectedStat('next');
            setFilter('next');
          }}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <StatCard
            title="Mois prochain"
            value={stats.nextMonth}
            icon={Calendar}
            trend={`${((stats.nextMonth / stats.total) * 100).toFixed(1)}%`}
            trendLabel="du total"
            iconClassName="text-purple-600"
            className={selectedStat === 'next' ? 'ring-2 ring-[#00665C]' : ''}
          />
        </div>
        
        <div
          onClick={() => {
            setSelectedStat('upcoming');
            setFilter('all');
          }}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <StatCard
            title="Dans les 30 jours"
            value={stats.upcoming}
            icon={Bell}
            trend={`${((stats.upcoming / stats.total) * 100).toFixed(1)}%`}
            trendLabel="du total"
            iconClassName="text-amber-600"
            className={selectedStat === 'upcoming' ? 'ring-2 ring-[#00665C]' : ''}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-[#00665C] text-white'
              : 'text-gray-700 bg-white border border-gray-300'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('current')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'current'
              ? 'bg-[#00665C] text-white'
              : 'text-gray-700 bg-white border border-gray-300'
          }`}
        >
          Mois en cours
        </button>
        <button
          onClick={() => setFilter('next')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'next'
              ? 'bg-[#00665C] text-white'
              : 'text-gray-700 bg-white border border-gray-300'
          }`}
        >
          Mois prochain
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un anniversaire..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {/* Tableau des anniversaires */}
      <div className="bg-white rounded-lg shadow-sm border">
        <CustomTable
          data={paginatedBirthdays}
          columns={columns}
        />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredBirthdays.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>

      {/* Message si aucun résultat */}
      {filteredBirthdays.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun anniversaire trouvé</p>
        </div>
      )}

      {/* Légende des jours restants */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">À propos des jours restants</h3>
            <p className="mt-1 text-sm text-blue-700">
              Le nombre de jours restants est calculé jusqu'au prochain anniversaire. 
              Pour les anniversaires déjà passés cette année, le calcul se fait pour l'année prochaine.
            </p>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'anniversaire */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un anniversaire"
      >
        <div className="p-6">
          <BirthdayForm
            onSuccess={() => {
              setShowAddModal(false);
              toast.success('Anniversaire ajouté avec succès !');
            }}
            onClose={() => setShowAddModal(false)}
            isModal={true}
          />
        </div>
      </Modal>
    </div>
  );
}