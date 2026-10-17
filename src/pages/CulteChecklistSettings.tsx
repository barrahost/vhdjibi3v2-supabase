import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, BookOpen, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState, ModuleNotReady, Spinner, inputCls, labelCls, primaryBtn, secondaryBtn, Card, CardHeader } from '../components/culteBrief/ui';
import { GUIDE_CHECKLIST_AREAS } from '../data/culteGuide';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useCulteAccess } from '../hooks/useCulteAccess';
import { useCulteModule } from '../hooks/useCulteModule';
import { CulteChecklistTemplateService } from '../services/culteChecklist.service';
import { CulteDirectory, type DirectoryDepartment } from '../services/culteDirectory.service';
import type { ChecklistScope, ChecklistTemplate } from '../types/culteBrief.types';

interface TemplateRowProps {
  template: ChecklistTemplate;
  index: number;
  total: number;
  onSave: (template: ChecklistTemplate) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}

function TemplateRow({ template, index, total, onSave, onMove, onDelete }: TemplateRowProps) {
  const [task, setTask] = useState(template.task);
  const [indicator, setIndicator] = useState(template.indicator ?? '');

  useEffect(() => {
    setTask(template.task);
    setIndicator(template.indicator ?? '');
  }, [template.task, template.indicator]);

  const commit = () => {
    if (!task.trim()) {
      setTask(template.task);
      return;
    }
    if (task.trim() !== template.task || indicator.trim() !== (template.indicator ?? '')) {
      onSave({ ...template, task: task.trim(), indicator: indicator.trim() || null });
    }
  };

  return (
    <li className={`p-3 space-y-2 ${template.isActive ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-2">
        <input
          type="text"
          aria-label="Point de contrôle"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onBlur={commit}
          className={`${inputCls} font-medium`}
        />
        <div className="flex flex-shrink-0">
          <button type="button" aria-label="Monter" onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Descendre" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Supprimer le point" onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        type="text"
        aria-label="Objectif (indicateur)"
        value={indicator}
        placeholder="Objectif à atteindre (facultatif)"
        onChange={(e) => setIndicator(e.target.value)}
        onBlur={commit}
        className={inputCls}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={template.scope === 'day'}
            onChange={(e) => onSave({ ...template, scope: e.target.checked ? 'day' : 'service' })}
            className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
          />
          Une seule fois par jour <span className="text-xs text-gray-400">(repris au 2e culte)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={template.isActive}
            onChange={(e) => onSave({ ...template, isActive: e.target.checked })}
            className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
          />
          Actif
        </label>
      </div>
    </li>
  );
}

export default function CulteChecklistSettings() {
  const { enabled, loading: moduleLoading } = useCulteModule();
  const access = useCulteAccess();
  const [departments, setDepartments] = useState<DirectoryDepartment[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newIndicator, setNewIndicator] = useState('');
  const [newScope, setNewScope] = useState<ChecklistScope>('service');
  const [guideOpen, setGuideOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, { task: string; scope?: ChecklistScope }>>({});
  const { confirm, confirmModalProps } = useConfirmModal();

  const load = useCallback(async () => {
    try {
      const [depts, list] = await Promise.all([CulteDirectory.departments(), CulteChecklistTemplateService.list()]);
      setDepartments(depts);
      setTemplates(list);
    } catch (error) {
      console.error('Error loading checklist templates:', error);
      toast.error('Erreur lors du chargement des modèles de contrôle');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const department = departments.find((d) => d.id === departmentId) ?? null;
  const rows = useMemo(
    () => templates.filter((t) => department && (t.departmentId === department.id || (!t.departmentId && t.departmentName === department.name))),
    [templates, department]
  );
  const countFor = (d: DirectoryDepartment) => templates.filter((t) => t.departmentId === d.id || (!t.departmentId && t.departmentName === d.name)).length;

  const save = async (template: ChecklistTemplate) => {
    try {
      const updated = await CulteChecklistTemplateService.save(template);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    }
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const ordered = [...rows];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    try {
      await CulteChecklistTemplateService.reorder(ordered.map((t) => t.id));
      setTemplates((prev) =>
        prev.map((t) => {
          const pos = ordered.findIndex((o) => o.id === t.id);
          return pos >= 0 ? { ...t, position: pos } : t;
        })
      );
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors du changement d\'ordre');
    }
  };

  const remove = async (template: ChecklistTemplate) => {
    const ok = await confirm(`Supprimer « ${template.task} » des modèles ? (les contrôles déjà faits sont conservés)`, {
      title: 'Supprimer le point de contrôle',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await CulteChecklistTemplateService.remove(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression');
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !newTask.trim()) return;
    try {
      const created = await CulteChecklistTemplateService.save(
        { departmentId: department.id, departmentName: department.name, task: newTask, indicator: newIndicator, scope: newScope },
        rows.length
      );
      setTemplates((prev) => [...prev, created]);
      setNewTask('');
      setNewIndicator('');
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'ajout");
    }
  };

  const addFromGuide = async () => {
    if (!department) return;
    const existing = new Set(rows.map((t) => t.task.trim().toLowerCase()));
    const chosen = Object.values(picked).filter((item) => !existing.has(item.task.trim().toLowerCase()));
    if (chosen.length === 0) return;
    try {
      await CulteChecklistTemplateService.addMany(
        chosen.map((item) => ({ departmentId: department.id, departmentName: department.name, task: item.task, scope: item.scope ?? 'service' })),
        rows.length
      );
      toast.success(`${chosen.length} point(s) ajouté(s)`);
      setPicked({});
      setGuideOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'ajout");
    }
  };

  if (moduleLoading) return <Spinner />;
  if (!enabled) return <ModuleNotReady />;
  if (loading || access.loading) return <Spinner />;
  if (!access.isManager) {
    return <EmptyState>Seuls les responsables du culte, les pasteurs et les administrateurs peuvent modifier les modèles de contrôle.</EmptyState>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Modèles de contrôle</h1>
        <p className="text-sm text-gray-500 mt-1">
          Les points à vérifier avant chaque culte, département par département. Ils sont repris automatiquement dans l'onglet
          « Contrôle » de chaque culte. <Link to="/cultes" className="text-[#00665C] font-medium hover:underline">Retour aux cultes</Link>
        </p>
      </div>

      <div>
        <label htmlFor="settings-department" className={labelCls}>Département</label>
        <select id="settings-department" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPicked({}); setGuideOpen(false); }} className={inputCls}>
          <option value="">-- Choisir un département --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({countFor(d)})</option>
          ))}
        </select>
      </div>

      {!department ? (
        <EmptyState>Choisissez un département pour voir et modifier ses points de contrôle.</EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader title={department.name} subtitle={`${rows.length} point(s) de contrôle`} />
            {rows.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-gray-500">Aucun point pour l'instant : ajoutez-en un ci-dessous, ou partez des suggestions du guide.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border-t border-gray-100">
                {rows.map((template, index) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    index={index}
                    total={rows.length}
                    onSave={save}
                    onMove={(delta) => move(index, delta)}
                    onDelete={() => remove(template)}
                  />
                ))}
              </ul>
            )}
          </Card>

          <form onSubmit={add} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Ajouter un point</p>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="ex : Micros chargés et fonctionnels" aria-label="Nouveau point de contrôle" className={inputCls} />
            <input type="text" value={newIndicator} onChange={(e) => setNewIndicator(e.target.value)} placeholder="Objectif à atteindre (facultatif)" aria-label="Objectif du nouveau point" className={inputCls} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={newScope === 'day'} onChange={(e) => setNewScope(e.target.checked ? 'day' : 'service')} className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]" />
                Une seule fois par jour
              </label>
              <button type="submit" disabled={!newTask.trim()} className={primaryBtn}><Plus className="w-4 h-4" /> Ajouter</button>
            </div>
          </form>

          <div className="bg-white rounded-xl border border-gray-200">
            <button type="button" onClick={() => setGuideOpen((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-left" aria-expanded={guideOpen}>
              <BookOpen className="w-4 h-4 text-[#00665C]" />
              <span className="font-semibold text-gray-900">Suggestions du guide</span>
              <span className="text-xs text-gray-400 ml-auto">{guideOpen ? 'Masquer' : 'Afficher'}</span>
            </button>
            {guideOpen && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                <p className="text-xs text-gray-500">Cochez les points à reprendre pour {department.name}. « Une fois par jour » signale ceux qu'il suffit de vérifier avant le 1er culte.</p>
                {GUIDE_CHECKLIST_AREAS.map((area) => (
                  <fieldset key={area.key}>
                    <legend className="text-sm font-semibold text-gray-800 mb-1">{area.label}</legend>
                    <div className="space-y-1">
                      {area.items.map((item) => {
                        const id = `${area.key}:${item.task}`;
                        const already = rows.some((t) => t.task.trim().toLowerCase() === item.task.trim().toLowerCase());
                        return (
                          <label key={id} className={`flex items-start gap-2 text-sm ${already ? 'text-gray-400' : 'text-gray-700'}`}>
                            <input
                              type="checkbox"
                              disabled={already}
                              checked={already || !!picked[id]}
                              onChange={(e) =>
                                setPicked((prev) => {
                                  const next = { ...prev };
                                  if (e.target.checked) next[id] = item;
                                  else delete next[id];
                                  return next;
                                })
                              }
                              className="mt-0.5 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                            />
                            <span>
                              {item.task}
                              {item.scope === 'day' && <span className="ml-1.5 text-xs text-gray-400">(une fois par jour)</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
                <button type="button" onClick={addFromGuide} disabled={Object.keys(picked).length === 0} className={secondaryBtn}>
                  Ajouter la sélection ({Object.keys(picked).length})
                </button>
              </div>
            )}
          </div>
        </>
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
