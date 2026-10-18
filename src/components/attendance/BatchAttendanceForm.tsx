import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AttendanceService, type AttendanceUser, type PointableSoul } from '../../services/attendance.service';
import { countMarks, dayKey, latestPerSoul, type AttendanceRow, type PresenceMark } from '../../lib/attendance';
import { compareNames, plain } from '../../lib/baptism';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface BatchAttendanceFormProps {
  user: AttendanceUser;
  souls: PointableSoul[];
  day: string;
  onDayChange: (day: string) => void;
  onSaved: () => void;
  /** Change quand l'historique a été modifié ailleurs (suppression, correction) : on relit la journée. */
  version: number;
}

type Filter = 'all' | 'unmarked' | 'present' | 'absent';
const MAX_SHOWN = 300;

const FILTER_LABELS: Record<Filter, string> = { all: 'Toutes', unmarked: 'Non pointées', present: 'Présentes', absent: 'Absentes' };

/** Jour lisible : « dimanche 18 octobre 2026 ». */
const longDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function BatchAttendanceForm({ user, souls, day, onDayChange, onSaved, version }: BatchAttendanceFormProps) {
  const [existing, setExisting] = useState<Map<string, AttendanceRow>>(new Map());
  const [marks, setMarks] = useState<Map<string, PresenceMark>>(new Map());
  const [dayState, setDayState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { confirm, confirmModalProps } = useConfirmModal();
  const today = dayKey(new Date());
  const isFuture = day > today;

  const sortedSouls = useMemo(() => [...souls].sort((a, b) => compareNames(a.fullName, b.fullName)), [souls]);
  const soulIds = useMemo(() => sortedSouls.map((s) => s.id), [sortedSouls]);

  // Le pointage déjà enregistré pour ce jour : on le reprend pour le compléter ou le corriger.
  useEffect(() => {
    let cancelled = false;
    setDayState('loading');
    (async () => {
      try {
        const rows = await AttendanceService.forDay(day, user.seesAll ? null : soulIds);
        if (cancelled) return;
        const { bySoul } = latestPerSoul(rows);
        setExisting(bySoul);
        const initial = new Map<string, PresenceMark>();
        bySoul.forEach((row, soulId) => initial.set(soulId, row.present ? 'present' : 'absent'));
        setMarks(initial);
        setDayState('ready');
      } catch (error) {
        console.error('Error loading attendances for the day:', error);
        if (!cancelled) setDayState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day, soulIds, user.seesAll, attempt, version]);

  /** Les âmes dont le pointage diffère de ce qui est enregistré. */
  const changed = useMemo(() => {
    const ids: string[] = [];
    marks.forEach((mark, soulId) => {
      const before = existing.get(soulId);
      if (!before || !!before.present !== (mark === 'present')) ids.push(soulId);
    });
    return ids;
  }, [marks, existing]);
  const changedSet = useMemo(() => new Set(changed), [changed]);

  const counts = useMemo(() => countMarks(soulIds, marks), [soulIds, marks]);
  const alreadyRecorded = useMemo(() => soulIds.filter((id) => existing.has(id)).length, [soulIds, existing]);

  const visible = useMemo(() => {
    const words = plain(search).split(/\s+/).filter(Boolean);
    const digits = search.replace(/\D/g, '');
    return sortedSouls.filter((soul) => {
      const mark = marks.get(soul.id);
      if (filter === 'unmarked' && mark) return false;
      if (filter === 'present' && mark !== 'present') return false;
      if (filter === 'absent' && mark !== 'absent') return false;
      if (words.length === 0) return true;
      const text = plain(`${soul.fullName} ${soul.nickname}`);
      return words.every((w) => text.includes(w)) || (digits.length >= 3 && soul.phone.replace(/\D/g, '').includes(digits));
    });
  }, [sortedSouls, marks, search, filter]);

  const setMark = (soulId: string, mark: PresenceMark) =>
    setMarks((current) => {
      const next = new Map(current);
      // Toucher à nouveau le choix retire le pointage, tant qu'il n'est pas enregistré.
      if (next.get(soulId) === mark && !existing.has(soulId)) next.delete(soulId);
      else next.set(soulId, mark);
      return next;
    });

  const markVisible = (mark: PresenceMark) =>
    setMarks((current) => {
      const next = new Map(current);
      visible.forEach((soul) => next.set(soul.id, mark));
      return next;
    });

  /** Les âmes non pointées sont marquées absentes : pratique une fois les présents cochés. */
  const markRestAbsent = () =>
    setMarks((current) => {
      const next = new Map(current);
      soulIds.forEach((id) => {
        if (!next.has(id)) next.set(id, 'absent');
      });
      return next;
    });

  const undo = () => {
    const initial = new Map<string, PresenceMark>();
    existing.forEach((row, soulId) => initial.set(soulId, row.present ? 'present' : 'absent'));
    setMarks(initial);
  };

  const changeDay = async (next: string) => {
    if (!next || next === day) return;
    if (changed.length > 0) {
      const ok = await confirm(`${changed.length} pointage(s) ne sont pas enregistrés pour le ${longDay(day)}. Changer de jour sans les enregistrer ?`, {
        title: 'Pointage non enregistré',
        confirmLabel: 'Changer de jour',
        variant: 'warning',
      });
      if (!ok) return;
    }
    onDayChange(next);
  };

  const save = async () => {
    if (isFuture) {
      toast.error('On ne peut pas pointer un culte qui n’a pas encore eu lieu.');
      return;
    }
    if (changed.length === 0) {
      toast('Rien de nouveau à enregistrer.');
      return;
    }
    setSaving(true);
    try {
      const toSave = new Map<string, PresenceMark>();
      changed.forEach((id) => toSave.set(id, marks.get(id)!));
      const plan = await AttendanceService.saveDay({ day, marks: toSave, user, scope: user.seesAll ? null : soulIds });
      const parts = [plan.created ? `${plan.created} ajoutée(s)` : '', plan.updated ? `${plan.updated} corrigée(s)` : ''].filter(Boolean);
      toast.success(`Présences du ${longDay(day)} enregistrées${parts.length ? ` (${parts.join(', ')})` : ''}.`);
      onSaved();
    } catch (error: any) {
      console.error('Error saving attendances:', error);
      const refused = error?.code === '42501' || /row-level security|refusé/i.test(error?.message ?? '');
      toast.error(
        refused
          ? 'La base de données refuse l’enregistrement des présences. Prévenez l’administrateur : le script supabase_attendances_policies.sql doit être exécuté dans Supabase.'
          : 'Les présences n’ont pas été enregistrées. Vérifiez votre connexion internet et réessayez.',
        { duration: 10000 },
      );
    } finally {
      setSaving(false);
    }
  };

  const filterButton = (id: Filter) => {
    const count = id === 'all' ? soulIds.length : id === 'unmarked' ? counts.unmarked : counts[id];
    return (
      <button
        key={id}
        type="button"
        onClick={() => setFilter(id)}
        aria-pressed={filter === id}
        className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
          filter === id ? 'bg-[#00665C] text-white border-[#00665C]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        {FILTER_LABELS[id]} ({count})
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label htmlFor="attendance-day" className="block text-sm font-medium text-gray-700 mb-1">
            Date du culte
          </label>
          <input
            id="attendance-day"
            type="date"
            required
            max={today}
            value={day}
            onChange={(e) => changeDay(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        {day !== today && (
          <button type="button" onClick={() => changeDay(today)} className="px-3 py-2 text-sm font-medium text-[#00665C] border border-[#00665C]/30 rounded-md hover:bg-[#00665C]/5">
            Aujourd’hui
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 first-letter:uppercase" data-testid="attendance-day-status">
        {longDay(day)} —{' '}
        {dayState === 'loading'
          ? 'lecture du pointage…'
          : alreadyRecorded > 0
            ? `déjà pointé pour ${alreadyRecorded} âme(s) sur ${soulIds.length} : vous pouvez compléter ou corriger.`
            : 'pas encore pointé.'}
      </p>

      {isFuture && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">Cette date est à venir : on pointe un culte une fois qu’il a eu lieu.</p>
      )}

      {souls.length === 0 ? (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-lg text-gray-600">
          <p className="font-medium text-gray-800">Aucune âme ne vous est assignée pour l’instant.</p>
          <p className="text-sm mt-1">Les âmes vous sont confiées par l’ADN ou votre responsable de famille. Dès qu’une âme vous est assignée, elle apparaît ici.</p>
        </div>
      ) : dayState === 'failed' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">Impossible de lire le pointage de ce jour. Vérifiez votre connexion internet.</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="px-3 py-1.5 text-sm font-medium text-white bg-[#00665C] rounded-md">
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center" data-testid="attendance-counts">
            <div className="rounded-lg bg-green-50 border border-green-200 py-2">
              <div className="text-xl font-bold text-green-700">{counts.present}</div>
              <div className="text-xs text-green-800">présent(e)s</div>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 py-2">
              <div className="text-xl font-bold text-red-600">{counts.absent}</div>
              <div className="text-xs text-red-700">absent(e)s</div>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 py-2">
              <div className="text-xl font-bold text-gray-700">{counts.unmarked}</div>
              <div className="text-xs text-gray-600">non pointé(e)s</div>
            </div>
          </div>

          {souls.length > 6 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Rechercher une âme (nom, surnom, téléphone)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">{(['all', 'unmarked', 'present', 'absent'] as Filter[]).map(filterButton)}</div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => markVisible('present')} disabled={visible.length === 0}
              className="px-3 py-1.5 text-sm text-[#00665C] rounded-md border border-[#00665C]/30 hover:bg-[#00665C]/10 disabled:opacity-50">
              {search || filter !== 'all' ? 'Ces âmes présentes' : 'Tous présents'}
            </button>
            <button type="button" onClick={() => markVisible('absent')} disabled={visible.length === 0}
              className="px-3 py-1.5 text-sm text-red-600 rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50">
              {search || filter !== 'all' ? 'Ces âmes absentes' : 'Tous absents'}
            </button>
            {counts.unmarked > 0 && counts.unmarked < soulIds.length && (
              <button type="button" onClick={markRestAbsent} className="px-3 py-1.5 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50">
                Les autres absents
              </button>
            )}
            {changed.length > 0 && (
              <button type="button" onClick={undo} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                <RotateCcw className="w-3.5 h-3.5" /> Annuler les changements
              </button>
            )}
          </div>

          <ul className="divide-y divide-gray-100 border rounded-lg" data-testid="attendance-souls">
            {visible.length === 0 && <li className="p-4 text-center text-sm text-gray-500">Aucune âme ne correspond.</li>}
            {visible.slice(0, MAX_SHOWN).map((soul) => {
              const mark = marks.get(soul.id);
              const pending = changedSet.has(soul.id);
              return (
                <li key={soul.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5" data-soul={soul.fullName}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 break-words">{soul.fullName || 'Sans nom'}</p>
                    <p className="text-xs text-gray-500 break-words">
                      {soul.nickname && <span>{soul.nickname} · </span>}
                      {pending ? <span className="text-amber-700">à enregistrer</span> : existing.has(soul.id) ? 'enregistré' : 'non pointé(e)'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1.5 sm:flex-shrink-0" role="group" aria-label={`Présence de ${soul.fullName}`}>
                    <button
                      type="button"
                      onClick={() => setMark(soul.id, 'present')}
                      aria-pressed={mark === 'present'}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-md border ${
                        mark === 'present' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Présent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMark(soul.id, 'absent')}
                      aria-pressed={mark === 'absent'}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-md border ${
                        mark === 'absent' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>Absent</span>
                    </button>
                  </div>
                </li>
              );
            })}
            {visible.length > MAX_SHOWN && (
              <li className="p-3 text-center text-sm text-gray-500">
                {visible.length - MAX_SHOWN} autre(s) âme(s) : affinez la recherche pour les afficher.
              </li>
            )}
          </ul>

          <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-white/95 backdrop-blur border-t sm:border-0">
            <button
              type="button"
              onClick={save}
              disabled={saving || dayState !== 'ready' || changed.length === 0 || isFuture}
              className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-50"
            >
              {saving
                ? 'Enregistrement…'
                : changed.length > 0
                  ? `Enregistrer ${changed.length} pointage(s)`
                  : alreadyRecorded > 0
                    ? 'Pointage enregistré'
                    : 'Pointez au moins une âme'}
            </button>
          </div>
        </>
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
