import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Department } from '../../types/department.types';
import DepartmentListItem from './DepartmentListItem';
import EditDepartmentModal from './EditDepartmentModal';
import { Search, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'departments'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Department)));
    });

    return () => unsubscribe();
  }, []);

  const handleMove = async (departmentId: string, direction: 'up' | 'down') => {
    try {
      setReordering(true);
      const currentIndex = departments.findIndex(d => d.id === departmentId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= departments.length) return;

      // Swap orders
      const batch = writeBatch(db);
      const currentDept = departments[currentIndex];
      const targetDept = departments[newIndex];

      batch.update(doc(db, 'departments', currentDept.id), {
        order: targetDept.order,
        updatedAt: new Date()
      });

      batch.update(doc(db, 'departments', targetDept.id), {
        order: currentDept.order,
        updatedAt: new Date()
      });

      await batch.commit();
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
        />
      )}
    </div>
  );
}