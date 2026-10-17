import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { BriefTab } from '../components/culteBrief/BriefTab';
import { ChecklistTab } from '../components/culteBrief/ChecklistTab';
import { DebriefTab } from '../components/culteBrief/DebriefTab';
import { ActionsTab } from '../components/culteBrief/ActionsTab';
import { EmptyState, ModuleNotReady, Spinner } from '../components/culteBrief/ui';
import { useCulteAccess } from '../hooks/useCulteAccess';
import { useCulteModule } from '../hooks/useCulteModule';
import { capitalize, formatDayFr, formatRangeFr, formatTimeFr, getEventPhase, shortServiceLabel } from '../lib/culteTiming';
import { CulteCockpitService, type EventSummary } from '../services/culteBrief.service';
import type { CulteEventInfo } from '../types/culteBrief.types';

type TabKey = 'brief' | 'controle' | 'debrief' | 'actions';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'brief', label: 'Brief' },
  { key: 'controle', label: 'Contrôle' },
  { key: 'debrief', label: 'Débrief' },
  { key: 'actions', label: 'Actions' },
];

const isTabKey = (value: string | null): value is TabKey => TABS.some((t) => t.key === value);

export default function CulteCockpit() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enabled, loading: moduleLoading } = useCulteModule();
  const access = useCulteAccess();

  const [event, setEvent] = useState<CulteEventInfo | null>(null);
  const [dayEvents, setDayEvents] = useState<CulteEventInfo[]>([]);
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    if (!eventId) return;
    try {
      const summaries = await CulteCockpitService.getSummaries([eventId]);
      setSummary(summaries[eventId] ?? null);
    } catch (error) {
      console.error('Error loading event summary:', error);
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || !eventId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const info = await CulteCockpitService.getEventInfo(eventId);
        if (cancelled) return;
        setEvent(info);
        if (info) {
          const siblings = await CulteCockpitService.getDayEvents(info.serviceDate);
          if (cancelled) return;
          setDayEvents(siblings.some((e) => e.id === info.id) ? siblings : [...siblings, info]);
          await loadSummary();
        }
      } catch (error) {
        console.error('Error loading event:', error);
        toast.error('Erreur lors du chargement du culte');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, eventId, loadSummary]);

  const requestedTab = searchParams.get('tab');
  const defaultTab = useMemo<TabKey>(() => {
    if (!event) return 'brief';
    const phase = getEventPhase(event);
    return phase === 'before' ? 'brief' : phase === 'during' ? 'controle' : 'debrief';
  }, [event]);
  const tab: TabKey = isTabKey(requestedTab) ? requestedTab : defaultTab;

  const selectTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  if (moduleLoading) return <Spinner />;
  if (!enabled) return <ModuleNotReady />;
  if (loading || access.loading) return <Spinner />;
  if (!event) return <EmptyState>Ce culte est introuvable.</EmptyState>;

  const badge = (key: TabKey): { text: string; tone: string } | null => {
    if (!summary) return null;
    if (key === 'controle') {
      if (summary.checklist.nok > 0) return { text: String(summary.checklist.nok), tone: 'bg-red-500 text-white' };
      if (summary.checklist.pending > 0) return { text: String(summary.checklist.pending), tone: 'bg-gray-200 text-gray-700' };
    }
    if (key === 'actions' && summary.actionsOpen > 0) {
      return { text: String(summary.actionsOpen), tone: summary.actionsOverdue > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700' };
    }
    if (key === 'brief' && summary.brief === 'ready') return { text: '✓', tone: 'bg-green-500 text-white' };
    return null;
  };

  const tabProps = { event, dayEvents, access, onChanged: loadSummary };

  return (
    <div className="space-y-4">
      <div>
        <Link to="/cultes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00665C]">
          <ArrowLeft className="w-4 h-4" /> Cultes
        </Link>
        <h1 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{event.meetingTypeName}</h1>
        <p className="text-sm text-gray-500">
          {capitalize(formatDayFr(event.serviceDate))}
          {event.startTime && ` · ${formatRangeFr(event.startTime, event.endTime)}`}
        </p>

        {dayEvents.length > 1 && (
          <div className="mt-3 inline-flex rounded-lg bg-gray-100 p-1 gap-1" role="tablist" aria-label="Cultes du jour">
            {dayEvents.map((e) => (
              <Link
                key={e.id}
                to={`/cultes/${e.id}?tab=${tab}`}
                role="tab"
                aria-selected={e.id === event.id}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  e.id === event.id ? 'bg-white shadow-sm font-semibold text-[#00665C]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {shortServiceLabel(e.meetingTypeName)}
                {e.startTime && <span className="ml-1.5 text-xs text-gray-400">{formatTimeFr(e.startTime)}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto" role="tablist">
        {TABS.map((t) => {
          const b = badge(t.key);
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => selectTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.key ? 'border-[#00665C] text-[#00665C]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
              {b && <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] leading-[18px] text-center font-semibold ${b.tone}`}>{b.text}</span>}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {tab === 'brief' && <BriefTab {...tabProps} />}
        {tab === 'controle' && <ChecklistTab {...tabProps} />}
        {tab === 'debrief' && <DebriefTab {...tabProps} />}
        {tab === 'actions' && <ActionsTab {...tabProps} />}
      </div>
    </div>
  );
}
