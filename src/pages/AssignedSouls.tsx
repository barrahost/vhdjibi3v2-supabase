import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Soul } from '../types/database.types';
import { Pencil, Search, Phone } from 'lucide-react';
import EditSoulModal from '../components/souls/EditSoulModal';
import InteractionModal from '../components/interactions/InteractionModal';
import { formatDate } from '../utils/dateUtils';
import { CustomTable } from '../components/ui/CustomTable';
import LastContactBadge from '../components/interactions/LastContactBadge';
import toast from 'react-hot-toast';

type SortField = 'fullName' | 'lastContact';

export default function AssignedSouls() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [shepherdId, setShepherdId] = useState<string | null>(null);
  const [editingSoul, setEditingSoul] = useState<Soul | null>(null);
  const [interactingSoul, setInteractingSoul] = useState<Soul | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastContactMap, setLastContactMap] = useState<Map<string, Date>>(new Map());
  const [sortField, setSortField] = useState<SortField>('lastContact');

  const loadLastContacts = async (soulIds: string[]) => {
    const map = new Map<string, Date>();
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('soulId, date')
        .in('soulId', soulIds)
        .order('date', { ascending: false });

      if (error) throw error;

      (data ?? []).forEach((row: any) => {
        const sId = row.soulId;
        const dt = new Date(row.date);
        if (!map.has(sId) || map.get(sId)!.getTime() < dt.getTime()) {
          map.set(sId, dt);
        }
      });
    } catch (e) {
      console.error('Error loading interactions:', e);
    }
    setLastContactMap(map);
  };

  const columns = [
    {
      key: 'fullName',
      title: 'Nom et Prénoms',
      render: (value: string, soul: Soul) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {soul.nickname && (
            <span className="ml-2 text-sm text-gray-500">({soul.nickname})</span>
          )}
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Téléphone',
      render: (value: string) => <span className="text-gray-600">{value}</span>
    },
    {
      key: 'location',
      title: "Lieu d'habitation",
      render: (value: string) => <span className="text-gray-600">{value}</span>
    },
    {
      key: 'firstVisitDate',
      title: 'Date de première visite',
      render: (value: Date) => <span className="text-gray-600">{formatDate(value)}</span>
    },
    {
      key: 'lastContact',
      title: 'Dernier contact',
      render: (_: any, soul: Soul) => (
        <LastContactBadge date={lastContactMap.get(soul.id) || null} />
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, soul: Soul) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInteractingSoul(soul);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded transition-colors"
            title="Contacter cette âme"
          >
            <Phone className="w-3.5 h-3.5" />
            Contacter
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingSoul(soul);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const loadAssignedSouls = async () => {
    if (!user) return;

    try {
      const usersData = await getDocs(supabase)
        .from('users')
        .select('*')
        .eq('uid', user.uid)
        .eq('status', 'active');

      if (usersError) throw usersError;

      if (usersData && usersData.length > 0) {
        const userData = usersData[0];
        const currentUserId = userData.id;

        const hasShepherdProfile = userData.businessProfiles?.some((profile: any) =>
          profile.type === 'shepherd' && profile.isActive
        );
        const hasOldShepherdRole = userData.role === 'shepherd' || userData.role === 'intern' || userData.role === 'adn';

        if (hasShepherdProfile || hasOldShepherdRole) {
          setShepherdId(currentUserId);

          const soulsData = await getDocs(supabase)
            .from('souls')
            .select('*')
            .eq('shepherd_id', currentUserId)
            .eq('status', 'active');

          if (soulsError) throw soulsError;

          const loaded = (soulsData ?? []) as Soul[];
          setSouls(loaded);

          if (loaded.length > 0) {
            await loadLastContacts(loaded.map((s) => s.id));
          }
        } else {
          toast.error('Profil berger requis pour voir les âmes assignées');
        }
      } else {
        toast.error('Utilisateur non trouvé');
      }
    } catch (error) {
      console.error('Error loading souls:', error);
      toast.error('Erreur lors du chargement des âmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedSouls();
  }, [user]);

  const filteredSouls = useMemo(
    () =>
      souls.filter(
        (soul) =>
          soul.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          soul.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          soul.location.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [souls, searchTerm]
  );

  const sortedSouls = useMemo(() => {
    const arr = [...filteredSouls];
    if (sortField === 'fullName') {
      arr.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else {
      // lastContact croissant : jamais contactés en premier, puis plus anciens
      arr.sort((a, b) => {
        const da = lastContactMap.get(a.id);
        const dbb = lastContactMap.get(b.id);
        if (!da && !dbb) return 0;
        if (!da) return -1;
        if (!dbb) return 1;
        return da.getTime() - dbb.getTime();
      });
    }
    return arr;
  }, [filteredSouls, sortField, lastContactMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Mes Âmes Assignées</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Trier par :</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="lastContact">Dernier contact</option>
            <option value="fullName">Nom</option>
          </select>
        </div>
      </div>

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

      <CustomTable data={sortedSouls} columns={columns} />

      {editingSoul && shepherdId && (
        <EditSoulModal
          soul={editingSoul}
          isOpen={!!editingSoul}
          onClose={() => setEditingSoul(null)}
          onUpdate={() => {
            setEditingSoul(null);
            loadAssignedSouls();
          }}
        />
      )}

      {interactingSoul && shepherdId && (
        <InteractionModal
          isOpen={!!interactingSoul}
          onClose={() => {
            setInteractingSoul(null);
            // Recharger les dernières interactions après fermeture
            if (souls.length > 0) loadLastContacts(souls.map((s) => s.id));
          }}
          soulId={interactingSoul.id}
          shepherdId={shepherdId}
          soulName={interactingSoul.fullName}
        />
      )}
    </div>
  );
}
