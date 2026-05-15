import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Interaction } from '../../types/database.types';
import { formatDate } from '../../utils/dateUtils';
import { Phone, Users, MessageSquare, Trash2, MessageCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface InteractionHistoryProps {
  soulId: string;
}

const interactionIcons = {
  call: Phone,
  visit: Users,
  sms: MessageCircle,
  message: MessageSquare,
  other: HelpCircle
};

const interactionLabels = {
  call: 'Appel',
  visit: 'Visite',
  sms: 'SMS',
  message: 'Message',
  other: 'Autre'
};

export default function InteractionHistory({ soulId }: InteractionHistoryProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'interactions'),
      where('soulId', '==', soulId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInteractions(snapshot.docs.map(doc => {
        const data = doc.data();
        // Convertir les timestamps Firestore en objets Date
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as Interaction;
      }));
    });

    return () => unsubscribe();
  }, [soulId]);

  const handleDelete = async (interactionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) {
      try {
        await deleteDoc(doc(db, 'interactions', interactionId));
        toast.success('Interaction supprimée avec succès');
      } catch (error) {
        console.error('Error deleting interaction:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  if (interactions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        Aucune interaction enregistrée
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {interactions.map((interaction, idx) => {
          const Icon = interactionIcons[interaction.type];
          return (
            <li key={interaction.id}>
              <div className="relative pb-8">
                {idx !== interactions.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-[#00665C]/10 flex items-center justify-center ring-8 ring-white">
                      <Icon className="h-5 w-5 text-[#00665C]" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {interactionLabels[interaction.type]}
                        </p>
                        <button
                          onClick={() => handleDelete(interaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer l'interaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {interaction.notes}
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={interaction.date.toISOString()}>
                        {formatDate(interaction.date)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}