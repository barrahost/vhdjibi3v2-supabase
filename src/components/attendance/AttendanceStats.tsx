import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { StatCard } from '../dashboard/stats/StatCard';
import { AttendanceService, type AttendanceUser, type PointableSoul } from '../../services/attendance.service';
import { dayKey, latestPerSoul, storedDay, type AttendanceRow } from '../../lib/attendance';
import { compareNames } from '../../lib/baptism';

interface AttendanceStatsProps {
  user: AttendanceUser;
  souls: PointableSoul[];
  version: number;
}

type Period = '30' | '90' | '365';
const PERIOD_LABELS: Record<Period, string> = { '30': '30 derniers jours', '90': '3 derniers mois', '365': '12 derniers mois' };

const shortDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export default function AttendanceStats({ user, souls, version }: AttendanceStatsProps) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [period, setPeriod] = useState<Period>('90');
  const soulIds = useMemo(() => souls.map((s) => s.id), [souls]);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    const since = new Date();
    since.setDate(since.getDate() - Number(period));
    AttendanceService.history(user, soulIds, dayKey(since))
      .then((history) => {
        if (cancelled) return;
        setRows(history);
        setState('ready');
      })
      .catch((error) => {
        console.error('Error loading attendance stats:', error);
        if (!cancelled) setState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [user, soulIds, period, version]);

  const stats = useMemo(() => {
    // Une présence par âme et par jour (les anciens doublons ne comptent qu'une fois).
    const byDay = new Map<string, AttendanceRow[]>();
    rows.forEach((row) => {
      const day = storedDay(row.date);
      if (!day) return;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(row);
    });
    const days = Array.from(byDay.keys()).sort().reverse();
    const perDay = new Map<string, Map<string, AttendanceRow>>();
    days.forEach((day) => perDay.set(day, latestPerSoul(byDay.get(day)!).bySoul));
    let present = 0;
    let total = 0;
    perDay.forEach((bySoul) =>
      bySoul.forEach((row) => {
        total += 1;
        if (row.present) present += 1;
      }),
    );
    // Les âmes du berger absentes aux deux derniers cultes où elles ont été pointées : à appeler.
    const toCall = souls
      .map((soul) => {
        const marks = days.map((day) => perDay.get(day)!.get(soul.id)).filter((r): r is AttendanceRow => !!r);
        const absences = marks.findIndex((r) => r.present);
        const streak = absences === -1 ? marks.length : absences;
        return { soul, streak, last: marks.find((r) => r.present) };
      })
      .filter((s) => s.streak >= 2)
      .sort((a, b) => b.streak - a.streak || compareNames(a.soul.fullName, b.soul.fullName));
    return { days: days.length, present, absent: total - present, rate: total ? Math.round((present / total) * 100) : 0, toCall };
  }, [rows, souls]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
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

      {state === 'loading' && <p className="text-center py-12 text-gray-500">Chargement des statistiques…</p>}
      {state === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600" /> Impossible de charger les statistiques. Vérifiez votre connexion internet.
        </div>
      )}

      {state === 'ready' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <StatCard title="Cultes pointés" value={stats.days} icon={CalendarCheck} trend={`${stats.present + stats.absent}`} trendLabel="pointages" />
            <StatCard title="Présents" value={stats.present} icon={UserCheck} trend={`${stats.rate} %`} trendLabel="de présence" iconClassName="text-green-600" />
            <StatCard
              title="Absents"
              value={stats.absent}
              icon={UserX}
              trend={`${stats.present + stats.absent ? 100 - stats.rate : 0} %`}
              trendLabel="d'absence"
              iconClassName="text-red-600"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">À appeler : absent(e)s aux derniers cultes</h2>
            <p className="text-sm text-gray-500 mt-0.5">Âmes absentes au moins aux deux derniers cultes où elles ont été pointées.</p>
            {stats.toCall.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">Personne pour l’instant.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100" data-testid="attendance-to-call">
                {stats.toCall.map(({ soul, streak, last }) => (
                  <li key={soul.id} className="flex items-center gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">{soul.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {streak} absence(s) de suite{last ? ` · dernière présence : ${shortDay(storedDay(last.date)!)}` : ''}
                      </p>
                    </div>
                    {soul.phone && (
                      <a href={`tel:${soul.phone.replace(/\s/g, '')}`} className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-white bg-[#00665C] rounded-md">
                        Appeler
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
