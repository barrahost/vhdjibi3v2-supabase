import { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Soul } from '../../../types/database.types';
import { TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface WeeklyData {
  week: string;
  count: number;
  cumulative: number;
}

export function SoulEvolutionChart() {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvolutionData = async () => {
      try {
        // Récupérer toutes les âmes enregistrées (sans filtre de statut)
        const soulsQuery = query(collection(db, 'souls'));
        const soulsSnapshot = await getDocs(soulsQuery);
        const allSouls = soulsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Soul[];

        // Utiliser toutes les âmes enregistrées pour l'évolution
        const souls = allSouls;

        // Créer les données pour les 13 dernières semaines (environ 3 mois)
        const weeklyData: WeeklyData[] = [];
        const now = new Date();
        
        for (let i = 12; i >= 0; i--) {
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - (i * 7));
          weekEnd.setHours(23, 59, 59, 999);
          
          const weekStart = new Date(weekEnd);
          weekStart.setDate(weekEnd.getDate() - 6);
          weekStart.setHours(0, 0, 0, 0);
          
          // Compter les âmes créées dans cette semaine
          const weekCount = souls.filter(soul => {
            const createdAt = soul.createdAt instanceof Date ? soul.createdAt : new Date(soul.createdAt);
            return createdAt >= weekStart && createdAt <= weekEnd;
          }).length;

          // Compter le total cumulé jusqu'à cette semaine
          const cumulativeCount = souls.filter(soul => {
            const createdAt = soul.createdAt instanceof Date ? soul.createdAt : new Date(soul.createdAt);
            return createdAt <= weekEnd;
          }).length;

          // Format de la semaine (ex: "S23 2024" pour semaine 23 de 2024)
          const weekNumber = getWeekNumber(weekEnd);
          const year = weekEnd.getFullYear();
          
          weeklyData.push({
            week: `S${weekNumber} ${year}`,
            count: weekCount,
            cumulative: cumulativeCount
          });
        }

        setData(weeklyData);
      } catch (error) {
        console.error('Error fetching soul evolution data:', error);
        toast.error('Erreur lors du chargement des données d\'évolution');
      } finally {
        setLoading(false);
      }
    };

    fetchEvolutionData();
  }, []);

  // Fonction pour calculer le numéro de semaine
  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-[#00665C] animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const totalSouls = data[data.length - 1]?.cumulative || 0;
  const previousWeekTotal = data[data.length - 2]?.cumulative || 0;
  const growth = totalSouls - previousWeekTotal;
  const growthPercentage = previousWeekTotal > 0 ? ((growth / previousWeekTotal) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-[#00665C]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-medium text-gray-600">
            Évolution des âmes enregistrées (13 semaines)
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <TrendingUp className="w-4 h-4 text-[#00665C]" />
            <span className="text-sm text-gray-500">
              <span className="font-medium text-[#F2B636]">+{growth}</span> cette semaine
              ({growthPercentage > '0' ? '+' : ''}{growthPercentage}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-[#00665C]">{totalSouls}</div>
          <div className="text-sm text-gray-500">Total actuel</div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 10 }}
            stroke="#666"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              value as number,
              name === 'cumulative' ? 'Total cumulé' : 'Nouvelles cette semaine'
            ]}
            labelFormatter={(label) => `Semaine : ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="cumulative" 
            stroke="#00665C" 
            strokeWidth={3}
            dot={{ fill: '#00665C', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#00665C', strokeWidth: 2, fill: 'white' }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#F2B636" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#F2B636', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#F2B636', strokeWidth: 2, fill: 'white' }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="flex justify-center mt-4 space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-[#00665C]"></div>
          <span className="text-gray-600">Total cumulé</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-[#F2B636] opacity-70" style={{ borderTop: '2px dashed #F2B636' }}></div>
          <span className="text-gray-600">Nouvelles par semaine</span>
        </div>
      </div>
    </div>
  );
}