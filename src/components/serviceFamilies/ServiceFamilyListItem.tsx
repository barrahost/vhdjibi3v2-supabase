import { useEffect, useState } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Pencil, Trash2, Users, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader?: string;
  leaderId?: string;
  shepherdIds?: string[];
}

interface ServiceFamilyListItemProps {
  family: ServiceFamily;
  onEdit: () => void;
}

export default function ServiceFamilyListItem({ family, onEdit }: ServiceFamilyListItemProps) {
  const [leaderName, setLeaderName] = useState<string | null>(null);

  useEffect(() => {
    const loadLeader = async () => {
      if (!family.leaderId) {
        setLeaderName(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', family.leaderId));
        if (snap.exists()) {
          setLeaderName(snap.data().fullName || null);
        }
      } catch (err) {
        console.error('Error loading leader:', err);
      }
    };
    loadLeader();
  }, [family.leaderId]);

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette famille ?')) {
      try {
        await deleteDoc(doc(db, 'serviceFamilies', family.id));
        toast.success('Famille supprimée avec succès');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const displayedLeader = leaderName || family.leader;
  const shepherdCount = family.shepherdIds?.length || 0;

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">{family.name}</h3>
            {displayedLeader && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                <UserCheck className="w-3 h-3 mr-1" />
                {displayedLeader}
              </span>
            )}
            {shepherdCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <Users className="w-3 h-3 mr-1" />
                {shepherdCount} berger{shepherdCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {family.description && (
            <p className="mt-1 text-sm text-gray-500">{family.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
