import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Soul } from '../types/database.types';
import { formatDate } from '../utils/dateUtils';
import { AlertTriangle, ChevronDown, ChevronUp, MessageCircle, Users, Clock } from 'lucide-react';
import { StatCard } from '../components/dashboard/stats/StatCard';
import { isShepherdUser } from '../utils/roleHelpers';
import toast from 'react-hot-toast';

interface ShepherdReminder {
  shepherd: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
  };
  souls: {
    soul: Soul;
    lastInteraction: Date | null;
    daysWithoutInteraction: number;
  }[];
}

export default function ShepherdReminders() {
  const [reminders, setReminders] = useState<ShepherdReminder[]>([]);
  const [expandedShepherds, setExpandedShepherds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShepherds: 0,
    totalSouls: 0,
    needingAttention: 0,
    averageDays: 0
  });

  useEffect(() => {
    const loadReminders = async () => {
      try {
        // Charger tous les utilisateurs actifs puis filtrer côté client
        // afin d'inclure les bergers multi-casquettes (businessProfiles)
        const shepherdsQuery = query(
          collection(db, 'users'),
          where('status', '==', 'active')
        );
        const shepherdsSnapshot = await getDocs(shepherdsQuery);
        const shepherds = shepherdsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(u => isShepherdUser(u));

        const remindersData: ShepherdReminder[] = [];
        let totalSouls = 0;
        let totalNeedingAttention = 0;
        let totalDays = 0;
        let totalSoulsWithInteractions = 0;

        // Charger les données en parallèle pour chaque berger
        await Promise.all(shepherds.map(async (shepherd) => {
          // Créer un index composé pour optimiser les requêtes
          // shepherdId, status, createdAt DESC
          const soulsQuery = query(
            collection(db, 'souls'),
            where('shepherdId', '==', shepherd.id),
            where('status', '==', 'active')
          );
          const soulsSnapshot = await getDocs(soulsQuery);
          const souls = soulsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Soul[];

          totalSouls += souls.length;

          if (souls.length === 0) return;

          // Créer un index composé pour optimiser les requêtes
          // shepherdId, date DESC
          const interactionsQuery = query(
            collection(db, 'interactions'),
            where('shepherdId', '==', shepherd.id)
          );
          const interactionsSnapshot = await getDocs(interactionsQuery);
          const interactions = interactionsSnapshot.docs.map(doc => ({
            ...doc.data(),
            date: doc.data().date.toDate()
          }));

          // Calculer les jours sans interaction pour chaque âme
          const soulsWithInteractions = souls.map(soul => {
            const soulInteractions = interactions.filter((i: any) => i.soulId === soul.id);
            const lastInteraction = soulInteractions.length > 0
              ? new Date(Math.max(...soulInteractions.map(i => i.date.getTime())))
              : null;
            
            const daysWithoutInteraction = lastInteraction
              ? Math.floor((new Date().getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
              : Infinity;
            
            if (lastInteraction) {
              totalDays += daysWithoutInteraction;
              totalSoulsWithInteractions++;
            }

            return {
              soul,
              lastInteraction,
              daysWithoutInteraction
            };
          });

          // Filtrer pour ne garder que les âmes nécessitant attention (5 jours ou plus)
          const soulsNeedingAttention = soulsWithInteractions.filter(
            s => s.daysWithoutInteraction >= 5
          );

          if (soulsNeedingAttention.length > 0) {
            remindersData.push({
              shepherd: {
                id: shepherd.id,
                fullName: (shepherd as any).fullName || shepherd.id,
                phone: (shepherd as any).phone,
                email: (shepherd as any).email
              },
              souls: soulsNeedingAttention.sort((a, b) => b.daysWithoutInteraction - a.daysWithoutInteraction)
            });
            totalNeedingAttention += soulsNeedingAttention.length;
          }
        }));

        setStats({
          totalShepherds: shepherds.length,
          totalSouls,
          needingAttention: totalNeedingAttention,
          averageDays: totalSoulsWithInteractions > 0 
            ? Math.round(totalDays / totalSoulsWithInteractions) 
            : 0
        });

        setReminders(remindersData);
      } catch (error) {
        console.error('Error loading reminders:', error);
        toast.error('Erreur lors du chargement des rappels');
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, []);

  const toggleShepherd = (shepherdId: string) => {
    setExpandedShepherds(prev =>
      prev.includes(shepherdId)
        ? prev.filter(id => id !== shepherdId)
        : [...prev, shepherdId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des rappels...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rappels des Berger(e)s</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total des berger(e)s"
          value={stats.totalShepherds}
          icon={Users}
          trend={`${stats.totalShepherds}`}
          trendLabel="berger(e)s"
          iconClassName="text-blue-600"
        />
        <StatCard
          title="Âmes nécessitant attention"
          value={stats.needingAttention}
          icon={AlertTriangle}
          trend={`${((stats.needingAttention / stats.totalSouls) * 100).toFixed(1)}%`}
          trendLabel="des âmes"
          iconClassName="text-amber-600"
        />
        <StatCard
          title="Délai moyen"
          value={stats.averageDays}
          icon={Clock}
          trend="jours"
          trendLabel="sans interaction"
          iconClassName="text-purple-600"
        />
      </div>

      {/* Liste des rappels */}
      <div className="space-y-4">
        {reminders.map(({ shepherd, souls }) => (
          <div key={shepherd.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <button
              onClick={() => toggleShepherd(shepherd.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{shepherd.fullName}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {souls.length} âme{souls.length > 1 ? 's' : ''} à suivre
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {shepherd.phone} • {shepherd.email}
                </p>
              </div>
              {expandedShepherds.includes(shepherd.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedShepherds.includes(shepherd.id) && (
              <div className="border-t divide-y">
                {souls.map(({ soul, lastInteraction, daysWithoutInteraction }) => (
                  <div key={soul.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{soul.fullName}</h4>
                        <p className="text-sm text-gray-500">{soul.phone}</p>
                        <p className="text-sm text-gray-500 mt-1">{soul.location}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          daysWithoutInteraction >= 7
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {daysWithoutInteraction} jours
                        </span>
                        <button className="mt-2 flex items-center text-[#00665C] hover:text-[#00665C]/80">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">Contacter</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <AlertTriangle className={`w-4 h-4 mr-1.5 ${
                        daysWithoutInteraction >= 7
                          ? 'text-red-500'
                          : 'text-amber-500'
                      }`} />
                      {lastInteraction ? (
                        <>
                          Dernière interaction le {formatDate(lastInteraction)}
                        </>
                      ) : (
                        "Aucune interaction enregistrée"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="bg-gray-50 rounded-lg border p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">
              Aucun rappel pour le moment. Tous les bergers sont à jour dans leurs interactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}