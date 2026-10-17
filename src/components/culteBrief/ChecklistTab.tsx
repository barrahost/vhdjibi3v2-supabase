import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, ChevronDown, ChevronRight, ClipboardPlus, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { BRIEF_REGIE_QUESTION } from '../../data/culteGuide';
import { supabase } from '../../lib/supabase';
import { addDaysISO, compareEventsInDay, formatRangeFr, formatTimeFr, getPreparationWindow, shortServiceLabel } from '../../lib/culteTiming';
import { checklistProgress, CulteChecklistService } from '../../services/culteChecklist.service';
import { CulteActionService } from '../../services/culteAction.service';
import { CulteDirectory } from '../../services/culteDirectory.service';
import { CulteNotifyService } from '../../services/culteNotify.service';
import type { ChecklistItem, ChecklistStatus, CulteAction } from '../../types/culteBrief.types';
import { ActionEditorModal, type ActionDraft } from './ActionEditorModal';
import type { CockpitTabProps } from './tabTypes';
import { Card, EmptyState, Pill, ProgressBar, Spinner, inputCls } from './ui';

interface DepartmentGroup {
  name: string;
  id: string | null;
  items: ChecklistItem[];
}

const POLL_MS = 30_000;

export function ChecklistTab({ event, dayEvents, access, onChanged }: CockpitTabProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [carryItems, setCarryItems] = useState<ChecklistItem[]>([]);
  const [carryActions, setCarryActions] = useState<CulteAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [actionDraft, setActionDraft] = useState<ActionDraft | null>(null);
  const [newTask, setNewTask] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const actor = useMemo(() => ({ id: access.userId, name: access.userName }), [access.userId, access.userName]);
  const earlier = useMemo(
    () => dayEvents.filter((e) => e.id !== event.id && compareEventsInDay(e, event) < 0),
    [dayEvents, event]
  );
  const previous = earlier[earlier.length - 1] ?? null;
  const prepWindow = useMemo(() => getPreparationWindow(event, previous), [event, previous]);

  const load = useCallback(
    async (ensure = false) => {
      try {
        if (ensure) await CulteChecklistService.ensureForEvent(event, dayEvents);
        const list = await CulteChecklistService.list(event.id);
        setItems(list);

        if (earlier.length > 0) {
          const earlierIds = earlier.map((e) => e.id);
          const [nok, actions] = await Promise.all([
            CulteChecklistService.listNok(earlierIds),
            CulteActionService.list({ scope: 'open', eventIds: earlierIds }),
          ]);
          setCarryItems(nok);
          setCarryActions(actions);
        } else {
          setCarryItems([]);
          setCarryActions([]);
        }
      } catch (error) {
        console.error('Error loading checklist:', error);
        toast.error('Erreur lors du chargement du contrôle');
      } finally {
        setLoading(false);
      }
    },
    [event, dayEvents, earlier]
  );

  useEffect(() => {
    setLoading(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  // Temps réel : le pasteur voit les points se cocher pendant que les responsables les vérifient.
  // L'actualisation est ignorée tant qu'une saisie est en cours dans la liste, pour ne pas l'écraser.
  useEffect(() => {
    const refresh = () => {
      const active = document.activeElement;
      if (active && containerRef.current?.contains(active) && /^(INPUT|TEXTAREA)$/.test(active.tagName)) return;
      load(false);
    };
    const channel = supabase
      .channel(`culte-checklist-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'culte_checklist_items', filter: `event_id=eq.${event.id}` }, refresh)
      .subscribe();
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [event.id, load]);

  const groups = useMemo<DepartmentGroup[]>(() => {
    const map = new Map<string, DepartmentGroup>();
    items.forEach((item) => {
      const group = map.get(item.departmentName) ?? { name: item.departmentName, id: item.departmentId, items: [] };
      group.items.push(item);
      map.set(item.departmentName, group);
    });
    return Array.from(map.values()).sort((a, b) => {
      const ea = access.canEditDepartment(a.id) ? 0 : 1;
      const eb = access.canEditDepartment(b.id) ? 0 : 1;
      return ea - eb || a.name.localeCompare(b.name, 'fr');
    });
  }, [items, access]);

  const total = checklistProgress(items);

  // Points « non OK » d'un culte précédent du jour qui ne sont pas encore corrigés ici
  const unresolvedCarry = useMemo(
    () =>
      carryItems.filter((c) => {
        const current = c.templateId ? items.find((i) => i.templateId === c.templateId) : null;
        return !current || current.status !== 'ok';
      }),
    [carryItems, items]
  );

  const patchItem = (updated: ChecklistItem) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

  const handleStatus = async (item: ChecklistItem, status: ChecklistStatus) => {
    const next: ChecklistStatus = item.status === status ? 'pending' : status;
    const before = item;
    patchItem({ ...item, status: next, inherited: false, checkedByName: access.userName });
    try {
      patchItem(await CulteChecklistService.setStatus(item.id, next, actor));
      onChanged?.();
      if (next === 'nok' && before.status !== 'nok') {
        const audience = await CulteDirectory.managersAudience();
        void CulteNotifyService.notifyUsers(
          audience.map((u) => u.id),
          { title: 'Point de contrôle non OK', body: `${item.departmentName} : ${item.task}`, url: `/cultes/${event.id}?tab=controle` },
          { excludeUserId: access.userId }
        );
      }
    } catch (error: any) {
      patchItem(before);
      toast.error(error?.message || 'Erreur lors de la mise à jour du point');
    }
  };

  const handleUpdate = async (item: ChecklistItem, patch: { observation?: string; responsibleName?: string }) => {
    try {
      patchItem(await CulteChecklistService.update(item.id, patch));
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleAdd = async (group: DepartmentGroup) => {
    const task = (newTask[group.name] ?? '').trim();
    if (!task) return;
    try {
      const created = await CulteChecklistService.addCustom(event.id, { id: group.id, name: group.name }, task);
      setItems((prev) => [...prev, created]);
      setNewTask((prev) => ({ ...prev, [group.name]: '' }));
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'ajout du point");
    }
  };

  const handleDelete = async (item: ChecklistItem) => {
    try {
      await CulteChecklistService.remove(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression');
    }
  };

  const openActionFor = (item: ChecklistItem) =>
    setActionDraft({
      eventId: event.id,
      source: 'controle',
      departmentName: item.departmentName,
      description: `${item.task}${item.observation ? ` — ${item.observation}` : ''}`,
    });

  if (loading) return <Spinner />;

  return (
    <div ref={containerRef} className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {prepWindow ? prepWindow.label : 'Contrôle de préparation'}
              {prepWindow && <span className="ml-2 font-normal text-gray-500">{formatTimeFr(prepWindow.opensAt)} – {formatTimeFr(prepWindow.closesAt)}</span>}
            </p>
            <p className="text-sm text-[#00665C] mt-0.5">
              {prepWindow?.betweenServices
                ? 'Les points à corriger sont-ils réglés avant le prochain culte ?'
                : BRIEF_REGIE_QUESTION.replace('6 h 00', prepWindow ? formatTimeFr(prepWindow.opensAt) : "l'heure de contrôle")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Pill tone="green">{total.ok} OK</Pill>
            {total.nok > 0 && <Pill tone="red">{total.nok} non OK</Pill>}
            <Pill tone="gray">{total.pending} à vérifier</Pill>
          </div>
        </div>
        <ProgressBar progress={total} />
      </Card>

      {(unresolvedCarry.length > 0 || carryActions.length > 0) && previous && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle className="w-4 h-4" /> À corriger depuis le {shortServiceLabel(previous.meetingTypeName)} ({formatRangeFr(previous.startTime, previous.endTime)})
          </p>
          <ul className="space-y-1 text-sm text-red-900">
            {unresolvedCarry.map((c) => (
              <li key={c.id}>
                <strong>{c.departmentName}</strong> — {c.task}
                {c.observation && <span className="text-red-700"> ({c.observation})</span>}
              </li>
            ))}
            {carryActions.map((a) => (
              <li key={a.id}>
                <strong>{a.departmentName}</strong> — {a.decision || a.description}
                {a.responsibleName && <span className="text-red-700"> → {a.responsibleName}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState>
          Aucun point de contrôle n'est défini pour l'instant.
          {access.isManager && (
            <>
              {' '}
              <Link to="/parametres-controle" className="text-[#00665C] font-medium hover:underline">
                Configurer les modèles de contrôle
              </Link>
            </>
          )}
        </EmptyState>
      ) : (
        groups.map((group) => {
          const progress = checklistProgress(group.items);
          const canEdit = access.canEditDepartment(group.id);
          // Dépliée d'office : mon département et toute rubrique qui a un « non OK ». Les autres restent
          // repliées avec leur barre de progression : la direction voit l'ensemble d'un coup d'œil.
          const isOwn = !!group.id && access.managedDepartmentIds.includes(group.id);
          const isCollapsed = collapsed[group.name] ?? !(isOwn || progress.nok > 0);
          return (
            <Card key={group.name}>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [group.name]: !isCollapsed }))}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                  <div className="mt-1.5"><ProgressBar progress={progress} /></div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-medium text-gray-600">{progress.ok}/{progress.total}</span>
                  {progress.nok > 0 && <Pill tone="red">{progress.nok} non OK</Pill>}
                </div>
              </button>

              {!isCollapsed && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {group.items.map((item) => (
                    <ChecklistRow
                      key={`${item.id}-${item.status}-${item.observation ?? ''}-${item.responsibleName ?? ''}`}
                      item={item}
                      canEdit={canEdit}
                      inheritedFrom={previous ? shortServiceLabel(previous.meetingTypeName) : 'culte précédent'}
                      onStatus={(status) => handleStatus(item, status)}
                      onUpdate={(patch) => handleUpdate(item, patch)}
                      onCreateAction={() => openActionFor(item)}
                      onDelete={item.templateId ? undefined : () => handleDelete(item)}
                    />
                  ))}
                  {canEdit && (
                    <form
                      className="flex items-center gap-2 px-4 py-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAdd(group);
                      }}
                    >
                      <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={newTask[group.name] ?? ''}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, [group.name]: e.target.value }))}
                        placeholder="Ajouter un point pour ce culte seulement…"
                        className={inputCls}
                      />
                    </form>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}

      <ActionEditorModal
        isOpen={!!actionDraft}
        onClose={() => setActionDraft(null)}
        onSaved={() => {
          onChanged?.();
          load(false);
        }}
        actor={{ id: access.userId, name: access.userName }}
        draft={actionDraft ?? undefined}
        nextServiceDate={addDaysISO(event.serviceDate, 7)}
      />
    </div>
  );
}

interface ChecklistRowProps {
  item: ChecklistItem;
  canEdit: boolean;
  /** Culte dont le point a été repris (ex. « 1er culte »). */
  inheritedFrom: string;
  onStatus: (status: ChecklistStatus) => void;
  onUpdate: (patch: { observation?: string; responsibleName?: string }) => void;
  onCreateAction: () => void;
  onDelete?: () => void;
}

function ChecklistRow({ item, canEdit, inheritedFrom, onStatus, onUpdate, onCreateAction, onDelete }: ChecklistRowProps) {
  const isNok = item.status === 'nok';
  const showDetails = isNok || !!item.observation || !!item.responsibleName;

  return (
    <div className={`px-4 py-3 ${isNok ? 'bg-red-50/50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900">{item.task}</p>
          {item.indicator && <p className="text-xs text-gray-500 mt-0.5">Objectif : {item.indicator}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.inherited && <Pill tone="blue" title="Vérifié lors du culte précédent du jour">Repris du {inheritedFrom}</Pill>}
            {item.status !== 'pending' && item.checkedByName && <span className="text-xs text-gray-400">par {item.checkedByName}</span>}
          </div>
        </div>

        <div className="flex gap-1.5 flex-shrink-0" role="group" aria-label={`Statut : ${item.task}`}>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onStatus('ok')}
            aria-pressed={item.status === 'ok'}
            aria-label="OK"
            className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
              item.status === 'ok' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-600'
            } disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-400`}
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onStatus('nok')}
            aria-pressed={item.status === 'nok'}
            aria-label="Non OK"
            className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
              item.status === 'nok' ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-600'
            } disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-400`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <textarea
            rows={2}
            defaultValue={item.observation ?? ''}
            disabled={!canEdit}
            placeholder="Observation / action immédiate"
            aria-label="Observation"
            onBlur={(e) => e.target.value !== (item.observation ?? '') && onUpdate({ observation: e.target.value })}
            className={inputCls}
          />
          <input
            type="text"
            defaultValue={item.responsibleName ?? ''}
            disabled={!canEdit}
            placeholder="Responsable"
            aria-label="Responsable"
            onBlur={(e) => e.target.value !== (item.responsibleName ?? '') && onUpdate({ responsibleName: e.target.value })}
            className={inputCls}
          />
        </div>
      )}

      {(isNok || onDelete) && canEdit && (
        <div className="mt-2 flex items-center gap-3">
          {isNok && (
            <button type="button" onClick={onCreateAction} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00665C] hover:underline">
              <ClipboardPlus className="w-4 h-4" /> Créer une action
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 ml-auto">
              <Trash2 className="w-3.5 h-3.5" /> Retirer ce point
            </button>
          )}
        </div>
      )}
    </div>
  );
}
