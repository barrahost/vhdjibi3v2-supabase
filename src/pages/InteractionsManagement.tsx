import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, MessageCircle, Phone, Users, ChevronDown } from 'lucide-react';
import { CollapsibleFilters } from '../components/ui/CollapsibleFilters';
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
  const [actorList, setActorList] = useState<Actor[]>([]);
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

  const actorColumnLabel = isEvangelistView ? 'Evangeliste' : isAdminView ? 'Intervenant(e)' : 'Berger(e)';

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
      title: 'Ame',
      render: (value: string) => {
        const soul = souls[value];
        return soul ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F2B636]/10 text-[#F2B636]">
            {soul.fullName}
          </span>
        ) : (
          <span className="text-sm text-gray-400 italic">Ame inconnue</span>
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

  // Load actor list for admin filter (shepherds + evangelists)
  useEffect(() => {
    if (!isAdminView) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('status', 'active');
        if (error) throw error;
        const list: Actor[] = (data || [])
          .filter((d: any) => isShepherdUser(d) || isEvangelistUser(d))
          .map((d: any) => ({
            id: d.id,
            fullName: d.full_name || d.fullName || '',
            role: isEvangelistUser(d) ? 'evangelist' : (d.role || 'shepherd'),
          }));
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setActorList(list);
      } catch (err) {
        console.error('Error loading actor list:', err);
      }
    };
    load();
  }, [isAdminView]);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let currentUserId: string | null = null;

      if (!isAdminView) {
        // Shepherd or evangelist: find their document ID by uid
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const localUserId = localUser.id;
        if (localUserId) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', localUserId)
            .eq('status', 'active')
            .single();
          if (userData && (isShepherdUser(userData) || isEvangelistUser(userData))) {
            currentUserId = localUserId;
          } else {
            currentUserId = localUserId;
          }
        } else {
          currentUserId = (user as any).id;
        }
      }

      let q = supabase.from('interactions').select('*').order('date', { ascending: false });

      if (currentUserId) {
        q = q.eq('shepherd_id', currentUserId);
      } else if (selectedActorId) {
        q = q.eq('shepherd_id', selectedActorId);
      }

      const { data, error } = await q;
      if (error) throw error;

      const interactionsData = (data || []).map((row: any) => ({
        id: row.id,
        date: row.date ? new Date(row.date) : new Date(),
        type: row.type,
        notes: row.notes,
        soulId: row.soulId || row.soul_id,
        shepherdId: row.shepherdId || row.shepherd_id,
        sourceCollection: row.sourceCollection || row.source_collection || 'souls',
      }));

      const uniqueSoulIds = [...new Set(interactionsData.map((i: any) => i.soulId))].filter(Boolean) as string[];
      const uniqueActorIds = [...new Set(interactionsData.map((i: any) => i.shepherdId))].filter(Boolean) as string[];

      // Batch load souls from both tables in parallel
      const soulsData: Record<string, any> = {};
      if (uniqueSoulIds.length > 0) {
        const [soulsResult, evangelizedResult] = await Promise.all([
          supabase.from('souls').select('id, full_name').in('id', uniqueSoulIds),
          supabase.from('evangelized_souls').select('id, full_name').in('id', uniqueSoulIds),
        ]);
        (soulsResult.data || []).forEach((s: any) => {
          soulsData[s.id] = { id: s.id, fullName: s.full_name || s.fullName, collection: 'souls' };
        });
        (evangelizedResult.data || []).forEach((s: any) => {
          if (!soulsData[s.id]) soulsData[s.id] = { id: s.id, fullName: s.full_name || s.fullName, collection: 'evangelized_souls' };
        });
      }

      // Batch load actors
      const actorsData: Record<string, Actor> = {};
      if (uniqueActorIds.length > 0) {
        const { data: actorDocs } = await supabase
          .from('users')
          .select('id, full_name, role')
          .in('id', uniqueActorIds);
        (actorDocs || []).forEach((d: any) => {
          actorsData[d.id] = { id: d.id, fullName: d.full_name || d.fullName, role: d.role };
        });
      }

      setSouls(soulsData);
      setActors(actorsData);
      setInteractions(interactionsData);
    } catch (error) {
      console.error('Error loading interactions:', error);
      toast.error('Erreur lors du chargement des interactions');
    } finally {
      setLoading(false);
    }
  }, [user, selectedActorId, isAdminView]);

  useEffect(() => {
    fetchInteractions();

    const channel = supabase
      .channel('interactions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, () => {
        fetchInteractions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchInteractions]);

  const activeFiltersCount = [searchTerm !== '', selectedActorId !== null].filter(Boolean).length;

  // Filter â don't exclude interactions with unknown actor
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

  // Sort
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


  // ---- Mobile card renderer ----
  const renderInteractionMobileCard = (interaction: any) => {
    const soul = souls[interaction.soulId];
    const actor = actors[interaction.shepherdId];
    const typeIcons: Record<string, string> = {
      call: '📞', visit: '🤝', sms: '💬', message: '✉️', other: '📝',
    };
    const typeLabels: Record<string, string> = {
      call: 'Appel', visit: 'Visite', sms: 'SMS', message: 'Message', other: 'Autre',
    };
    const typeColors: Record<string, string> = {
      call: 'bg-blue-100 text-blue-700',
      visit: 'bg-green-100 text-green-700',
      sms: 'bg-purple-100 text-purple-700',
      message: 'bg-indigo-100 text-indigo-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return (
      <div className="p-4">
        {/* Top row: type badge + date */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold " + (typeColors[interaction.type] || 'bg-gray-100 text-gray-700')}>
            <span>{typeIcons[interaction.type] || '📝'}</span>
            {typeLabels[interaction.type] || interaction.type}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {interaction.date instanceof Date
              ? interaction.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          </span>
        </div>

        {/* Soul */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Âme</span>
          {soul ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F2B636]/10 text-[#c8941a]">
              {soul.fullName}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Inconnue</span>
          )}
        </div>

        {/* Actor */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{actorColumnLabel}</span>
          {actor ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
              {actor.fullName}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Inconnu(e)</span>
          )}
        </div>

        {/* Notes */}
        {interaction.notes && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 line-clamp-2">{interaction.notes}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des interactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          {isEvangelistView ? 'Mes interactions' : 'Gestion des interactions'}
        </h1>
      </div>

      <div className="space-y-4">
        <CollapsibleFilters activeCount={activeFiltersCount} storageKey="filters:interactions:open">

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
                    <optgroup label="Evangelistes">
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                isEvangelistView
                  ? 'Rechercher par ame evangelisee ou notes...'
                  : 'Rechercher par ame, intervenant ou notes...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
            />
            <p className="mt-1 text-sm text-gray-500">
              {filteredInteractions.length} resultat{filteredInteractions.length !== 1 ? 's' : ''} trouve{filteredInteractions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CollapsibleFilters>

        <CustomTable data={paginatedInteractions} columns={columns} mobileCard={renderInteractionMobileCard} />

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
