import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, MessageCircle, Phone, Users, ChevronDown } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { formatDate } from '../utils/dateUtils';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import { CustomPagination } from '../components/ui/CustomPagination';
import { isShepherdUser, isEvangelistUser } from '../utils/roleHelpers';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

interface Actor {
  id: string;
  fullName: string;
  role: 'shepherd' | 'intern' | 'evangelist' | string;
}

export default function InteractionsManagement() {
  const { user, activeRole } = useAuth();
  const { hasPermission } = usePermissions();
  const [interactions, setInteractions] = useState<any[]>([]);
  const [souls, setSouls] = useState<Record<string, any>>({});
  const [actors, setActors] = useState<Record<string, Actor>>({});
  const [actorList, setActorList] = useState<Actor[]>([]); // Pour le filtre admin
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState({
    field: 'date' as 'date' | 'type' | 'soulName' | 'shepherdName',
    direction: 'desc' as 'asc' | 'desc'
  });

  const isAdminView = hasPermission(PERMISSIONS.MANAGE_USERS);
  const isEvangelistView = activeRole === 'evangelist';

  // Libellé dynamique de la colonne intervenant
  const actorColumnLabel = isEvangelistView ? 'Évangéliste' : isAdminView ? 'Intervenant(e)' : 'Berger(e)';

  const columns = [
    {
      key: 'type',
      title: 'Type',
      render: (value: string) => {
        const icons: Record<string, React.ReactNode> = {
          call: <Phone className="w-5 h-5 text-blue-600" />,
          visit: <Users className="w-5 h-5 text-green-600" />,
        };
        const labels: Record<string, string> = {
          call: 'Appel', visit: 'Visite', sms: 'SMS', message: 'Message', other: 'Autre',
        };
        return (
          <div className="flex items-center space-x-2">
            {icons[value] ?? <MessageCircle className="w-5 h-5 text-amber-600" />}
            <span className="text-sm font-medium">{labels[value] ?? value}</span>
          </div>
        );
      }
    },
    {
      key: 'date',
      title: 'Date',
      render: (value: Date) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'soulId',
      title: 'Âme',
      render: (value: string) => {
        const soul = souls[value];
        return soul ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F2B636]/10 text-[#F2B636]">
            {soul.fullName}
          </span>
        ) : (
          <span className="text-sm text-gray-400 italic">Âme inconnue</span>
        );
      }
    },
    {
      key: 'shepherdId',
      title: actorColumnLabel,
      render: (value: string) => {
        const actor = actors[value];
        return actor ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
            {actor.fullName}
          </span>
        ) : (
          <span className="text-sm text-gray-400 italic">Inconnu(e)</span>
        );
      }
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value: string) => (
        <div className="max-w-xs break-words whitespace-normal text-sm text-gray-600">
          {value}
        </div>
      )
    }
  ];

  // Charger la liste des intervenants pour le filtre admin (bergers + évangélistes)
  useEffect(() => {
    if (!isAdminView) return;
    const load = async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'users'),
          where('status', '==', 'active')
        ));
        const list: Actor[] = snap.docs
          .map(d => {
            const data = d.data() as any;
            const isShepherd = isShepherdUser(data);
            const isEvangelist = isEvangelistUser(data);
            if (!isShepherd && !isEvangelist) return null;
            return {
              id: d.id,
              fullName: data.fullName,
              role: isEvangelist ? 'evangelist' : (data.role || 'shepherd'),
            } as Actor;
          })
          .filter(Boolean) as Actor[];
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setActorList(list);
      } catch (err) {
        console.error('Error loading actor list:', err);
      }
    };
    load();
  }, [isAdminView]);

  useEffect(() => {
    if (!user) return;
    let unsubscribeFn: (() => void) | null = null;

    const loadData = async () => {
      try {
        let currentUserId: string | null = null;

        if (!isAdminView) {
          // Berger ou évangéliste : filtrer par son propre ID
          const userQuery = query(
            collection(db, 'users'),
            where('uid', '==', user.uid),
            where('status', '==', 'active')
          );
          const userDocs = await getDocs(userQuery);
          const matched = userDocs.docs.find(d => {
            const data = d.data() as any;
            return isShepherdUser(data) || isEvangelistUser(data);
          });
          if (matched) {
            currentUserId = matched.id;
          } else {
            // Fallback : utiliser l'ID du user AuthContext
            currentUserId = (user as any).id || (user as any).uid;
          }
        }

        // Construire la requête
        let interactionsQuery;
        if (currentUserId) {
          interactionsQuery = query(
            collection(db, 'interactions'),
            where('shepherdId', '==', currentUserId),
            orderBy('date', 'desc')
          );
        } else if (selectedActorId) {
          interactionsQuery = query(
            collection(db, 'interactions'),
            where('shepherdId', '==', selectedActorId),
            orderBy('date', 'desc')
          );
        } else {
          interactionsQuery = query(
            collection(db, 'interactions'),
            orderBy('date', 'desc')
          );
        }

        unsubscribeFn = onSnapshot(interactionsQuery, async (snapshot) => {
          const interactionsData = snapshot.docs.map(d => ({
            id: d.id,
            date: d.data().date.toDate(),
            type: d.data().type,
            notes: d.data().notes,
            soulId: d.data().soulId,
            shepherdId: d.data().shepherdId,
            sourceCollection: d.data().sourceCollection || 'souls',
          }));

          const uniqueSoulIds = [...new Set(interactionsData.map(i => i.soulId))].filter(Boolean);
          const uniqueActorIds = [...new Set(interactionsData.map(i => i.shepherdId))].filter(Boolean);

          // Charger les âmes (souls + evangelized_souls)
          const [soulDocs, evangelizedDocs] = await Promise.all([
            Promise.all(uniqueSoulIds.map(id => getDoc(doc(db, 'souls', id)))),
            Promise.all(uniqueSoulIds.map(id => getDoc(doc(db, 'evangelized_souls', id)))),
          ]);

          const soulsData: Record<string, any> = {};
          soulDocs.forEach(d => {
            if (d.exists()) soulsData[d.id] = { id: d.id, fullName: d.data().fullName, collection: 'souls' };
          });
          evangelizedDocs.forEach(d => {
            if (d.exists() && !soulsData[d.id]) {
              soulsData[d.id] = { id: d.id, fullName: d.data().fullName, collection: 'evangelized_souls' };
            }
          });

          // Charger les intervenants (users uniquement — bergers et évangélistes y sont)
          const actorDocs = await Promise.all(uniqueActorIds.map(id => getDoc(doc(db, 'users', id))));
          const actorsData: Record<string, Actor> = {};
          actorDocs.forEach(d => {
            if (d.exists()) {
              const data = d.data() as any;
              actorsData[d.id] = { id: d.id, fullName: data.fullName, role: data.role };
            }
          });

          setSouls(soulsData);
          setActors(actorsData);
          setInteractions(interactionsData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading interactions:', error);
        toast.error('Erreur lors du chargement des interactions');
        setLoading(false);
      }
    };

    loadData();
    return () => { if (unsubscribeFn) unsubscribeFn(); };
  }, [user, selectedActorId, isAdminView]);

  // Filtrage — ne pas exclure les interactions dont l'intervenant est inconnu
  const filteredInteractions = interactions.filter(interaction => {
    const soul = souls[interaction.soulId];
    const actor = actors[interaction.shepherdId];
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return true;
    return (
      (soul?.fullName ?? '').toLowerCase().includes(searchLower) ||
      (actor?.fullName ?? '').toLowerCase().includes(searchLower) ||
      (interaction.notes ?? '').toLowerCase().includes(searchLower)
    );
  });

  // Tri
  const sortedInteractions = [...filteredInteractions].sort((a, b) => {
    const { field, direction } = sortConfig;
    const mod = direction === 'asc' ? 1 : -1;
    switch (field) {
      case 'date': return (a.date.getTime() - b.date.getTime()) * mod;
      case 'type': return a.type.localeCompare(b.type) * mod;
      case 'soulName': return (souls[a.soulId]?.fullName ?? '').localeCompare(souls[b.soulId]?.fullName ?? '') * mod;
      case 'shepherdName': return (actors[a.shepherdId]?.fullName ?? '').localeCompare(actors[b.shepherdId]?.fullName ?? '') * mod;
      default: return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedInteractions.length / ITEMS_PER_PAGE);
  const paginatedInteractions = sortedInteractions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedActorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des interactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEvangelistView ? 'Mes interactions' : 'Gestion des Interactions'}
        </h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>

          {/* Filtre intervenant (admin uniquement) — bergers + évangélistes */}
          {isAdminView && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrer par intervenant(e)
              </label>
              <div className="relative">
                <select
                  value={selectedActorId || ''}
                  onChange={e => setSelectedActorId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C] appearance-none"
                >
                  <option value="">Tous les intervenants</option>
                  {actorList.filter(a => isShepherdUser(a as any)).length > 0 && (
                    <optgroup label="Berger(e)s">
                      {actorList
                        .filter(a => !isEvangelistUser(a as any))
                        .map(a => (
                          <option key={a.id} value={a.id}>{a.fullName}</option>
                        ))}
                    </optgroup>
                  )}
                  {actorList.filter(a => isEvangelistUser(a as any)).length > 0 && (
                    <optgroup label="Évangélistes">
                      {actorList
                        .filter(a => isEvangelistUser(a as any))
                        .map(a => (
                          <option key={a.id} value={a.id}>{a.fullName}</option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Recherche textuelle */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                isEvangelistView
                  ? 'Rechercher par âme évangélisée ou notes...'
                  : 'Rechercher par âme, intervenant ou notes...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
            />
            <p className="mt-1 text-sm text-gray-500">
              {filteredInteractions.length} résultat{filteredInteractions.length !== 1 ? 's' : ''} trouvé{filteredInteractions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <CustomTable data={paginatedInteractions} columns={columns} />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedInteractions.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </div>
  );
}
