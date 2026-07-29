import { useEffect, useState } from 'react';
import { Lock, CheckCircle2, Link2 } from 'lucide-react';
import { CulteEventService, RecurringScheduleService } from '../../services/culteEvent.service';
import { CulteReportService } from '../../services/culteReport.service';

interface CulteLink {
  eventId: string;
  label: string;
  state: 'locked' | 'available' | 'closed';
  unlockLabel?: string;
}

interface Props {
  onSelect: (eventId: string, label: string) => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdnCulteLinksBar({ onSelect }: Props) {
  const [links, setLinks] = useState<CulteLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const today = todayISO();
        const dayOfWeek = new Date(`${today}T00:00:00`).getDay();

        const schedules = await RecurringScheduleService.list();
        const todaySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.isActive && s.startTime);
        if (todaySchedules.length === 0) {
          if (!cancelled) { setLinks([]); setLoading(false); }
          return;
        }

        await CulteEventService.ensureRecurringEventsForDate(today);
        const events = await CulteEventService.getEventsForDate(today);
        const relevantEvents = events.filter((ev) => todaySchedules.some((s) => s.meetingTypeName === ev.meetingTypeName));
        if (relevantEvents.length === 0) {
          if (!cancelled) { setLinks([]); setLoading(false); }
          return;
        }

        const reportedIds = await CulteReportService.getReportedEventIds('adn', relevantEvents.map((e) => e.id));

        const now = new Date();
        const built: CulteLink[] = relevantEvents.map((ev) => {
          const schedule = todaySchedules.find((s) => s.meetingTypeName === ev.meetingTypeName)!;
          const [h, m] = (schedule.startTime as string).split(':').map(Number);
          const unlockAt = new Date(`${today}T00:00:00`);
          unlockAt.setHours(h, m + 30, 0, 0);

          if (reportedIds.has(ev.id)) {
            return { eventId: ev.id, label: ev.meetingTypeName, state: 'closed' as const };
          }
          if (now < unlockAt) {
            return {
              eventId: ev.id,
              label: ev.meetingTypeName,
              state: 'locked' as const,
              unlockLabel: unlockAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            };
          }
          return { eventId: ev.id, label: ev.meetingTypeName, state: 'available' as const };
        });

        if (!cancelled) setLinks(built);
      } catch (error) {
        console.error('Error loading ADN culte links:', error);
        if (!cancelled) setLinks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading || links.length === 0) return null;

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" /> Réception des âmes :
      </span>
      {links.map((link) => {
        if (link.state === 'available') {
          return (
            <button
              key={link.eventId}
              onClick={() => onSelect(link.eventId, link.label)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-brand-700 text-white hover:bg-brand-800 transition-colors"
            >
              {link.label}
            </button>
          );
        }
        if (link.state === 'closed') {
          return (
            <span
              key={link.eventId}
              title="Rapport ADN déjà soumis pour ce culte"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-400"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {link.label}
            </span>
          );
        }
        return (
          <span
            key={link.eventId}
            title={`Disponible à partir de ${link.unlockLabel}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-400"
          >
            <Lock className="w-3.5 h-3.5" /> {link.label} · dès {link.unlockLabel}
          </span>
        );
      })}
    </div>
  );
}
