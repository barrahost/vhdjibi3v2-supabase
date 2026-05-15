import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { formatDate } from '../../../utils/dateUtils';
import { Soul, Interaction } from '../../../types/database.types';

export function RecentActivity() {
  const [recentSouls, setRecentSouls] = useState<Soul[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      // Récupérer les âmes récentes
      const recentSoulsQuery = query(
        collection(db, 'souls'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSoulsSnapshot = await getDocs(recentSoulsQuery);
      const soulsData = recentSoulsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Soul[];

      // Récupérer les interactions récentes
      const recentInteractionsQuery = query(
        collection(db, 'interactions'),
        orderBy('date', 'desc'),
        limit(5)
      );
      const recentInteractionsSnapshot = await getDocs(recentInteractionsQuery);
      const interactionsData = recentInteractionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Interaction[];

      setRecentSouls(soulsData);
      setRecentInteractions(interactionsData);
    };

    fetchRecentActivity();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">
          Âmes récemment ajoutées
        </h2>
        <div className="space-y-4">
          {recentSouls.map(soul => (
            <div key={soul.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{soul.fullName}</p>
                <p className="text-sm text-gray-500">{soul.location}</p>
              </div>
              {soul.shepherdId ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Assignée
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Non assignée
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">
          Interactions récentes
        </h2>
        <div className="space-y-4">
          {recentInteractions.map(interaction => (
            <div key={interaction.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {interaction.type === 'call' ? 'Appel' :
                   interaction.type === 'visit' ? 'Visite' : 'Message'}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(interaction.date)}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                interaction.type === 'call' ? 'bg-blue-100 text-blue-800' :
                interaction.type === 'visit' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {interaction.type === 'call' ? 'Appel' :
                 interaction.type === 'visit' ? 'Visite' : 'Message'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}