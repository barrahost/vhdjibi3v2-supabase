import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Soul, Interaction } from '../types/database.types';
import { Calendar } from '../components/reminders/Calendar';
import { RemindersList } from '../components/reminders/RemindersList';
import { ReminderStats } from '../components/reminders/ReminderStats';
import { isShepherdUser } from '../utils/roleHelpers';
import toast from 'react-hot-toast';

export default function Reminders() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'stats'>('list');
  const { user } = useAuth();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Récupérer l'ID de l'utilisateur (berger ou multi-casquettes incluant berger)
        const shepherdsQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('status', '==', 'active')
        );
        const shepherdDoc = await getDocs(shepherdsQuery);
        const matched = shepherdDoc.docs.find(d => isShepherdUser(d.data() as any));

        if (matched) {
          const shepherdId = matched.id;
          
          // Récupérer les âmes assignées
          const soulsQuery = query(
            collection(db, 'souls'),
            where('shepherdId', '==', shepherdId),
            where('status', '==', 'active')
          );
          const soulsSnapshot = await getDocs(soulsQuery);
          const soulsData = soulsSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as Soul));
          setSouls(soulsData);

          // Récupérer les interactions
          const interactionsQuery = query(
            collection(db, 'interactions'),
            where('shepherdId', '==', shepherdId)
          );
          const interactionsSnapshot = await getDocs(interactionsQuery);
          const interactionsData = interactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate()
          } as Interaction));
          setInteractions(interactionsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rappels</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'list'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'calendar'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'stats'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Mes Statistiques
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <RemindersList souls={souls} interactions={interactions} />
      )}
      
      {activeTab === 'calendar' && (
        <Calendar souls={souls} interactions={interactions} />
      )}
      
      {activeTab === 'stats' && (
        <ReminderStats souls={souls} interactions={interactions} />
      )}
    </div>
  );
}