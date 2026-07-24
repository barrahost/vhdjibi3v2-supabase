import { useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useUsersByProfile } from '../hooks/useUsersByProfile';
import { useServiceFamilies } from '../hooks/useServiceFamilies';

export default function ShepherdFamilyManagement() {
  const { users: shepherds, loading: loadingShepherds } = useUsersByProfile(['shepherd']);
  const { families, loading: loadingFamilies, error } = useServiceFamilies(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loading = loadingShepherds || loadingFamilies;

  // Famille actuelle de chaque berger (le premier shepherd_ids qui le contient)
  const familyByShepherd = useMemo(() => {
    const map: Record<string, string> = {};
    families.forEach(f => {
      (f.shepherdIds || []).forEach(id => {
        if (!map[id]) map[id] = f.id;
      });
    });
    return map;
  }, [families, refreshKey]);

  const filteredShepherds = shepherds
    .filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const handleAssign = async (shepherdId: string, newFamilyId: string) => {
    setSavingId(shepherdId);
    try {
      // Retirer ce berger de toutes les familles qui l'ont actuellement
      const currentFamilies = families.filter(f => (f.shepherdIds || []).includes(shepherdId));
      for (const fam of currentFamilies) {
        if (fam.id === newFamilyId) continue;
        const updated = (fam.shepherdIds || []).filter(id => id !== shepherdId);
        const { error: updErr } = await supabase
          .from('service_families')
          .update({ shepherd_ids: updated, updated_at: new Date().toISOString() })
          .eq('id', fam.id);
        if (updErr) throw updErr;
        fam.shepherdIds = updated;
      }

      // Ajouter à la nouvelle famille (si une famille est choisie)
      if (newFamilyId) {
        const target = families.find(f => f.id === newFamilyId);
        if (target && !(target.shepherdIds || []).includes(shepherdId)) {
          const updated = [...(target.shepherdIds || []), shepherdId];
          const { error: updErr } = await supabase
            .from('service_families')
            .update({ shepherd_ids: updated, updated_at: new Date().toISOString() })
            .eq('id', newFamilyId);
          if (updErr) throw updErr;
          target.shepherdIds = updated;
        }
      }

      setRefreshKey(k => k + 1);
      toast.success('Berger réaffecté');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la réaffectation');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des bergers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        Erreur lors du chargement des familles de service.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#00665C]" /> Bergers &amp; Familles
        </h1>
        <p className="text-sm text-gray-400">{shepherds.length} berger{shepherds.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Répartissez chaque berger dans une famille de service. Le responsable de famille verra ensuite
          ses bergers et pourra leur assigner des âmes.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un berger..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredShepherds.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Aucun berger trouvé.</div>
        ) : (
          <ul className="divide-y">
            {filteredShepherds.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {s.fullName}{s.nickname ? ` (${s.nickname})` : ''}
                  </p>
                  {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                </div>
                <select
                  value={familyByShepherd[s.id] || ''}
                  onChange={(e) => handleAssign(s.id, e.target.value)}
                  disabled={savingId === s.id}
                  className="flex-shrink-0 w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#00665C] focus:border-[#00665C] disabled:opacity-50"
                >
                  <option value="">Aucune famille</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
