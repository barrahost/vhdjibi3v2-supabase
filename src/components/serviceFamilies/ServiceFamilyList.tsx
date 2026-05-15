import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ServiceFamilyListItem from './ServiceFamilyListItem';
import EditServiceFamilyModal from './EditServiceFamilyModal';
import { Search, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    const q = query(collection(db, 'serviceFamilies'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFamilies(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ServiceFamily)));
    });

    return () => unsubscribe();
  }, []);

  const handleMove = async (familyId: string, direction: 'up' | 'down') => {
    try {
      setReordering(true);
      const currentIndex = families.findIndex(d => d.id === familyId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= families.length) return;

      const batch = writeBatch(db);
      const currentFamily = families[currentIndex];
      const targetFamily = families[newIndex];

      batch.update(doc(db, 'serviceFamilies', currentFamily.id), {
        order: targetFamily.order,
        updatedAt: new Date()
      });

      batch.update(doc(db, 'serviceFamilies', targetFamily.id), {
        order: currentFamily.order,
        updatedAt: new Date()
      });

      await batch.commit();
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
        />
      )}
    </div>
  );
}