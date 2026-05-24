import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';

interface EvangelizedSoul {
  id: string;
  evangelistId?: string;
  status?: string;
  evangelizationDate?: string;
}

interface UserDoc {
  id: string;
  fullName?: string;
}

export function EvangelizationStats() {
  const [evangelizedSouls, setEvangelizedSouls] = useState<EvangelizedSoul[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: soulsRaw, error: soulsErr }, { data: usersRaw, error: usersErr }] = await Promise.all([
          supabase.from('evangelized_souls').select('id, evangelist_id, status, evangelization_date').eq('church_id', getChurchId()),
          supabase.from('users').select('id, full_name').eq('church_id', getChurchId()).eq('status', 'active'),
        ]);

        if (soulsErr) throw soulsErr;
        if (usersErr) throw usersErr;

        setEvangelizedSouls((soulsRaw ?? []).map((r: any) => ({
          id: r.id,
          evangelistId: r.evangelist_id,
          status: r.status,
          evangelizationDate: r.evangelization_date,
        })));
        setUsers((usersRaw ?? []).map((r: any) => ({ id: r.id, fullName: r.full_name })));
        setLoading(false);
      } catch (error) {
        console.error('Error loading evangelization stats:', error);
        toast.error('Erreur lors du chargement des âmes évangélisées');
        setLoading(false);
      }
    };

    loadData();

    // Realtime
    const channel = supabase
      .channel('evangelized-souls-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evangelized_souls' }, async () => {
        const { data } = await supabase.from('evangelized_souls').select('id, evangelist_id, status, evangelization_date').eq('church_id', getChurchId());
        setEvangelizedSouls((data ?? []).map((r: any) => ({
          id: r.id, evangelistId: r.evangelist_id, status: r.status, evangelizationDate: r.evangelization_date
        })));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const total = evangelizedSouls.length;
    const imported = evangelizedSouls.filter(s => s.status === 'imported').length;
    const pending = evangelizedSouls.filter(s => s.status === 'active').length;
    const conversionRate = total > 0 ? Math.round((imported / total) * 100) : 0;
    const withoutEvangelist = evangelizedSouls.filter(s => !s.evangelistId).length;

    const byEvangelist = evangelizedSouls.reduce((acc, soul) => {
      if (!soul.evangelistId) return acc;
      if (!acc[soul.evangelistId]) acc[soul.evangelistId] = { total: 0, imported: 0 };
      acc[soul.evangelistId].total++;
      if (soul.status === 'imported') acc[soul.evangelistId].imported++;
      return acc;
    }, {} as Record<string, { total: number; imported: number }>);

    const evangelistRanking = Object.entries(byEvangelist)
      .map(([evangelistId, data]) => {
        const u = users.find(x => x.id === evangelistId);
        return {
          evangelistId,
          fullName: u?.fullName || 'Inconnu',
          total: data.total,
          imported: data.imported,
          conversionRate: data.total > 0 ? Math.round((data.imported / data.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('fr-FR', { month: 'short' });
      const monthSouls = evangelizedSouls.filter(s => {
        if (!s.evangelizationDate) return false;
        const date = new Date(s.evangelizationDate);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      });
      return { label, evangelized: monthSouls.length, imported: monthSouls.filter(s => s.status === 'imported').length };
    });

    return { total, imported, pending, conversionRate, withoutEvangelist, evangelistRanking, monthlyData };
  }, [evangelizedSouls, users]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"><div className="h-16" /></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total âmes évangélisées" value={stats.total} icon={Users} trend={`${stats.total}`} trendLabel="enregistrées" />
        <StatCard title="Reçues dans l'église" value={stats.imported} icon={UserCheck} trend={`${stats.conversionRate}%`} trendLabel="du total" iconClassName="text-green-600" />
        <StatCard title="En attente de suivi" value={stats.pending} icon={Clock} trend={`${stats.total ? ((stats.pending / stats.total) * 100).toFixed(1) : '0'}%`} trendLabel="du total" iconClassName="text-orange-600" />
        <StatCard title="Taux de conversion" value={stats.conversionRate} icon={TrendingUp} trend={`${stats.imported}/${stats.total}`} trendLabel="reçues" iconClassName="text-blue-600" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Activité — 6 derniers mois</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" /><YAxis allowDecimals={false} />
            <Tooltip /><Legend />
            <Bar dataKey="evangelized" name="Évangélisées" fill="#0F6E56" />
            <Bar dataKey="imported" name="Reçues" fill="#1D9E75" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b"><h3 className="text-sm font-semibold text-gray-700">Classement des évangélistes</h3></div>
        <div className="overflow-x-auto">
          {stats.evangelistRanking.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Aucun évangéliste avec des âmes enregistrées.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Évangéliste</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Reçues</th>
                  <th className="px-4 py-2 text-right">Taux</th>
                  <th className="px-4 py-2 text-left">Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.evangelistRanking.map(ev => (
                  <tr key={ev.evangelistId}>
                    <td className="px-4 py-2 font-medium text-gray-800">{ev.fullName}</td>
                    <td className="px-4 py-2 text-right">{ev.total}</td>
                    <td className="px-4 py-2 text-right">{ev.imported}</td>
                    <td className="px-4 py-2 text-right">{ev.conversionRate}%</td>
                    <td className="px-4 py-2">
                      <div className="w-28 bg-gray-200 rounded h-2">
                        <div style={{ width: `${ev.conversionRate}%`, background: '#00665C', height: '8px', borderRadius: '4px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {stats.withoutEvangelist > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-800">{stats.withoutEvangelist} âme(s) sans évangéliste assigné</p>
          <p className="text-sm text-amber-600">Ces âmes n'ont pas de responsable de suivi.</p>
        </div>
      )}
    </div>
  );
}
