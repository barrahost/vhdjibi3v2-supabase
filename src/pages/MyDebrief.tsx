import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { useCulteModule } from '../hooks/useCulteModule';
import { CulteCockpitService } from '../services/culteBrief.service';
import { CulteDebriefService, isDebriefSheetEmpty } from '../services/culteDebrief.service';
import { capitalize, compareEventsInDay, formatDayFr, formatRangeFr, isEventFinished, shortServiceLabel, todayISO } from '../lib/culteTiming';
import type { CulteEventInfo } from '../types/culteBrief.types';
import { DEPARTMENT_TO_REPORT_TYPE, normalizeDeptName } from '../types/culteReport.types';

interface Row {
  event: CulteEventInfo;
  /** Départements du responsable dont la fiche est remplie pour ce culte. */
  done: Set<string>;
}

/**
 * « Mon débrief » : pour les départements qui n'ont pas de rapport de culte à eux (Accueil, Louange…), la fiche
 * de débrief du département tient lieu de rapport. Le responsable voit les cultes récents, ce qui est fait et ce
 * qui reste à faire, et ouvre sa fiche en un geste — comme « Faire mon rapport » pour les autres départements.
 */
export default function MyDebrief() {
  const { user } = useAuth();
  const { enabled, loading: moduleLoading } = useCulteModule();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (moduleLoading) return;
    if (!enabled) {
      setState('ready');
      return;
    }
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const profile = ((user as any)?.businessProfiles ?? []).find((p: any) => p?.type === 'department_leader');
        const ids = getProfileDepartmentIds(profile);
        let depts: { id: string; name: string }[] = [];
        if (ids.length > 0) {
          const { data, error } = await supabase.from('departments').select('id, name').eq('church_id', getChurchId()).in('id', ids);
          if (error) throw error;
          // Les départements qui ont leur rapport de culte (Emmeraude, ADN…) font leur débrief dans le rapport
          depts = ((data ?? []) as { id: string; name: string }[]).filter((d) => !DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(d.name)]);
        }
        // Cultes passés (3 semaines) et du jour, du plus récent au plus ancien
        const today = todayISO();
        const events = (await CulteCockpitService.listHubEvents(21, 0))
          .filter((e) => e.serviceDate <= today)
          .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate) || compareEventsInDay(b, a));
        const names = new Set(depts.map((d) => d.name));
        const withSheets = await Promise.all(
          events.map(async (event) => {
            const sheets = await CulteDebriefService.list(event.id);
            const done = new Set(
              sheets
                .filter((s) => names.has(s.departmentName) && !isDebriefSheetEmpty({ positives: s.positives, difficulties: s.difficulties, causes: s.causes, needs: s.needs, solutions: s.solutions }))
                .map((s) => s.departmentName),
            );
            return { event, done };
          }),
        );
        if (cancelled) return;
        setDepartments(depts);
        setRows(withSheets);
        setState('ready');
      } catch (error) {
        console.error('Error loading my debriefs:', error);
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, enabled, moduleLoading, attempt]);

  const todo = useMemo(
    () => rows.reduce((n, row) => n + departments.filter((d) => !row.done.has(d.name) && isEventFinished(row.event)).length, 0),
    [rows, departments],
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6 text-[#00665C]" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Mon débrief</h1>
      </div>
      <p className="text-sm text-gray-600">
        Après chaque culte, remplissez la fiche de débrief de votre département : ce qui a bien marché, les difficultés et leurs
        causes, vos besoins et les solutions. Chaque besoin devient une action du plan, suivie jusqu’au prochain culte.
      </p>

      {(state === 'loading' || moduleLoading) && <p className="text-center py-8 text-gray-500">Chargement des cultes…</p>}

      {state === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">Impossible de charger les cultes. Vérifiez votre connexion internet.</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="px-3 py-1.5 text-sm font-medium text-white bg-[#00665C] rounded-md">
            Réessayer
          </button>
        </div>
      )}

      {state === 'ready' && !moduleLoading && !enabled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
          Le suivi des cultes (brief et débrief) n’est pas encore activé dans l’application. Contactez un administrateur.
        </div>
      )}

      {state === 'ready' && enabled && departments.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
          Aucun département n’est associé à votre compte. Contactez un administrateur.
        </div>
      )}

      {state === 'ready' && enabled && departments.length > 0 && (
        <>
          {todo > 0 && (
            <p className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {todo} fiche(s) de débrief à remplir.
            </p>
          )}
          {rows.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Aucun culte suivi ces trois dernières semaines.</p>
          ) : (
            <ul className="space-y-2" data-testid="my-debrief-list">
              {rows.map(({ event, done }) => (
                <li key={event.id} className="bg-white border rounded-lg p-3 sm:p-4 shadow-sm">
                  <p className="font-semibold text-gray-900">
                    {capitalize(formatDayFr(event.serviceDate))} · {shortServiceLabel(event.meetingTypeName)}
                  </p>
                  <p className="text-xs text-gray-500">{formatRangeFr(event.startTime, event.endTime)}</p>
                  <div className="mt-2 space-y-2">
                    {departments.map((d) => {
                      const isDone = done.has(d.name);
                      return (
                        <Link
                          key={d.id}
                          to={`/cultes/${event.id}?tab=debrief&departement=${encodeURIComponent(d.name)}`}
                          className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${
                            isDone ? 'border-green-200 bg-green-50' : 'border-[#00665C]/40 bg-[#00665C]/5 hover:bg-[#00665C]/10'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <ClipboardCheck className="w-5 h-5 text-[#00665C] flex-shrink-0" />}
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-gray-900 break-words">{d.name}</span>
                            <span className={`block text-xs ${isDone ? 'text-green-700' : 'text-[#00665C]'}`}>
                              {isDone ? 'Fiche remplie — voir ou compléter' : isEventFinished(event) ? 'Remplir la fiche de débrief' : 'Culte en cours — fiche à remplir après le culte'}
                            </span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
