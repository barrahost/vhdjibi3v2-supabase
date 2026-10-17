import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight, ClipboardList } from 'lucide-react';
import { capitalize, daysFromToday, formatDayFr, formatRangeFr, isEventFinished, shortServiceLabel } from '../../lib/culteTiming';
import { CulteActionService, summarizeActions, type ActionsSummary } from '../../services/culteAction.service';
import { CulteCockpitService, type EventSummary } from '../../services/culteBrief.service';
import type { CulteEventInfo } from '../../types/culteBrief.types';

// Cartes du tableau de bord (pasteur, pasteur assistant) qui remplacent « Besoins signalés »
// une fois le module « Cultes » activé. Elles ne s'affichent que si le module l'est : les
// tableaux de bord décident, avec `useCulteModule`, entre l'ancienne carte et celles-ci.

const cardCls = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5';

interface ActionPlanCardProps {
  /** Pasteur assistant : seulement les actions des départements qu'il supervise. */
  departmentNames?: string[];
}

export function ActionPlanDashboardCard({ departmentNames }: ActionPlanCardProps) {
  const [summary, setSummary] = useState<ActionsSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const scopeKey = departmentNames ? departmentNames.join('|') : '*';

  useEffect(() => {
    let cancelled = false;
    CulteActionService.list({ scope: 'open', departmentNames })
      .then((actions) => {
        if (!cancelled) setSummary(summarizeActions(actions));
      })
      .catch((error) => {
        console.error('Error loading action plan summary:', error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // departmentNames est un tableau recréé à chaque rendu : scopeKey en est l'empreinte stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#00665C]" /> Plan d'actions
          {summary && summary.open > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#00665C] rounded-full">
              {summary.open}
            </span>
          )}
        </h2>
        <Link to="/plan-actions" className="text-xs text-[#00665C] hover:underline flex items-center">
          Gérer <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {failed ? (
        <p className="text-sm text-gray-400">Impossible de charger le plan d'actions pour le moment.</p>
      ) : !summary ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : summary.open === 0 ? (
        <p className="text-sm text-gray-400">Aucune action en cours. 👍</p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {summary.overdue > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              {summary.overdue} en retard
            </span>
          )}
          {summary.toArbitrate > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              {summary.toArbitrate} à arbitrer
            </span>
          )}
          {summary.highPriority > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
              {summary.highPriority} urgente{summary.highPriority > 1 ? 's' : ''}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {summary.open} ouverte{summary.open > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function dayLabel(iso: string): string {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return capitalize(formatDayFr(iso));
}

function EventLine({ event, summary, finished }: { event: CulteEventInfo; summary?: EventSummary; finished: boolean }) {
  const checklist = summary?.checklist;
  const status = finished
    ? summary?.debrief === 'done'
      ? { text: 'Débrief clôturé', cls: 'bg-green-100 text-green-700' }
      : { text: 'Débrief à faire', cls: 'bg-amber-100 text-amber-700' }
    : summary?.brief === 'ready'
      ? { text: 'Brief prêt', cls: 'bg-green-100 text-green-700' }
      : summary?.brief === 'draft'
        ? { text: 'Brief en préparation', cls: 'bg-amber-100 text-amber-700' }
        : { text: 'Brief à préparer', cls: 'bg-gray-100 text-gray-600' };

  return (
    <li>
      <Link to={`/cultes/${event.id}`} className="flex items-center gap-3 py-2 hover:bg-gray-50 -mx-2 px-2 rounded-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate">
            {shortServiceLabel(event.meetingTypeName)}
            <span className="font-normal text-gray-500"> · {formatRangeFr(event.startTime, event.endTime) || 'horaire à définir'}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${status.cls}`}>{status.text}</span>
            {checklist && checklist.total > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${checklist.ok === checklist.total ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {checklist.ok}/{checklist.total} contrôlés
              </span>
            )}
            {checklist && checklist.nok > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">{checklist.nok} non OK</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
      </Link>
    </li>
  );
}

interface CulteGroup {
  date: string;
  events: CulteEventInfo[];
  finished: boolean;
}

/** Un jour de culte est « terminé » quand tous ses cultes le sont : un dimanche, après le 2e culte. */
function groupByDay(events: CulteEventInfo[], now: Date): CulteGroup[] {
  const byDate = new Map<string, CulteEventInfo[]>();
  events.forEach((e) => byDate.set(e.serviceDate, [...(byDate.get(e.serviceDate) ?? []), e]));
  return Array.from(byDate.entries()).map(([date, dayEvents]) => ({
    date,
    events: dayEvents,
    finished: dayEvents.every((e) => isEventFinished(e, now)),
  }));
}

/**
 * Où en est-on dans la boucle hebdomadaire : le prochain jour de culte (brief, contrôle) et, tant que le débrief
 * du dernier jour de culte n'est pas clôturé (le soir même, ou les jours suivants), un rappel pour le faire.
 */
export function UpcomingCultesDashboardCard() {
  const [groups, setGroups] = useState<CulteGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, EventSummary>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await CulteCockpitService.listHubEvents(3, 8);
        const days = groupByDay(list, new Date());
        const next = days.find((d) => !d.finished);
        const last = [...days].reverse().find((d) => d.finished);
        const sums = await CulteCockpitService.getSummaries([...(last?.events ?? []), ...(next?.events ?? [])].map((e) => e.id));
        if (cancelled) return;
        // Le jour terminé n'est montré que si son débrief reste à faire
        const toDebrief = last && last.events.some((e) => sums[e.id]?.debrief !== 'done') ? last : null;
        setSummaries(sums);
        setGroups([toDebrief, next ?? null].filter((g): g is CulteGroup => !!g));
      } catch (error) {
        console.error('Error loading upcoming cultes:', error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-[#00665C]" /> Prochains cultes
        </h2>
        <Link to="/cultes" className="text-xs text-[#00665C] hover:underline flex items-center">
          Ouvrir <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {failed ? (
        <p className="text-sm text-gray-400">Impossible de charger les cultes pour le moment.</p>
      ) : groups === null ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun culte suivi à venir.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {dayLabel(group.date)}
                {group.finished && <span className="ml-1.5 normal-case tracking-normal text-amber-600">· débrief à faire</span>}
              </p>
              <ul className="divide-y divide-gray-100">
                {group.events.map((event) => (
                  <EventLine key={event.id} event={event} summary={summaries[event.id]} finished={isEventFinished(event)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
