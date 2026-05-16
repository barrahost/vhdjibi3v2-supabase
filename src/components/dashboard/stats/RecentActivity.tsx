import { useEffect, useState } from 'react';
import { formatDate } from '../../../utils/dateUtils';
import { Soul, Interaction } from '../../../types/database.types';
import { supabase } from '../../../lib/supabase';

export function RecentActivity() {
  const [recentSouls, setRecentSouls] = useState<Soul[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      const [{ data: soulsRaw }, { data: interactionsRaw }] = await Promise.all([
        supabase.from('souls').select('id, full_name, location, shepherd_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('interactions').select('id, type, date, notes, soul_id, shepherd_id').order('date', { ascending: false }).limit(5),
      ]);

      setRecentSouls((soulsRaw ?? []).map((r: any) => ({
        id: r.id,
        fullName: r.full_name || '',
        location: r.location,
        shepherdId: r.shepherd_id,
      } as unknown as Soul)));

      setRecentInteractions((interactionsRaw ?? []).map((r: any) => ({
        id: r.id,
        type: r.type,
        date: r.date ? new Date(r.date) : new Date(),
        notes: r.notes,
        soulId: r.soul_id,
        shepherdId: r.shepherd_id,
      } as unknown as Interaction)));
    };
    fetchRecentActivity();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">Âmes récemment ajoutées</h2>
        <div className="space-y-4">
          {recentSouls.map(soul => (
            <div key={soul.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{soul.fullName}</p>
                <p className="text-sm text-gray-500">{soul.location}</p>
              </div>
              {(soul as any).shepherdId ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Assignée</span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Non assignée</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">Interactions récentes</h2>
        <div className="space-y-4">
          {recentInteractions.map(interaction => (
            <div key={interaction.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {interaction.type === 'call' ? 'Appel' : interaction.type === 'visit' ? 'Visite' : 'Message'}
                </p>
                <p className="text-sm text-gray-500">{formatDate(interaction.date)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                interaction.type === 'call' ? 'bg-blue-100 text-blue-800' :
                interaction.type === 'visit' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {interaction.type === 'call' ? 'Appel' : interaction.type === 'visit' ? 'Visite' : 'Message'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
