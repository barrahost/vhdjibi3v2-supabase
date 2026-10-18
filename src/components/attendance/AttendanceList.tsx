import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Search, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import EditAttendanceModal from './EditAttendanceModal';
import { AttendanceService, type AttendanceUser, type PointableSoul } from '../../services/attendance.service';
import { dayKey, latestPerSoul, storedDay, type AttendanceRow } from '../../lib/attendance';
import { compareNames, plain } from '../../lib/baptism';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface AttendanceListProps {
  user: AttendanceUser;
  souls: PointableSoul[];
  /** Change à chaque enregistrement du pointage : on relit l'historique. */
  version: number;
  onChanged: () => void;
  /** Ouvre le pointage de ce jour dans le formulaire, pour le compléter ou le corriger. */
  onEditDay: (day: string) => void;
}

type Period = '30' | '90' | '365' | 'all';
const PERIOD_LABELS: Record<Period, string> = { '30': '30 derniers jours', '90': '3 derniers mois', '365': '12 derniers mois', all: 'Tout l’historique' };
const GROUPS_PER_PAGE = 12;

const longDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function sinceDay(period: Period): string | null {
  if (period === 'all') return null;
  const date = new Date();
  date.setDate(date.getDate() - Number(period));
  return dayKey(date);
}

interface DayGroup {
  day: string;
  rows: AttendanceRow[];
  present: number;
  absent: number;
}

export default function AttendanceList({ user, souls, version, onChanged, onEditDay }: AttendanceListProps) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [period, setPeriod] = useState<Period>('90');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(GROUPS_PER_PAGE);
  const [editing, setEditing] = useState<AttendanceRow | null>(null);
  const [live, setLive] = useState(0);
  const { confirm, confirmModalProps } = useConfirmModal();
  const soulIds = useMemo(() => souls.map((s) => s.id), [souls]);
  const reloadTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    setState((s) => (s === 'ready' ? s : 'loading'));
    (async () => {
      try {
        const history = await AttendanceService.history(user, soulIds, sinceDay(period));
        const known = new Map(souls.map((s) => [s.id, s.fullName] as [string, string]));
        const missing = Array.from(new Set(history.map((r) => r.soul_id).filter((id) => id && !known.has(id))));
        if (missing.length > 0) (await AttendanceService.soulNames(missing)).forEach((s, id) => known.set(id, s.fullName));
        if (cancelled) return;
        setRows(history);
        setNames(known);
        setState('ready');
      } catch (error) {
        console.error('Error loading attendances:', error);
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, souls, soulIds, period, version, live]);

  // Une présence saisie ailleurs (autre appareil, autre berger) : on relit, en regroupant les changements rapprochés.
  useEffect(() => {
    const channel = supabase
      .channel(`attendances-history-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances', filter: `church_id=eq.${getChurchId()}` }, () => {
        clearTimeout(reloadTimer.current);
        reloadTimer.current = setTimeout(() => setLive((n) => n + 1), 2000);
      })
      .subscribe();
    return () => {
      clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const nameOf = (soulId: string) => names.get(soulId) || 'Âme inconnue';

  const groups = useMemo<DayGroup[]>(() => {
    const words = plain(search).split(/\s+/).filter(Boolean);
    const byDay = new Map<string, AttendanceRow[]>();
    rows.forEach((row) => {
      const day = storedDay(row.date);
      if (!day) return;
      if (words.length > 0) {
        const text = plain(names.get(row.soul_id) || '');
        if (!words.every((w) => text.includes(w))) return;
      }
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(row);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([day, all]) => {
        // Une ligne par âme : la présence la plus récente (les doublons de l'ancien formulaire ne comptent pas double).
        const dayRows = Array.from(latestPerSoul(all).bySoul.values());
        dayRows.sort((a, b) => compareNames(names.get(a.soul_id) || '', names.get(b.soul_id) || ''));
        const present = dayRows.filter((r) => r.present).length;
        return { day, rows: dayRows, present, absent: dayRows.length - present };
      });
  }, [rows, names, search]);

  const toggle = (day: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  const remove = async (row: AttendanceRow) => {
    const ok = await confirm(`Supprimer la présence de ${nameOf(row.soul_id)} du ${longDay(storedDay(row.date) || '')} ?`, { confirmLabel: 'Supprimer' });
    if (!ok) return;
    const { data, error } = await supabase.from('attendances').delete().eq('id', row.id).select('id');
    if (error || !data || data.length === 0) {
      console.error('Error deleting attendance:', error);
      toast.error('La présence n’a pas été supprimée. Vérifiez votre connexion et réessayez.');
      return;
    }
    toast.success('Présence supprimée');
    onChanged();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Pointages enregistrés</h2>
        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value as Period);
            setShown(GROUPS_PER_PAGE);
          }}
          aria-label="Période"
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Rechercher une âme dans l’historique…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {state === 'loading' && <p className="text-center py-6 text-gray-500">Chargement des présences…</p>}
      {state === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">Impossible de charger l’historique des présences.</p>
          <button type="button" onClick={() => setLive((n) => n + 1)} className="px-3 py-1.5 text-sm font-medium text-white bg-[#00665C] rounded-md">
            Réessayer
          </button>
        </div>
      )}

      {state === 'ready' && groups.length === 0 && (
        <p className="text-center py-6 text-gray-500">{search ? 'Aucune présence ne correspond à cette recherche.' : 'Aucun pointage sur cette période.'}</p>
      )}

      {state === 'ready' && groups.length > 0 && (
        <ul className="space-y-2" data-testid="attendance-history">
          {groups.slice(0, shown).map((group) => {
            const isOpen = open.has(group.day);
            const total = group.rows.length;
            return (
              <li key={group.day} className="border rounded-lg overflow-hidden" data-day={group.day}>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50">
                  <button type="button" onClick={() => toggle(group.day)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-900 first-letter:uppercase">{longDay(group.day)}</span>
                      <span className="block text-xs text-gray-600">
                        <span className="text-green-700 font-medium">{group.present} présent(e)s</span> ·{' '}
                        <span className="text-red-600 font-medium">{group.absent} absent(e)s</span>
                        {total > 0 && <span> · {Math.round((group.present / total) * 100)} % de présence</span>}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditDay(group.day)}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#00665C] border border-[#00665C]/30 rounded-md hover:bg-[#00665C]/5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Compléter / corriger</span><span className="sm:hidden">Modifier</span>
                  </button>
                </div>
                {isOpen && (
                  <ul className="divide-y divide-gray-100">
                    {group.rows.map((row) => (
                      <li key={row.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{nameOf(row.soul_id)}</p>
                          {row.notes && <p className="text-xs text-gray-500 whitespace-pre-wrap break-words">{row.notes}</p>}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${row.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {row.present ? 'Présent(e)' : 'Absent(e)'}
                        </span>
                        <button type="button" onClick={() => setEditing(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier (note, statut)">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => remove(row)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {state === 'ready' && groups.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + GROUPS_PER_PAGE)} className="w-full py-2 text-sm font-medium text-[#00665C] border border-[#00665C]/30 rounded-md hover:bg-[#00665C]/5">
          Voir les cultes plus anciens ({groups.length - shown})
        </button>
      )}

      {editing && (
        <EditAttendanceModal
          attendance={{ id: editing.id, date: new Date(`${storedDay(editing.date)}T00:00:00.000Z`), present: !!editing.present, notes: editing.notes ?? '' }}
          soulName={nameOf(editing.soul_id)}
          isOpen
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
