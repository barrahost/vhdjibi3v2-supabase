import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyLeaderService } from '../../services/familyLeader.service';
import type { ServiceFamily, Soul } from '../../types/database.types';
import type { Servant } from '../../types/servant.types';
import { useDepartments } from '../../hooks/useDepartments';
import { Heart, Users, UserPlus, AlertCircle, BarChart3, Search, HelpCircle, Briefcase } from 'lucide-react';
import PendingActionsWidget from './PendingActionsWidget';
import { StatCard } from './stats/StatCard';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import toast from 'react-hot-toast';

// Membre unifié : une âme ou un B.O.S.S rattaché à la famille — tous deux
// comptent comme "membre de la famille".
interface FamilyMember {
  id: string;
  kind: 'soul' | 'servant';
  fullName: string;
  nickname?: string;
  phone?: string;
  location?: string;
  originSource?: string;
  departmentIds?: string[];
  shepherdId?: string;
}

export default function FamilyLeaderDashboard() {
  const { user } = useAuth();
  const { departments } = useDepartments();
  const [family, setFamily] = useState<ServiceFamily | null>(null);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [shepherds, setShepherds] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { confirm, confirmModalProps } = useConfirmModal();

  const userId = user?.id || user?.uid;

  const departmentName = (id: string) => departments.find(d => d.id === id)?.name || 'Département inconnu';

  const load = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const fam = await FamilyLeaderService.getFamilyByLeaderId(userId);
      setFamily(fam);
      if (fam) {
        const [s, sv, sh] = await Promise.all([
          FamilyLeaderService.getSoulsByFamilyId(fam.id),
          FamilyLeaderService.getServantsByFamilyId(fam.id),
          FamilyLeaderService.getShepherdsOfFamily(fam.shepherdIds || [], fam.id),
        ]);
        setSouls(s);
        setServants(sv);
        setShepherds(sh);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement de votre famille');
    } finally {
      setLoading(false);
    }
  };

  // Liste unifiée : âmes + B.O.S.S rattachés à la famille
  const members: FamilyMember[] = useMemo(() => [
    ...souls.map((s): FamilyMember => ({
      id: s.id, kind: 'soul', fullName: s.fullName, nickname: s.nickname,
      phone: s.phone, location: s.location, originSource: s.originSource,
      shepherdId: s.shepherdId,
    })),
    ...servants.map((sv): FamilyMember => ({
      id: sv.id, kind: 'servant', fullName: sv.fullName, nickname: sv.nickname,
      phone: sv.phone, departmentIds: sv.departmentIds, shepherdId: sv.shepherdId,
    })),
  ], [souls, servants]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const stats = useMemo(() => {
    const total = members.length;
    const assigned = members.filter(m => m.shepherdId).length;
    return { total, assigned, unassigned: total - assigned };
  }, [members]);

  // Filtre par nom ou téléphone
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      m.fullName?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.nickname?.toLowerCase().includes(q)
    );
  }, [members, search]);

  // Tri : non assignés en premier, puis assignés (ordre alphabétique dans chaque groupe)
  const unassignedMembers = useMemo(
    () =>
      filteredMembers
        .filter(m => !m.shepherdId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [filteredMembers]
  );
  const assignedMembers = useMemo(
    () =>
      filteredMembers
        .filter(m => m.shepherdId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [filteredMembers]
  );

  // Charge par berger (calculée côté client)
  const shepherdLoad = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach(m => {
      if (m.shepherdId) counts.set(m.shepherdId, (counts.get(m.shepherdId) || 0) + 1);
    });
    const rows = shepherds.map(sh => ({
      id: sh.id,
      fullName: sh.fullName,
      count: counts.get(sh.id) || 0,
    }));
    rows.sort((a, b) => b.count - a.count || a.fullName.localeCompare(b.fullName));
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return { rows, max };
  }, [members, shepherds]);

  const handleAssign = async (member: FamilyMember, shepherdId: string) => {
    try {
      setSavingId(member.id);
      if (member.kind === 'soul') {
        await FamilyLeaderService.assignShepherdToSoul(member.id, shepherdId || null);
        setSouls(prev => prev.map(s => s.id === member.id ? { ...s, shepherdId: shepherdId || undefined } : s));
      } else {
        await FamilyLeaderService.assignShepherdToServant(member.id, shepherdId || null);
        setServants(prev => prev.map(sv => sv.id === member.id ? { ...sv, shepherdId: shepherdId || undefined } : sv));
      }
      toast.success('Berger assigné');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'assignation");
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkUndecided = async (member: FamilyMember) => {
    const ok = await confirm(
      `${member.fullName} sera retiré(e) de votre famille et pris(e) en charge par l'équipe ADN parmi les âmes indécises. Continuer ?`,
      { title: 'Signaler comme indécis(e)', confirmLabel: 'Signaler', variant: 'warning' }
    );
    if (!ok) return;
    try {
      setSavingId(member.id);
      await FamilyLeaderService.markSoulUndecided(member.id);
      setSouls(prev => prev.filter(s => s.id !== member.id));
      toast.success(`${member.fullName} signalé(e) comme indécis(e)`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du signalement');
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

  const renderMemberRow = (member: FamilyMember) => (
    <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {member.fullName}
          {member.nickname && <span className="text-gray-500 font-normal"> ({member.nickname})</span>}
        </div>
        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
          {member.kind === 'servant' ? (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded inline-flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> B.O.S.S
              {member.departmentIds && member.departmentIds.length > 0 && (
                <span> · {member.departmentIds.map(departmentName).join(', ')}</span>
              )}
            </span>
          ) : (
            <>
              {member.originSource && (
                <span className="px-2 py-0.5 bg-gray-100 rounded">
                  {member.originSource === 'culte' ? 'Culte' : 'Évangélisation'}
                </span>
              )}
              {member.location && <span>📍 {member.location}</span>}
            </>
          )}
          {member.phone && <span>📞 {member.phone}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={member.shepherdId || ''}
          onChange={(e) => handleAssign(member, e.target.value)}
          disabled={savingId === member.id || shepherds.length === 0}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="">-- Non assigné --</option>
          {shepherds.map(sh => (
            <option key={sh.id} value={sh.id}>{sh.fullName}</option>
          ))}
        </select>
        {member.kind === 'soul' && (
          <button
            type="button"
            onClick={() => handleMarkUndecided(member)}
            disabled={savingId === member.id}
            title="Signaler comme indécis(e) : le membre quittera la famille et sera suivi par l'équipe ADN"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-700 border border-amber-300 rounded-md hover:bg-amber-50 disabled:opacity-50 whitespace-nowrap"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Indécis(e)</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-700 to-brand-900 px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-white">Famille : {family.name}</h1>
          {family.description && <p className="text-sm text-white/70 mt-1">{family.description}</p>}
        </div>
      </div>

      <PendingActionsWidget role="family_leader" familyId={family.id} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total membres"
          value={stats.total}
          icon={Heart}
          trend={`${stats.total}`}
          trendLabel="membres dans la famille"
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
                  <div className="w-16 text-sm text-gray-600 tabular-nums">{r.count} membre{r.count > 1 ? 's' : ''}</div>
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
                  {stats.unassigned} membre{stats.unassigned > 1 ? 's' : ''}
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
      <div id="famille-ames" className="bg-white border rounded-lg overflow-hidden scroll-mt-4">
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Membres de la famille</h2>
          {members.length > 0 && (
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

        {members.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Aucun membre assigné à cette famille pour le moment.
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Aucun membre ne correspond à « {search} ».
          </div>
        ) : (
          <>
            {unassignedMembers.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    À assigner ({unassignedMembers.length})
                  </span>
                </div>
                <div className="divide-y">
                  {unassignedMembers.map(renderMemberRow)}
                </div>
              </div>
            )}
            {assignedMembers.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Assignées ({assignedMembers.length})
                  </span>
                </div>
                <div className="divide-y">
                  {assignedMembers.map(renderMemberRow)}
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

      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
