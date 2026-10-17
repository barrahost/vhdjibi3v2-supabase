import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, ChevronRight, ClipboardList, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState, ModuleNotReady, Pill, Spinner, Card } from '../components/culteBrief/ui';
import { useCulteAccess } from '../hooks/useCulteAccess';
import { useCulteModule } from '../hooks/useCulteModule';
import { capitalize, daysFromToday, formatDayFr, formatRangeFr, isEventFinished, todayISO } from '../lib/culteTiming';
import { CulteCockpitService, type EventSummary } from '../services/culteBrief.service';
import { CulteActionService, summarizeActions } from '../services/culteAction.service';
import type { CulteAction, CulteEventInfo } from '../types/culteBrief.types';

function dayBadge(iso: string): { text: string; tone: 'brand' | 'gray' } {
  const diff = daysFromToday(iso);
  if (diff === 0) return { text: "Aujourd'hui", tone: 'brand' };
  if (diff === 1) return { text: 'Demain', tone: 'gray' };
  if (diff > 1) return { text: `Dans ${diff} jours`, tone: 'gray' };
  if (diff === -1) return { text: 'Hier', tone: 'gray' };
  return { text: `Il y a ${-diff} jours`, tone: 'gray' };
}

function EventRow({ event, summary, past }: { event: CulteEventInfo; summary?: EventSummary; past: boolean }) {
  const s = summary;
  const c = s?.checklist;
  // Un culte du jour dont l'heure de fin est passée est déjà à débriefer (le débrief a lieu le soir même)
  const finished = past || isEventFinished(event);
  return (
    <Link
      to={`/cultes/${event.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{event.meetingTypeName}</p>
        <p className="text-sm text-gray-500">{formatRangeFr(event.startTime, event.endTime) || 'Horaire non défini'}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {!finished && (
            s?.brief === 'ready' ? <Pill tone="green">Brief prêt</Pill>
            : s?.brief === 'draft' ? <Pill tone="amber">Brief en préparation</Pill>
            : <Pill tone="gray">Brief à préparer</Pill>
          )}
          {c && c.total > 0 && (
            <>
              <Pill tone={c.ok === c.total ? 'green' : 'gray'}>{c.ok}/{c.total} contrôlés</Pill>
              {c.nok > 0 && <Pill tone="red">{c.nok} non OK</Pill>}
            </>
          )}
          {finished && (
            s?.debrief === 'done' ? <Pill tone="green">Débrief clôturé</Pill>
            : (s?.debriefSheets ?? 0) > 0 ? <Pill tone="blue">{s?.debriefSheets} fiche(s) de débrief</Pill>
            : <Pill tone="amber">Débrief à faire</Pill>
          )}
          {(s?.actionsOpen ?? 0) > 0 && (
            <Pill tone={(s?.actionsOverdue ?? 0) > 0 ? 'red' : 'gray'}>
              {s?.actionsOpen} action(s){(s?.actionsOverdue ?? 0) > 0 ? ` dont ${s?.actionsOverdue} en retard` : ''}
            </Pill>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
    </Link>
  );
}

export default function CulteHub() {
  const { enabled, loading: moduleLoading } = useCulteModule();
  const access = useCulteAccess();
  const { canManageAction } = access;
  const [events, setEvents] = useState<CulteEventInfo[]>([]);
  const [summaries, setSummaries] = useState<Record<string, EventSummary>>({});
  const [actions, setActions] = useState<CulteAction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await CulteCockpitService.listHubEvents();
      setEvents(list);
      const [sums, openActions] = await Promise.all([
        CulteCockpitService.getSummaries(list.map((e) => e.id)),
        CulteActionService.list({ scope: 'open' }),
      ]);
      setSummaries(sums);
      setActions(openActions.filter((a) => canManageAction(a)));
    } catch (error) {
      console.error('Error loading culte hub:', error);
      toast.error('Erreur lors du chargement des cultes');
    } finally {
      setLoading(false);
    }
  }, [canManageAction]);

  useEffect(() => {
    if (enabled && !access.loading) load();
  }, [enabled, access.loading, load]);

  const { upcoming, past } = useMemo(() => {
    const today = todayISO();
    const group = (list: CulteEventInfo[]) => {
      const byDate = new Map<string, CulteEventInfo[]>();
      list.forEach((e) => byDate.set(e.serviceDate, [...(byDate.get(e.serviceDate) ?? []), e]));
      return Array.from(byDate.entries());
    };
    return {
      upcoming: group(events.filter((e) => e.serviceDate >= today)),
      past: group(events.filter((e) => e.serviceDate < today)).reverse().slice(0, 6),
    };
  }, [events]);

  if (moduleLoading) return <Spinner />;
  if (!enabled) return <ModuleNotReady />;
  if (loading || access.loading) return <Spinner />;

  const summary = summarizeActions(actions);

  const renderDay = (date: string, dayEvents: CulteEventInfo[], isPast: boolean) => {
    const badge = dayBadge(date);
    return (
      <Card key={date} className={date === todayISO() ? 'border-[#00665C]/50' : ''}>
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h3 className="font-semibold text-gray-900">{capitalize(formatDayFr(date))}</h3>
          <Pill tone={badge.tone}>{badge.text}</Pill>
        </div>
        <div className="divide-y divide-gray-100">
          {dayEvents.map((e) => (
            <EventRow key={e.id} event={e} summary={summaries[e.id]} past={isPast} />
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cultes : brief et débrief</h1>
          <p className="text-sm text-gray-500 mt-1">Préparer, contrôler, débriefer, puis suivre les décisions jusqu'au prochain culte.</p>
        </div>
        {access.isManager && (
          <div className="flex gap-3 text-sm">
            <Link to="/parametres-controle" className="inline-flex items-center gap-1.5 text-[#00665C] font-medium hover:underline">
              <Settings2 className="w-4 h-4" /> Modèles de contrôle
            </Link>
            <Link to="/parametres-programme-recurrent" className="inline-flex items-center gap-1.5 text-[#00665C] font-medium hover:underline">
              <CalendarRange className="w-4 h-4" /> Programme
            </Link>
          </div>
        )}
      </div>

      <Link to="/plan-actions" className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#00665C]/40 transition-colors p-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-[#00665C] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Plan d'actions</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Pill tone="gray">{summary.open} ouverte(s)</Pill>
              {summary.overdue > 0 && <Pill tone="red">{summary.overdue} en retard</Pill>}
              {summary.toArbitrate > 0 && <Pill tone="amber">{summary.toArbitrate} à arbitrer</Pill>}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
      </Link>

      {events.length === 0 ? (
        <EmptyState>
          Aucun culte suivi pour l'instant.{' '}
          {access.isManager ? (
            <>
              Activez « Brief et contrôle » sur vos cultes dans{' '}
              <Link to="/parametres-programme-recurrent" className="text-[#00665C] font-medium hover:underline">Programme récurrent</Link>.
            </>
          ) : (
            'Demandez à un responsable du culte de les activer.'
          )}
        </EmptyState>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">À venir</h2>
            {upcoming.length === 0 ? <EmptyState>Aucun culte à venir.</EmptyState> : upcoming.map(([date, list]) => renderDay(date, list, false))}
          </section>

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Récents</h2>
              {past.map(([date, list]) => renderDay(date, list, true))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
