import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ActionEditorModal } from '../components/culteBrief/ActionEditorModal';
import { ActionList } from '../components/culteBrief/ActionList';
import { EmptyState, ModuleNotReady, Pill, Spinner, inputCls, primaryBtn } from '../components/culteBrief/ui';
import { useCulteAccess } from '../hooks/useCulteAccess';
import { useCulteModule } from '../hooks/useCulteModule';
import { CulteCockpitService } from '../services/culteBrief.service';
import { CulteActionService, isOverdue, summarizeActions } from '../services/culteAction.service';
import { isActionClosed, type CulteAction } from '../types/culteBrief.types';
import CulteNeedsManagement from './CulteNeedsManagement';

type View = 'all' | 'mine';
type StatusFilter = 'open' | 'closed' | 'all';

/** Page « Plan d'actions » (ancien « Besoins signalés »), ou l'ancienne page tant que le SQL du module n'est pas exécuté. */
export function CulteNeedsOrPlan() {
  const { enabled, loading } = useCulteModule();
  if (loading) return <Spinner />;
  return enabled ? <CulteActionsPlan /> : <CulteNeedsManagement />;
}

export default function CulteActionsPlan() {
  const { enabled, loading: moduleLoading } = useCulteModule();
  const access = useCulteAccess();
  const [actions, setActions] = useState<CulteAction[]>([]);
  const [eventLabels, setEventLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('all');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [department, setDepartment] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyArbitration, setOnlyArbitration] = useState(false);
  const [editing, setEditing] = useState<CulteAction | null>(null);
  const [creating, setCreating] = useState(false);

  const actor = useMemo(() => ({ id: access.userId, name: access.userName }), [access.userId, access.userName]);

  const load = useCallback(async () => {
    try {
      const list = await CulteActionService.list({ scope: 'all' });
      setActions(list);
      setEventLabels(await CulteCockpitService.getEventLabels(list.map((a) => a.eventId ?? '')));
    } catch (error) {
      console.error('Error loading actions:', error);
      toast.error("Erreur lors du chargement du plan d'actions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !access.loading) load();
  }, [enabled, access.loading, load]);

  // Direction : tout le plan. Responsable de département / assistant : ses départements + ce qui lui est confié.
  const visible = useMemo(() => actions.filter((a) => access.canManageAction(a)), [actions, access]);

  const filtered = useMemo(
    () =>
      visible.filter((a) => {
        if (view === 'mine' && a.responsibleId !== access.userId) return false;
        if (status === 'open' && isActionClosed(a.status)) return false;
        if (status === 'closed' && !isActionClosed(a.status)) return false;
        if (department && a.departmentName !== department) return false;
        if (onlyOverdue && !isOverdue(a)) return false;
        if (onlyArbitration && !(a.needsArbitration && !isActionClosed(a.status))) return false;
        return true;
      }),
    [visible, view, status, department, onlyOverdue, onlyArbitration, access.userId]
  );

  const filtersActive = view === 'mine' || !!department || onlyOverdue || onlyArbitration;
  const summary = summarizeActions(visible);
  const mineOpen = visible.filter((a) => a.responsibleId === access.userId && !isActionClosed(a.status)).length;
  const departmentNames = useMemo(() => Array.from(new Set(visible.map((a) => a.departmentName))).sort((a, b) => a.localeCompare(b, 'fr')), [visible]);

  if (moduleLoading) return <Spinner />;
  if (!enabled) return <ModuleNotReady />;
  if (loading || access.loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#00665C]" /> Plan d'actions
          </h1>
          <p className="text-sm text-gray-500 mt-1">Constats, décisions et besoins des cultes, avec un responsable et une échéance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/cultes" className="text-sm text-[#00665C] font-medium hover:underline">Cultes</Link>
          <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>
            <Plus className="w-4 h-4" /> Nouvelle action
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone="gray">{summary.open} ouverte(s)</Pill>
        {summary.overdue > 0 && <Pill tone="red">{summary.overdue} en retard</Pill>}
        {summary.toArbitrate > 0 && <Pill tone="amber">{summary.toArbitrate} à arbitrer</Pill>}
        {summary.highPriority > 0 && <Pill tone="red">{summary.highPriority} priorité haute</Pill>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-lg bg-gray-100 p-1 gap-1" role="tablist" aria-label="Affichage">
            {([['all', 'Toutes'], ['mine', `Mes actions${mineOpen ? ` (${mineOpen})` : ''}`]] as [View, string][]).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} className={`px-3 py-1.5 text-sm rounded-md ${view === key ? 'bg-white shadow-sm font-semibold text-[#00665C]' : 'text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg bg-gray-100 p-1 gap-1" role="tablist" aria-label="Statut">
            {([['open', 'Ouvertes'], ['closed', 'Terminées'], ['all', 'Toutes']] as [StatusFilter, string][]).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={status === key} onClick={() => setStatus(key)} className={`px-3 py-1.5 text-sm rounded-md ${status === key ? 'bg-white shadow-sm font-semibold text-[#00665C]' : 'text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select aria-label="Département" value={department} onChange={(e) => setDepartment(e.target.value)} className={`${inputCls} sm:w-60`}>
            <option value="">Tous les départements</option>
            {departmentNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]" />
            En retard
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={onlyArbitration} onChange={(e) => setOnlyArbitration(e.target.checked)} className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]" />
            À arbitrer
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>{status === 'open' && !filtersActive ? 'Aucune action ouverte. 👍' : 'Aucune action ne correspond à ces filtres.'}</EmptyState>
      ) : (
        <ActionList
          actions={filtered}
          actor={actor}
          canManage={access.canManageAction}
          eventLabels={eventLabels}
          onEdit={setEditing}
          onChanged={load}
        />
      )}

      <ActionEditorModal
        isOpen={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={load}
        actor={actor}
        action={editing}
        allowedDepartmentNames={access.allowedActionDepartments}
      />
    </div>
  );
}
