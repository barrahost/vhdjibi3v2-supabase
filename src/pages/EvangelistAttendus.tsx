import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { RecurringScheduleService } from '../services/culteEvent.service';
import {
  EvangelizedSoul,
  PlannedService,
  PLANNED_SERVICE_TO_MEETING_TYPE,
  plannedServiceLabel,
} from '../types/evangelized.types';
import { CalendarCheck, ChevronDown, ChevronRight, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

function nextOccurrence(dayOfWeek: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (dayOfWeek - today.getDay() + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const GROUP_KEYS: Exclude<PlannedService, 'undecided'>[] = ['wednesday_evening', 'sunday_first', 'sunday_second'];

export default function EvangelistAttendus() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<EvangelizedSoul[]>([]);
  const [nextDates, setNextDates] = useState<Record<string, Date>>({});
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) { setLoading(false); return; }
      const userId = JSON.parse(userStr).id;

      const [soulsRes, schedules] = await Promise.all([
        supabase.from('evangelized_souls').select('*')
          .eq('church_id', getChurchId())
          .eq('evangelist_id', userId)
          .not('planned_service', 'is', null)
          .neq('planned_service', 'undecided'),
        RecurringScheduleService.list(),
      ]);

      const mapped = (soulsRes.data ?? [])
        .map((row: any) => ({
          id: row.id,
          fullName: row.full_name,
          phone: row.phone,
          location: row.location,
          evangelistId: row.evangelist_id,
          status: row.status,
          plannedService: row.planned_service,
          serviceAttendance: row.service_attendance,
          importedToSoulId: row.imported_to_soul_id,
        } as EvangelizedSoul));
      setSouls(mapped);

      const dates: Record<string, Date> = {};
      for (const key of GROUP_KEYS) {
        const schedule = schedules.find((s) => s.meetingTypeName === PLANNED_SERVICE_TO_MEETING_TYPE[key] && s.isActive);
        if (schedule) dates[key] = nextOccurrence(schedule.dayOfWeek);
      }
      setNextDates(dates);
    } catch (error) {
      console.error('Error loading attendus:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const groups = useMemo(() => {
    return GROUP_KEYS.map((key) => ({
      key,
      label: plannedServiceLabel(key),
      date: nextDates[key],
      rows: souls.filter((s) => s.plannedService === key),
    })).filter((g) => g.rows.length > 0);
  }, [souls, nextDates]);

  const setAttendance = async (soulId: string, value: 'came' | 'no_show') => {
    setSouls((prev) => prev.map((s) => (s.id === soulId ? { ...s, serviceAttendance: value } : s)));
    const { error } = await supabase.from('evangelized_souls').update({ service_attendance: value }).eq('id', soulId);
    if (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-brand-700" /> Attendus au culte
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Contacts ayant confirmé une date — cochez leur présence après le culte
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-400">
          Aucun contact n'a encore confirmé de date.
        </div>
      ) : (
        groups.map((group) => {
          const isOpen = openGroups[group.key] ?? true;
          const pending = group.rows.filter((r) => !r.serviceAttendance || r.serviceAttendance === 'pending').length;
          return (
            <div key={group.key} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !isOpen }))}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                  {group.date && <p className="text-xs text-gray-500 capitalize">{formatDate(group.date)}</p>}
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {pending} en attente
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {group.rows.map((soul) => (
                    <div key={soul.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[150px]">
                        <p className="text-sm font-semibold text-gray-900">{soul.fullName}</p>
                        <p className="text-xs text-gray-500">{soul.location} · {soul.phone || '—'}</p>
                      </div>
                      {soul.importedToSoulId && (
                        <span
                          title="L'ADN a officiellement reçu cette âme dans l'église"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full"
                        >
                          <Check className="w-3.5 h-3.5" /> Reçu(e) par l'ADN
                        </span>
                      )}
                      {soul.serviceAttendance === 'came' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Venu(e)
                        </span>
                      ) : soul.serviceAttendance === 'no_show' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          <XIcon className="w-3.5 h-3.5" /> Pas venu(e)
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAttendance(soul.id, 'came')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Est venu(e)
                          </button>
                          <button
                            onClick={() => setAttendance(soul.id, 'no_show')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            N'est pas venu(e)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
