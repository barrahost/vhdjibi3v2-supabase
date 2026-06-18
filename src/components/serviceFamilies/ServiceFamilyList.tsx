import { useState, useEffect } from 'react';

import ServiceFamilyListItem from './ServiceFamilyListItem';
import EditServiceFamilyModal from './EditServiceFamilyModal';
import { Search, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader?: string;
  leaderId?: string;
  shepherdIds?: string[];
  order: number;
}

export default function ServiceFamilyList() {
  const [families, setFamilies] = useState<ServiceFamily[]>([]);
  const [editingFamily, setEditingFamily] = useState<ServiceFamily | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reordering, setReordering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey(k => k + 1);

  useEffect(() => {
    const loadFamilies = async () => {
      const { data } = await supabase.from('service_families').select('*').eq('church_id', getChurchId()).order('order', { ascending: true });
      setFamilies((data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        leader: r.leader || '',
        leaderId: r.leader_id || '',
        shepherdIds: r.shepherd_ids || [],
        order: r.order ?? 0,
      })));
    };
    loadFamilies();
    const channel = supabase.channel('service_families_list_' + reloadKey)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_families' }, () => loadFamilies())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reloadKey]);

  const handleMove = async (familyId: string, direction: 'up' | 'down') => {
    try {
      setReordering(true);
      const currentIndex = families.findIndex(d => d.id === familyId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= families.length) return;


      const currentFamily = families[currentIndex];
      const targetFamily = families[newIndex];
      await Promise.all([
        supabase.from('service_families').update({ order: targetFamily.order, updated_at: new Date().toISOString() }).eq('id', currentFamily.id),
        supabase.from('service_families').update({ order: currentFamily.order, updated_at: new Date().toISOString() }).eq('id', targetFamily.id)
      ]);
    } catch (error) {
      console.error('Error reordering families:', error);
      toast.error('Erreur lors du réordonnancement');
    } finally {
      setReordering(false);
    }
  };

  const filteredFamilies = families.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (family.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (family.leader || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une famille..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredFamilies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune famille trouvée
            </div>
          ) : (
            filteredFamilies.map((family, index) => (
              <div key={family.id} className="flex items-center">
                <div className="flex-1">
                  <ServiceFamilyListItem
                    family={family}
                    onEdit={() => setEditingFamily(family)}
                    onDeleted={reload}
                  />
                </div>
                <div className="px-4 flex flex-col space-y-1">
                  <button
                    onClick={() => handleMove(family.id, 'up')}
                    disabled={index === 0 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Monter"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(family.id, 'down')}
                    disabled={index === filteredFamilies.length - 1 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Descendre"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingFamily && (
        <EditServiceFamilyModal
          family={editingFamily}
          isOpen={!!editingFamily}
          onClose={() => setEditingFamily(null)}
          onSuccess={() => { setEditingFamily(null); reload(); }}
        />
      )}
    </div>
  );
}