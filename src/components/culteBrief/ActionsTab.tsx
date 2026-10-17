import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { addDaysISO, formatDayFr } from '../../lib/culteTiming';
import { CulteActionService, summarizeActions } from '../../services/culteAction.service';
import { CulteDirectory } from '../../services/culteDirectory.service';
import type { CulteAction } from '../../types/culteBrief.types';
import { ActionEditorModal } from './ActionEditorModal';
import { ActionList } from './ActionList';
import type { CockpitTabProps } from './tabTypes';
import { EmptyState, Pill, Spinner, primaryBtn } from './ui';

/** Actions nées de ce culte (contrôle, débrief, ajout manuel) ; le plan complet est dans « Plan d'actions ». */
export function ActionsTab({ event, access, onChanged }: CockpitTabProps) {
  const [actions, setActions] = useState<CulteAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CulteAction | null>(null);
  const [creating, setCreating] = useState(false);
  const [managedNames, setManagedNames] = useState<string[]>([]);

  const actor = useMemo(() => ({ id: access.userId, name: access.userName }), [access.userId, access.userName]);

  const load = useCallback(async () => {
    try {
      setActions(await CulteActionService.list({ eventId: event.id, scope: 'all' }));
    } catch (error) {
      console.error('Error loading actions:', error);
      toast.error('Erreur lors du chargement des actions');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    CulteDirectory.departments()
      .then((departments) => setManagedNames(departments.filter((d) => access.managedDepartmentIds.includes(d.id)).map((d) => d.name)))
      .catch(() => undefined);
  }, [access.managedDepartmentIds]);

  const canManage = (action: CulteAction) =>
    access.isManager || action.responsibleId === access.userId || managedNames.includes(action.departmentName);

  const summary = summarizeActions(actions);
  const eventLabels = { [event.id]: formatDayFr(event.serviceDate) };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="gray">{summary.open} ouverte(s)</Pill>
          {summary.overdue > 0 && <Pill tone="red">{summary.overdue} en retard</Pill>}
          {summary.toArbitrate > 0 && <Pill tone="amber">{summary.toArbitrate} à arbitrer</Pill>}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/plan-actions" className="text-sm text-[#00665C] font-medium hover:underline">Voir tout le plan</Link>
          <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>
            <Plus className="w-4 h-4" /> Ajouter une action
          </button>
        </div>
      </div>

      {actions.length === 0 ? (
        <EmptyState>Aucune action liée à ce culte pour l'instant. Elles naissent d'un point « non OK » du contrôle ou d'une décision du débrief.</EmptyState>
      ) : (
        <ActionList
          actions={actions}
          actor={actor}
          canManage={canManage}
          eventLabels={eventLabels}
          onEdit={setEditing}
          onChanged={() => {
            load();
            onChanged?.();
          }}
        />
      )}

      <ActionEditorModal
        isOpen={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          load();
          onChanged?.();
        }}
        actor={actor}
        action={editing}
        draft={{ eventId: event.id, source: 'manuel' }}
        nextServiceDate={addDaysISO(event.serviceDate, 7)}
      />
    </div>
  );
}
