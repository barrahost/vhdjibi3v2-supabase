import { useState, useEffect } from 'react';

import type { Department } from '../../types/department.types';
import DepartmentListItem from './DepartmentListItem';
import EditDepartmentModal from './EditDepartmentModal';
import { Search, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface DepartmentListProps {
  reloadSignal?: number;
}

export default function DepartmentList({ reloadSignal = 0 }: DepartmentListProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reordering, setReordering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey(k => k + 1);

  useEffect(() => {
    const loadDepts = async () => {
      const { data } = await supabase.from('departments').select('*').eq('church_id', getChurchId()).order('order', { ascending: true });
      setDepartments((data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        leader: r.leader || '',
        leaderId: r.leader_id || '',
        order: r.order ?? 0,
        status: r.status || 'active',
        createdAt: r.created_at || null,
        updatedAt: r.updated_at || null,
      })));
    };
    loadDepts();
    const channel = supabase.channel('departments_list_' + reloadKey)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => loadDepts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reloadKey, reloadSignal]);

  const handleMove = async (departmentId: string, direction: 'up' | 'down') => {
    try {
      setReordering(true);
      const currentIndex = departments.findIndex(d => d.id === departmentId);
      if (currentIndex === -1) return;
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= departments.length) return;
      const currentDept = departments[currentIndex];
      const targetDept = departments[newIndex];
      await Promise.all([
        supabase.from('departments').update({ order: targetDept.order, updated_at: new Date().toISOString() }).eq('id', currentDept.id),
        supabase.from('departments').update({ order: currentDept.order, updated_at: new Date().toISOString() }).eq('id', targetDept.id)
      ]);
    } catch (error) {
      console.error('Error reordering departments:', error);
      toast.error('Erreur lors du réordonnancement');
    } finally {
      setReordering(false);
    }
  };

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un département..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredDepartments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun département trouvé
            </div>
          ) : (
            filteredDepartments.map((department, index) => (
              <div key={department.id} className="flex items-center">
                <div className="flex-1">
                  <DepartmentListItem
                    department={department}
                    onEdit={() => setEditingDepartment(department)}
                    onDeleted={reload}
                  />
                </div>
                <div className="px-4 flex flex-col space-y-1">
                  <button
                    onClick={() => handleMove(department.id, 'up')}
                    disabled={index === 0 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Monter"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(department.id, 'down')}
                    disabled={index === filteredDepartments.length - 1 || reordering}
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

      {editingDepartment && (
        <EditDepartmentModal
          department={editingDepartment}
          isOpen={!!editingDepartment}
          onClose={() => setEditingDepartment(null)}
          onSuccess={() => { setEditingDepartment(null); reload(); }}
        />
      )}
    </div>
  );
}