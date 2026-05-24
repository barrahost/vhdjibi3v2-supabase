import { useState, useEffect, useMemo } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Users, CheckSquare, Square, Shuffle, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface EvangelistWithLoad {
  id: string;
  fullName: string;
  phone?: string;
  currentCount: number; // âmes déjà attribuées
}

interface DistributeEvangelizedSoulsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/* ─── Algorithme de nivellement par le bas ───────────────────
 * Principe : on remonte les évangélistes les moins chargés
 * vers le niveau du suivant, jusqu'à épuiser les âmes à distribuer.
 * Les souls restantes sont distribuées équitablement sur tous.
 *
 * Exemple : A=10, B=3, 10 âmes
 *   → combler B jusqu'au niveau de A : 7 âmes → B=10, reste 3
 *   → distribuer 3 sur A+B : A+1, B+2 → A=11, B=12
 */
function computeEquitableDistribution(
  evangelists: EvangelistWithLoad[],
  newSouls: number
): Map<string, number> {
  const sorted = [...evangelists].sort((a, b) => a.currentCount - b.currentCount);
  const n = sorted.length;
  const effective = sorted.map(e => e.currentCount);
  const alloc = new Array(n).fill(0);
  let remaining = newSouls;

  for (let i = 0; i < n - 1 && remaining > 0; i++) {
    const targetLevel = effective[i + 1];
    const gap = targetLevel - effective[i];
    if (gap <= 0) continue;

    const slotsNeeded = (i + 1) * gap;
    if (remaining <= slotsNeeded) {
      const each = Math.floor(remaining / (i + 1));
      let leftover = remaining % (i + 1);
      for (let j = 0; j <= i; j++) {
        const give = each + (leftover > 0 ? 1 : 0);
        alloc[j] += give;
        effective[j] += give;
        if (leftover > 0) leftover--;
      }
      remaining = 0;
      break;
    } else {
      for (let j = 0; j <= i; j++) {
        alloc[j] += gap;
        effective[j] += gap;
      }
      remaining -= slotsNeeded;
    }
  }

  // Âmes restantes distribuées équitablement sur tous
  if (remaining > 0) {
    const each = Math.floor(remaining / n);
    let leftover = remaining % n;
    for (let j = 0; j < n; j++) {
      const give = each + (leftover > 0 ? 1 : 0);
      alloc[j] += give;
      if (leftover > 0) leftover--;
    }
  }

  const result = new Map<string, number>();
  sorted.forEach((ev, i) => result.set(ev.id, alloc[i]));
  return result;
}

export default function DistributeEvangelizedSoulsModal({
  isOpen,
  onClose,
  onSuccess,
}: DistributeEvangelizedSoulsModalProps) {
  const [evangelists, setEvangelists] = useState<EvangelistWithLoad[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [unassignedIds, setUnassignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDone(false);
    setSelectedIds(new Set());
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Âmes non attribuées
      const { data: soulsData } = await supabase
        .from('evangelized_souls')
        .select('id, evangelist_id')
        .eq('church_id', getChurchId())
        .eq('status', 'active');
      const unassigned = (soulsData ?? []).filter((d: any) => !d.evangelist_id).map((d: any) => d.id);
      setUnassignedIds(unassigned);
      setUnassignedCount(unassigned.length);

      // Compter les âmes déjà attribuées à chaque évangéliste
      const countMap: Record<string, number> = {};
      (soulsData ?? []).forEach((d: any) => {
        const evId = d.evangelist_id;
        if (evId) countMap[evId] = (countMap[evId] || 0) + 1;
      });

      // Évangélistes actifs
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, phone, role, business_profiles')
        .eq('church_id', getChurchId())
        .eq('status', 'active');
      const evList: EvangelistWithLoad[] = [];
      (usersData ?? []).forEach((d: any) => {
        const isEv =
          d.role === 'evangelist' ||
          (Array.isArray(d.business_profiles) &&
            d.business_profiles.some((p: any) => p.type === 'evangelist'));
        if (isEv) {
          evList.push({
            id: d.id,
            fullName: d.full_name,
            phone: d.phone,
            currentCount: countMap[d.id] || 0,
          });
        }
      });
      evList.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setEvangelists(evList);
    } catch (err) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = () => {
    if (selectedIds.size === evangelists.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(evangelists.map(e => e.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Calcul de la répartition équitable en temps réel
  const allocationMap = useMemo(() => {
    if (selectedIds.size === 0 || unassignedCount === 0) return null;
    const selected = evangelists.filter(e => selectedIds.has(e.id));
    return computeEquitableDistribution(selected, unassignedCount);
  }, [selectedIds, evangelists, unassignedCount]);

  // Statistiques de la répartition pour l'aperçu
  const previewStats = useMemo(() => {
    if (!allocationMap) return null;
    const selected = evangelists.filter(e => selectedIds.has(e.id));
    const rows = selected
      .map(ev => ({
        ...ev,
        receives: allocationMap.get(ev.id) ?? 0,
        finalCount: ev.currentCount + (allocationMap.get(ev.id) ?? 0),
      }))
      .sort((a, b) => b.finalCount - a.finalCount);
    const minFinal = Math.min(...rows.map(r => r.finalCount));
    const maxFinal = Math.max(...rows.map(r => r.finalCount));
    return { rows, minFinal, maxFinal, spread: maxFinal - minFinal };
  }, [allocationMap, evangelists, selectedIds]);

  const handleDistribute = async () => {
    if (!allocationMap) return;
    setDistributing(true);
    try {
      const shuffled = [...unassignedIds].sort(() => Math.random() - 0.5);

      // Construire les tranches selon l'allocation
      const ops: { soulId: string; evangelistId: string }[] = [];
      let cursor = 0;
      allocationMap.forEach((count, evId) => {
        shuffled.slice(cursor, cursor + count).forEach(soulId => {
          ops.push({ soulId, evangelistId: evId });
        });
        cursor += count;
      });

      // Batch writes using Supabase
      const BATCH_SIZE = 400;
      for (let i = 0; i < ops.length; i += BATCH_SIZE) {
        const slice = ops.slice(i, i + BATCH_SIZE);
        // Group by evangelistId to minimize requests
        const byEvangelist = new Map<string, string[]>();
        slice.forEach(({ soulId, evangelistId }) => {
          if (!byEvangelist.has(evangelistId)) byEvangelist.set(evangelistId, []);
          byEvangelist.get(evangelistId)!.push(soulId);
        });
        await Promise.all(Array.from(byEvangelist.entries()).map(([evangelistId, ids]) =>
          supabase.from('evangelized_souls').update({ evangelist_id: evangelistId, updated_at: new Date().toISOString() }).in('id', ids)
        ));
      }

      setDone(true);
      toast.success(`${unassignedCount} âmes réparties équitablement`);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la distribution');
    } finally {
      setDistributing(false);
    }
  };

  const allSelected = evangelists.length > 0 && selectedIds.size === evangelists.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#00665C]">
            <Shuffle className="w-5 h-5" />
            Répartir les âmes non attribuées
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#00665C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold text-gray-800 text-center">Répartition effectuée !</p>
            <p className="text-sm text-gray-500 text-center">
              {unassignedCount} âmes réparties équitablement entre {selectedIds.size} évangéliste{selectedIds.size > 1 ? 's' : ''}.
            </p>
            <button onClick={onClose}
              className="mt-2 px-6 py-2 bg-[#00665C] text-white rounded-md hover:bg-[#00665C]/90 text-sm font-medium">
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Compteur âmes */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-amber-800">
                <strong>{unassignedCount}</strong> âme{unassignedCount > 1 ? 's' : ''} non attribuée{unassignedCount > 1 ? 's' : ''} disponible{unassignedCount > 1 ? 's' : ''}
              </span>
            </div>

            {unassignedCount === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">Toutes les âmes évangélisées sont déjà attribuées.</p>
            ) : evangelists.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">Aucun évangéliste actif trouvé.</p>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Sélection évangélistes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Sélectionner les évangélistes
                      </span>
                      <button onClick={toggleAll}
                        className="flex items-center gap-1 text-xs text-[#00665C] hover:underline">
                        {allSelected
                          ? <><CheckSquare className="w-3.5 h-3.5" /> Tout désélectionner</>
                          : <><Square className="w-3.5 h-3.5" /> Tout sélectionner</>}
                      </button>
                    </div>

                    <div className="border rounded-md divide-y max-h-44 overflow-y-auto">
                      {evangelists.map(ev => {
                        const checked = selectedIds.has(ev.id);
                        const receives = allocationMap?.get(ev.id) ?? 0;
                        const finalCount = ev.currentCount + receives;
                        return (
                          <label key={ev.id}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={() => toggleOne(ev.id)}
                              className="w-4 h-4 text-[#00665C] rounded border-gray-300 focus:ring-[#00665C]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{ev.fullName}</p>
                              <p className="text-xs text-gray-400">{ev.currentCount} âme{ev.currentCount !== 1 ? 's' : ''} actuellement</p>
                            </div>
                            {checked && allocationMap && (
                              <div className="text-right shrink-0">
                                <span className="text-xs font-medium text-[#00665C]">+{receives}</span>
                                <span className="text-xs text-gray-400 ml-1">→ {finalCount}</span>
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aperçu de la répartition */}
                  {previewStats && (
                    <div className="border border-[#00665C]/20 rounded-md overflow-hidden">
                      <div className="bg-[#00665C]/5 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#00665C] flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" /> Aperçu de la répartition équitable
                        </span>
                        <span className="text-xs text-gray-500">
                          Écart max : {previewStats.spread} âme{previewStats.spread !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="divide-y max-h-44 overflow-y-auto">
                        {previewStats.rows.map(row => {
                          const barWidth = previewStats.maxFinal > 0
                            ? Math.round((row.finalCount / previewStats.maxFinal) * 100)
                            : 0;
                          return (
                            <div key={row.id} className="px-3 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-800 truncate max-w-[55%]">{row.fullName}</span>
                                <span className="text-xs text-gray-500 shrink-0">
                                  {row.currentCount}
                                  {row.receives > 0 && (
                                    <span className="text-[#00665C] font-semibold"> +{row.receives}</span>
                                  )} → <strong>{row.finalCount}</strong>
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-[#00665C] h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${barWidth}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-t">
                        La répartition nivelle les charges : ceux qui ont le moins reçoivent en priorité.
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Annuler
                  </button>
                  <button onClick={handleDistribute}
                    disabled={selectedIds.size === 0 || distributing}
                    className="flex-1 px-4 py-2 bg-[#00665C] text-white rounded-md text-sm font-medium hover:bg-[#00665C]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {distributing ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Distribution…</>
                    ) : (
                      <><Shuffle className="w-4 h-4" /> Répartir {unassignedCount} âme{unassignedCount > 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
