import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { CulteActionService } from '../../services/culteAction.service';
import { CulteDirectory, type DirectoryDepartment } from '../../services/culteDirectory.service';
import { addDaysISO, todayISO } from '../../lib/culteTiming';
import type { ActionPriority, ActionSource, CulteAction } from '../../types/culteBrief.types';
import { ACTION_PRIORITY_LABELS } from '../../types/culteBrief.types';
import { UserPicker, type PickedUser } from './UserPicker';
import { inputCls, labelCls, primaryBtn, secondaryBtn } from './ui';

export interface ActionDraft {
  eventId?: string | null;
  reportId?: string | null;
  source?: ActionSource;
  departmentName?: string;
  description?: string;
  cause?: string;
  decision?: string;
}

interface ActionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (action: CulteAction) => void;
  actor: { id: string | null; name: string };
  /** Action existante à modifier ; sinon une nouvelle action est créée à partir de `draft`. */
  action?: CulteAction | null;
  draft?: ActionDraft;
  /** Date proposée comme échéance « avant le prochain culte ». */
  nextServiceDate?: string;
  /** Départements que l'utilisateur peut choisir (tous si absent). */
  allowedDepartmentNames?: string[];
}

export function ActionEditorModal({ isOpen, onClose, onSaved, actor, action, draft, nextServiceDate, allowedDepartmentNames }: ActionEditorModalProps) {
  const [departments, setDepartments] = useState<DirectoryDepartment[]>([]);
  const [departmentName, setDepartmentName] = useState('');
  const [description, setDescription] = useState('');
  const [cause, setCause] = useState('');
  const [decision, setDecision] = useState('');
  const [responsible, setResponsible] = useState<PickedUser>({ id: null, name: null });
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<ActionPriority>('medium');
  const [needsArbitration, setNeedsArbitration] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CulteDirectory.departments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  // (Ré)initialise le formulaire à chaque ouverture. `draft` n'est lu qu'à l'ouverture : un objet
  // recréé à chaque rendu du parent ne doit pas effacer ce que l'utilisateur est en train de saisir.
  useEffect(() => {
    if (!isOpen) return;
    setDepartmentName(action?.departmentName ?? draft?.departmentName ?? '');
    setDescription(action?.description ?? draft?.description ?? '');
    setCause(action?.cause ?? draft?.cause ?? '');
    setDecision(action?.decision ?? draft?.decision ?? '');
    setResponsible({ id: action?.responsibleId ?? null, name: action?.responsibleName ?? null });
    setDueDate(action?.dueDate ?? '');
    setPriority(action?.priority ?? 'medium');
    setNeedsArbitration(action?.needsArbitration ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, action?.id]);

  const departmentOptions = allowedDepartmentNames?.length
    ? departments.filter((d) => allowedDepartmentNames.includes(d.name))
    : departments;
  const departmentId = departments.find((d) => d.name === departmentName)?.id ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) return toast.error('Choisissez le département concerné');
    if (!description.trim() && !decision.trim()) return toast.error('Décrivez le constat ou l\'action à mener');

    setSaving(true);
    try {
      const fields = {
        departmentName: departmentName.trim(),
        description: description.trim() || decision.trim(),
        cause: cause.trim() || null,
        decision: decision.trim() || null,
        responsibleId: responsible.id,
        responsibleName: responsible.name,
        dueDate: dueDate || null,
        priority,
        needsArbitration,
      };
      const saved = action
        ? await CulteActionService.update(action.id, fields, actor)
        : await CulteActionService.create(
            { eventId: draft?.eventId ?? null, reportId: draft?.reportId ?? null, source: draft?.source ?? 'manuel', ...fields },
            actor
          );
      toast.success(action ? 'Action mise à jour' : 'Action ajoutée au plan');
      onSaved(saved);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement de l'action");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={action ? "Modifier l'action" : 'Nouvelle action'}>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <div>
          <label htmlFor="action-department" className={labelCls}>Département concerné</label>
          <select id="action-department" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} className={inputCls} required>
            <option value="">-- Sélectionner --</option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
            {departmentName && !departmentOptions.some((d) => d.name === departmentName) && (
              <option value={departmentName}>{departmentName}</option>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="action-description" className={labelCls}>Constat ou besoin</label>
          <textarea id="action-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="ex : Micros HF non chargés à l'arrivée" />
        </div>
        <div>
          <label htmlFor="action-cause" className={labelCls}>Cause identifiée <span className="text-gray-400 font-normal">(facultatif)</span></label>
          <textarea id="action-cause" rows={2} value={cause} onChange={(e) => setCause(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="action-decision" className={labelCls}>Décision ou action à mener</label>
          <textarea id="action-decision" rows={2} value={decision} onChange={(e) => setDecision(e.target.value)} className={inputCls} placeholder="ex : Mettre les micros en charge chaque samedi soir" />
        </div>

        <div>
          <label htmlFor="action-responsible" className={labelCls}>Responsable</label>
          <UserPicker inputId="action-responsible" value={responsible} onChange={setResponsible} suggestedDepartmentId={departmentId} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="action-due" className={labelCls}>Échéance</label>
            <input id="action-due" type="date" value={dueDate} min={action ? undefined : todayISO()} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {nextServiceDate && (
                <button type="button" onClick={() => setDueDate(nextServiceDate)} className="text-[#00665C] hover:underline">
                  Avant le prochain culte
                </button>
              )}
              <button type="button" onClick={() => setDueDate(addDaysISO(todayISO(), 7))} className="text-[#00665C] hover:underline">
                Dans 1 semaine
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="action-priority" className={labelCls}>Priorité</label>
            <select id="action-priority" value={priority} onChange={(e) => setPriority(e.target.value as ActionPriority)} className={inputCls}>
              {(Object.keys(ACTION_PRIORITY_LABELS) as ActionPriority[]).map((p) => (
                <option key={p} value={p}>{ACTION_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={needsArbitration} onChange={(e) => setNeedsArbitration(e.target.checked)} className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]" />
          À arbitrer par la direction
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={`${secondaryBtn} flex-1`}>Annuler</button>
          <button type="submit" disabled={saving} className={`${primaryBtn} flex-1`}>
            {saving ? 'Enregistrement…' : action ? 'Enregistrer' : "Ajouter l'action"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
