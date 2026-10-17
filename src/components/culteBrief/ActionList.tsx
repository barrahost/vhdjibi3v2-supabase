import { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Pencil, Play, RotateCcw, Trash2, User, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateFr } from '../../lib/culteTiming';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { CulteActionService, isOverdue } from '../../services/culteAction.service';
import {
  ACTION_PRIORITY_LABELS,
  ACTION_SOURCE_LABELS,
  ACTION_STATUS_LABELS,
  actionTitle,
  isActionClosed,
  type ActionStatus,
  type CulteAction,
} from '../../types/culteBrief.types';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Pill } from './ui';

interface ActionListProps {
  actions: CulteAction[];
  actor: { id: string | null; name: string };
  /** Peut-il modifier/supprimer cette action ? (responsable, direction, département concerné) */
  canManage: (action: CulteAction) => boolean;
  onEdit: (action: CulteAction) => void;
  onChanged: (updated?: CulteAction, removedId?: string) => void;
  /** Libellé du culte d'origine, si connu (id de culte → texte). */
  eventLabels?: Record<string, string>;
}

const STATUS_TONE: Record<ActionStatus, 'gray' | 'blue' | 'green' | 'amber'> = {
  todo: 'gray',
  in_progress: 'blue',
  done: 'green',
  dropped: 'amber',
};

export function ActionList({ actions, actor, canManage, onEdit, onChanged, eventLabels }: ActionListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const { confirm, confirmModalProps } = useConfirmModal();

  const changeStatus = async (action: CulteAction, status: ActionStatus) => {
    setBusyId(action.id);
    try {
      const updated = await CulteActionService.setStatus(action.id, status, actor);
      onChanged(updated);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la mise à jour');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (action: CulteAction) => {
    if (!(await confirm('Supprimer définitivement cette action ?', { title: "Supprimer l'action", confirmLabel: 'Supprimer' }))) return;
    setBusyId(action.id);
    try {
      await CulteActionService.remove(action.id);
      onChanged(undefined, action.id);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <ul className="space-y-2">
        {actions.map((action) => {
          const closed = isActionClosed(action.status);
          const overdue = isOverdue(action);
          const editable = canManage(action);
          const title = actionTitle(action);
          const context = action.decision && action.description !== action.decision ? action.description : null;
          return (
            <li key={action.id} className={`bg-white rounded-xl border p-4 ${overdue ? 'border-red-300' : 'border-gray-200'} ${closed ? 'opacity-75' : ''}`}>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <Pill tone={STATUS_TONE[action.status]}>{ACTION_STATUS_LABELS[action.status]}</Pill>
                <span className="text-sm font-medium text-gray-700">{action.departmentName}</span>
                {action.priority === 'high' && <Pill tone="red">Priorité {ACTION_PRIORITY_LABELS.high.toLowerCase()}</Pill>}
                {action.needsArbitration && !closed && <Pill tone="amber"><AlertCircle className="w-3 h-3" /> À arbitrer</Pill>}
                {overdue && <Pill tone="red">En retard</Pill>}
              </div>

              <p className={`text-sm text-gray-900 ${closed ? 'line-through decoration-gray-400' : ''}`}>{title}</p>
              {context && <p className="text-xs text-gray-500 mt-1">Constat : {context}</p>}
              {action.cause && <p className="text-xs text-gray-500">Cause : {action.cause}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {action.responsibleName || 'Pas de responsable'}</span>
                <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                  <Calendar className="w-3.5 h-3.5" /> {action.dueDate ? `avant le ${formatDateFr(action.dueDate)}` : 'Sans échéance'}
                </span>
                <span>
                  {ACTION_SOURCE_LABELS[action.source]}
                  {action.eventId && eventLabels?.[action.eventId] ? ` · ${eventLabels[action.eventId]}` : ''}
                </span>
              </div>

              {editable && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {action.status === 'todo' && (
                    <button type="button" disabled={busyId === action.id} onClick={() => changeStatus(action, 'in_progress')} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md">
                      <Play className="w-3.5 h-3.5" /> Démarrer
                    </button>
                  )}
                  {!closed && (
                    <button type="button" disabled={busyId === action.id} onClick={() => changeStatus(action, 'done')} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terminer
                    </button>
                  )}
                  {!closed && (
                    <button type="button" disabled={busyId === action.id} onClick={() => changeStatus(action, 'dropped')} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md">
                      <XCircle className="w-3.5 h-3.5" /> Abandonner
                    </button>
                  )}
                  {closed && (
                    <button type="button" disabled={busyId === action.id} onClick={() => changeStatus(action, 'todo')} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md">
                      <RotateCcw className="w-3.5 h-3.5" /> Rouvrir
                    </button>
                  )}
                  <button type="button" onClick={() => onEdit(action)} aria-label="Modifier l'action" className="ml-auto p-2.5 text-gray-400 hover:text-[#00665C]">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" disabled={busyId === action.id} onClick={() => remove(action)} aria-label="Supprimer l'action" className="p-2.5 ml-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmModal {...confirmModalProps} />
    </>
  );
}
