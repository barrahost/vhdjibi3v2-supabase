import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyLeaderService } from '../../services/familyLeader.service';
import type { ServiceFamily, Soul } from '../../types/database.types';
import { Heart, Users, UserPlus, AlertCircle, BarChart3, Search } from 'lucide-react';
import PendingActionsWidget from './PendingActionsWidget';
import { StatCard } from './stats/StatCard';
import toast from 'react-hot-toast';

export default function FamilyLeaderDashboard() {
  const { user } = useAuth();
  const [family, setFamily] = useState<ServiceFamily | null>(null);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [shepherds, setShepherds] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const userId = user?.id || user?.uid;

  const load = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const fam = await FamilyLeaderService.getFamilyByLeaderId(userId);
      setFamily(fam);
      if (fam) {
        const [s, sh] = await Promise.all([
          FamilyLeaderService.getSoulsByFamilyId(fam.id),
          FamilyLeaderService.getShepherdsOfFamily(fam.shepherdIds || []),
        ]);
        setSouls(s);
        setShepherds(sh);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement de votre famille');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const stats = useMemo(() => {
    const total = souls.length;
    const assigned = souls.filter(s => s.shepherdId).length;
    return { total, assigned, unassigned: total - assigned };
  }, [souls]);

  // Filtre par nom ou téléphone
  const filteredSouls = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return souls;
    return souls.filter(s =>
      s.fullName?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.nickname?.toLowerCase().includes(q)
    );
  }, [souls, search]);

  // Tri : non assignées en premier, puis assignées (ordre alphabétique dans chaque groupe)
  const unassignedSouls = useMemo(
    () =>
      filteredSouls
        .filter(s => !s.shepherdId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [filteredSouls]
  );
  const assignedSouls = useMemo(
    () =>
      filteredSouls
        .filter(s => s.shepherdId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [filteredSouls]
  );

  // Charge par berger (calculée côté client)
  const shepherdLoad = useMemo(() => {
    const counts = new Map<string, number>();
    souls.forEach(s => {
      if (s.shepherdId) counts.set(s.shepherdId, (counts.get(s.shepherdId) || 0) + 1);
    });
    const rows = shepherds.map(sh => ({
      id: sh.id,
      fullName: sh.fullName,
      count: counts.get(sh.id) || 0,
    }));
    rows.sort((a, b) => b.count - a.count || a.fullName.localeCompare(b.fullName));
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return { rows, max };
  }, [souls, shepherds]);

  const handleAssign = async (soulId: string, shepherdId: string) => {
    try {
      setSavingId(soulId);
      await FamilyLeaderService.assignShepherdToSoul(soulId, shepherdId || null);
      toast.success('Berger assigné');
      setSouls(prev => prev.map(s => s.id === soulId ? { ...s, shepherdId: shepherdId || undefined } : s));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'assignation");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }

  if (!family) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-amber-900">Aucune famille assignée</h2>
        <p className="text-sm text-amber-800 mt-1">
          Vous n'êtes responsable d'aucune famille de service. Contactez un administrateur.
        </p>
      </div>
    );
  }

  const renderSoulRow = (soul: Soul) => (
    <div key={soul.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {soul.fullName}
          {soul.nickname && <span className="text-gray-500 font-normal"> ({soul.nickname})</span>}
        </div>
        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
          {soul.originSource && (
            <span className="px-2 py-0.5 bg-gray-100 rounded">
              {soul.originSource === 'culte' ? 'Culte' : 'Évangélisation'}
            </span>
          )}
          <span>📞 {soul.phone}</span>
          <span>📍 {soul.location}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={soul.shepherdId || ''}
          onChange={(e) => handleAssign(soul.id, e.target.value)}
          disabled={savingId === soul.id || shepherds.length === 0}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="">-- Non assigné --</option>
          {shepherds.map(sh => (
            <option key={sh.id} value={sh.id}>{sh.fullName}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Famille : {family.name}</h1>
        {family.description && <p className="text-sm text-gray-500 mt-1">{family.description}</p>}
      </div>

      <PendingActionsWidget role="family_leader" familyId={family.id} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total âmes"
          value={stats.total}
          icon={Heart}
          trend={`${stats.total}`}
          trendLabel="âmes dans la famille"
          iconClassName="text-[#00665C]"
        />
        <StatCard
          title="Assignées à un berger"
          value={stats.assigned}
          icon={Users}
          trend={stats.total ? `${Math.round((stats.assigned / stats.total) * 100)}%` : '0%'}
          trendLabel="du total"
          iconClassName="text-green-600"
        />
        <StatCard
          title="Sans berger"
          value={stats.unassigned}
          icon={UserPlus}
          trend={stats.total ? `${Math.round((stats.unassigned / stats.total) * 100)}%` : '0%'}
          trendLabel="à assigner"
          iconClassName="text-amber-600"
        />
      </div>

      {/* Répartition des bergers */}
      {shepherds.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00665C]" />
            <h2 className="font-semibold text-gray-900">Répartition des bergers</h2>
          </div>
          <div className="divide-y">
            {shepherdLoad.rows.map(r => {
              const pct = shepherdLoad.max > 0 ? Math.round((r.count / shepherdLoad.max) * 100) : 0;
              return (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-40 sm:w-56 truncate text-sm text-gray-900 flex items-center gap-2">
                    <span className="truncate">{r.fullName}</span>
                    {r.count === 0 && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Disponible
                      </span>
                    )}
                  </div>
                  <div className="w-16 text-sm text-gray-600 tabular-nums">{r.count} âme{r.count > 1 ? 's' : ''}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00665C] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs text-gray-500 tabular-nums">{pct}%</div>
                </div>
              );
            })}
            {stats.unassigned > 0 && (
              <div className="px-4 py-3 flex items-center gap-3 bg-amber-50/40">
                <div className="w-40 sm:w-56 truncate text-sm text-amber-800 italic">Non assignées</div>
                <div className="w-16 text-sm text-amber-700 tabular-nums">
                  {stats.unassigned} âme{stats.unassigned > 1 ? 's' : ''}
                </div>
                <div className="flex-1 h-2 bg-amber-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${shepherdLoad.max > 0 ? Math.min(100, Math.round((stats.unassigned / shepherdLoad.max) * 100)) : 100}%` }}
                  />
                </div>
                <div className="w-12" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des âmes */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Âmes de la famille</h2>
          {souls.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou téléphone..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
          )}
        </div>

        {souls.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Aucune âme assignée à cette famille pour le moment.
          </div>
        ) : filteredSouls.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Aucune âme ne correspond à « {search} ».
          </div>
        ) : (
          <>
            {unassignedSouls.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    À assigner ({unassignedSouls.length})
                  </span>
                </div>
                <div className="divide-y">
                  {unassignedSouls.map(renderSoulRow)}
                </div>
              </div>
            )}
            {assignedSouls.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Assignées ({assignedSouls.length})
                  </span>
                </div>
                <div className="divide-y">
                  {assignedSouls.map(renderSoulRow)}
                </div>
              </div>
            )}
          </>
        )}

        {shepherds.length === 0 && (
          <div className="px-4 py-3 bg-amber-50 text-sm text-amber-800 border-t">
            ⚠️ Aucun berger n'est rattaché à votre famille. Contactez un administrateur pour en ajouter.
          </div>
        )}
      </div>
    </div>
  );
}
