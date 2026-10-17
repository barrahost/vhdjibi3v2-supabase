import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEBRIEF_QUESTIONS } from '../../data/culteGuide';
import { addDaysISO, formatDateFr } from '../../lib/culteTiming';
import { CulteMeetingService } from '../../services/culteBrief.service';
import { CulteActionService } from '../../services/culteAction.service';
import { CulteChecklistService } from '../../services/culteChecklist.service';
import { blankDebriefSheet, CulteDebriefService, isDebriefSheetEmpty, type DebriefSheetValues } from '../../services/culteDebrief.service';
import { CulteDirectory, type DirectoryDepartment } from '../../services/culteDirectory.service';
import {
  actionTitle,
  isActionClosed,
  type ChecklistItem,
  type CulteAction,
  type CulteMeeting,
  type DebriefContent,
  type DepartmentDebrief,
} from '../../types/culteBrief.types';
import { ActionEditorModal, type ActionDraft } from './ActionEditorModal';
import { DebriefSheetFields } from './DebriefSheetFields';
import type { CockpitTabProps } from './tabTypes';
import { Card, CardHeader, EmptyState, Pill, Spinner, inputCls, labelCls, primaryBtn, secondaryBtn } from './ui';

const toValues = (sheet?: DepartmentDebrief | null): DebriefSheetValues =>
  sheet
    ? { positives: sheet.positives, difficulties: sheet.difficulties, causes: sheet.causes, needs: sheet.needs, solutions: sheet.solutions }
    : blankDebriefSheet();

export function DebriefTab({ event, access, onChanged }: CockpitTabProps) {
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<CulteMeeting<DebriefContent> | null>(null);
  const [general, setGeneral] = useState<DebriefContent>({});
  const [generalDirty, setGeneralDirty] = useState(false);
  const [sheets, setSheets] = useState<DepartmentDebrief[]>([]);
  const [forms, setForms] = useState<Record<string, DebriefSheetValues>>({});
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [actions, setActions] = useState<CulteAction[]>([]);
  const [departments, setDepartments] = useState<DirectoryDepartment[]>([]);
  const [extraDepartments, setExtraDepartments] = useState<string[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [actionEditor, setActionEditor] = useState<{ action?: CulteAction; draft?: ActionDraft } | null>(null);

  const actor = useMemo(() => ({ id: access.userId, name: access.userName }), [access.userId, access.userName]);

  const load = useCallback(async () => {
    try {
      const [debriefMeeting, sheetList, checklist, actionList, depts] = await Promise.all([
        CulteMeetingService.get<DebriefContent>(event.id, 'debrief'),
        CulteDebriefService.list(event.id),
        CulteChecklistService.list(event.id),
        CulteActionService.list({ eventId: event.id, scope: 'all' }),
        CulteDirectory.departments(),
      ]);
      setMeeting(debriefMeeting);
      setGeneral(debriefMeeting?.content ?? {});
      setGeneralDirty(false);
      setSheets(sheetList);
      setForms((prev) => {
        const next: Record<string, DebriefSheetValues> = {};
        sheetList.forEach((s) => (next[s.departmentName] = prev[s.departmentName] ?? toValues(s)));
        return { ...next, ...Object.fromEntries(Object.entries(prev).filter(([name]) => !(name in next))) };
      });
      setItems(checklist);
      setActions(actionList);
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading debrief:', error);
      toast.error('Erreur lors du chargement du débrief');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const departmentNames = useMemo(() => {
    const names = new Set<string>([
      ...sheets.map((s) => s.departmentName),
      ...items.map((i) => i.departmentName),
      ...departments.filter((d) => access.managedDepartmentIds.includes(d.id)).map((d) => d.name),
      ...extraDepartments,
    ]);
    const idOf = (name: string) => departments.find((d) => d.name === name)?.id ?? null;
    return Array.from(names).sort((a, b) => {
      const ea = access.canEditDepartment(idOf(a)) ? 0 : 1;
      const eb = access.canEditDepartment(idOf(b)) ? 0 : 1;
      return ea - eb || a.localeCompare(b, 'fr');
    });
  }, [sheets, items, departments, extraDepartments, access]);

  const saveGeneral = async (status?: 'done' | 'draft') => {
    setSaving('general');
    try {
      await CulteMeetingService.save<DebriefContent>(event.id, 'debrief', general, actor, status);
      toast.success(status === 'done' ? 'Débrief clôturé' : 'Débrief enregistré');
      await load();
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(null);
    }
  };

  const saveSheet = async (name: string) => {
    const values = forms[name] ?? blankDebriefSheet();
    const department = departments.find((d) => d.name === name);
    setSaving(name);
    try {
      await CulteDebriefService.save(event.id, { id: department?.id, name }, values, actor);
      const created = await CulteActionService.createNeedsFromLines({ eventId: event.id, departmentName: name, text: values.needs }, actor);
      toast.success(created > 0 ? `Fiche enregistrée — ${created} action(s) ajoutée(s) au plan` : 'Fiche enregistrée');
      await load();
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement de la fiche");
    } finally {
      setSaving(null);
    }
  };

  const arbitration = actions.filter((a) => a.needsArbitration && !isActionClosed(a.status));
  const isClosed = meeting?.status === 'done';
  const hasGeneral = Object.values(general).some((v) => v?.trim());

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Débrief général : la direction fait le tour des 6 questions */}
      {(access.isManager || hasGeneral) && (
        <Card>
          <CardHeader
            title="Débrief général du culte"
            subtitle="Les mêmes questions pour tous, pour passer de ce qui s'est passé à ce que nous décidons"
            action={isClosed ? <Pill tone="green"><CheckCircle2 className="w-3 h-3" /> Clôturé</Pill> : <Pill tone="amber">En cours</Pill>}
          />
          <div className="px-4 pb-4 space-y-3">
            {DEBRIEF_QUESTIONS.map((q) => (
              <div key={q.key}>
                <label htmlFor={`general-${q.key}`} className={labelCls}>{q.label}</label>
                {access.isManager ? (
                  <textarea
                    id={`general-${q.key}`}
                    rows={2}
                    value={general[q.key] ?? ''}
                    onChange={(e) => {
                      setGeneral((prev) => ({ ...prev, [q.key]: e.target.value }));
                      setGeneralDirty(true);
                    }}
                    className={inputCls}
                  />
                ) : (
                  <p className="text-sm text-gray-800 whitespace-pre-line">{general[q.key] || '—'}</p>
                )}
              </div>
            ))}

            {access.isManager ? (
              <>
                <div>
                  <label htmlFor="general-arbitration" className={labelCls}>Points nécessitant un arbitrage</label>
                  <textarea id="general-arbitration" rows={2} value={general.arbitration ?? ''} onChange={(e) => { setGeneral((p) => ({ ...p, arbitration: e.target.value })); setGeneralDirty(true); }} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="general-conclusion" className={labelCls}>Conclusion</label>
                  <textarea id="general-conclusion" rows={2} value={general.conclusion ?? ''} onChange={(e) => { setGeneral((p) => ({ ...p, conclusion: e.target.value })); setGeneralDirty(true); }} className={inputCls} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => saveGeneral()} disabled={saving === 'general' || !generalDirty} className={secondaryBtn}>
                    Enregistrer
                  </button>
                  {isClosed ? (
                    <button type="button" onClick={() => saveGeneral('draft')} disabled={saving === 'general'} className={secondaryBtn}>Rouvrir le débrief</button>
                  ) : (
                    <button type="button" onClick={() => saveGeneral('done')} disabled={saving === 'general'} className={primaryBtn}>Clôturer le débrief</button>
                  )}
                </div>
              </>
            ) : (
              <>
                {general.arbitration?.trim() && (
                  <div>
                    <p className={labelCls}>Points nécessitant un arbitrage</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{general.arbitration}</p>
                  </div>
                )}
                {general.conclusion?.trim() && (
                  <div>
                    <p className={labelCls}>Conclusion</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{general.conclusion}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Fiches des départements */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Fiches de débrief par département</h2>
        <span className="text-xs text-gray-500">{sheets.length} remplie(s)</span>
      </div>

      {departmentNames.length === 0 && <EmptyState>Aucune fiche pour l'instant : la fiche d'un département apparaît ici dès qu'elle est ouverte.</EmptyState>}

      {departmentNames.map((name) => {
        const department = departments.find((d) => d.name === name);
        const sheet = sheets.find((s) => s.departmentName === name);
        const canEdit = access.canEditDepartment(department?.id ?? null);
        const values = forms[name] ?? toValues(sheet);
        const filled = !!sheet && !isDebriefSheetEmpty(toValues(sheet));
        const nokItems = items.filter((i) => i.departmentName === name && i.status === 'nok');
        const decisions = actions.filter((a) => a.departmentName === name && a.source === 'debrief' && a.decision);
        // Ouverte d'office : la fiche de MON département tant qu'elle n'est pas remplie. La direction,
        // qui voit tous les départements, les parcourt repliés et ouvre celui qui l'intéresse.
        const isOwn = !!department && access.managedDepartmentIds.includes(department.id);
        const isOpen = open[name] ?? (isOwn && !filled);
        const hasContent = !isDebriefSheetEmpty(values);

        return (
          <Card key={name}>
            <button type="button" onClick={() => setOpen((prev) => ({ ...prev, [name]: !isOpen }))} className="w-full flex items-center gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <span className="flex-1 font-semibold text-gray-900 truncate">{name}</span>
              {nokItems.length > 0 && <Pill tone="red">{nokItems.length} non OK</Pill>}
              {filled ? <Pill tone="green">Fiche remplie</Pill> : <Pill tone="amber">À remplir</Pill>}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                {nokItems.length > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                    <p className="font-medium text-red-800 mb-1">Points non OK relevés au contrôle</p>
                    <ul className="list-disc pl-5 text-red-900 space-y-0.5">
                      {nokItems.map((i) => (
                        <li key={i.id}>{i.task}{i.observation && <span className="text-red-700"> — {i.observation}</span>}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!canEdit && !hasContent ? (
                  <p className="text-sm text-gray-500">Fiche pas encore remplie.</p>
                ) : (
                  <DebriefSheetFields
                    values={values}
                    readOnly={!canEdit}
                    idPrefix={`sheet-${name}`}
                    onChange={(next) => setForms((prev) => ({ ...prev, [name]: next }))}
                  />
                )}

                <div>
                  <p className={labelCls}>Décisions prises</p>
                  {decisions.length === 0 && <p className="text-sm text-gray-400 mb-2">Aucune décision enregistrée.</p>}
                  <ul className="space-y-1.5 mb-2">
                    {decisions.map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-3 text-sm bg-gray-50 rounded-md px-3 py-2">
                        <span className={isActionClosed(a.status) ? 'line-through text-gray-400' : 'text-gray-800'}>
                          {actionTitle(a)}
                          <span className="block text-xs text-gray-500">
                            {a.responsibleName || 'Pas de responsable'}{a.dueDate ? ` · avant le ${formatDateFr(a.dueDate)}` : ''}
                          </span>
                        </span>
                        {canEdit && <button type="button" onClick={() => setActionEditor({ action: a })} className="text-xs text-[#00665C] hover:underline flex-shrink-0">Modifier</button>}
                      </li>
                    ))}
                  </ul>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setActionEditor({ draft: { eventId: event.id, source: 'debrief', departmentName: name } })}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00665C] hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Ajouter une décision (avec responsable et échéance)
                    </button>
                  )}
                </div>

                {canEdit && (
                  <button type="button" onClick={() => saveSheet(name)} disabled={saving === name} className={primaryBtn}>
                    {saving === name ? 'Enregistrement…' : 'Enregistrer la fiche'}
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {access.isManager && departments.length > 0 && (
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            aria-label="Ouvrir la fiche d'un autre département"
            value=""
            onChange={(e) => {
              const name = e.target.value;
              if (!name) return;
              setExtraDepartments((prev) => (prev.includes(name) ? prev : [...prev, name]));
              setOpen((prev) => ({ ...prev, [name]: true }));
            }}
            className={inputCls}
          >
            <option value="">Ouvrir la fiche d'un autre département…</option>
            {departments.filter((d) => !departmentNames.includes(d.name)).map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Points à arbitrer par la direction */}
      {arbitration.length > 0 && (
        <Card>
          <CardHeader title="À arbitrer par la direction" action={<Link to="/plan-actions" className="text-xs text-[#00665C] font-medium hover:underline">Plan d'actions</Link>} />
          <ul className="px-4 pb-4 space-y-2">
            {arbitration.map((a) => (
              <li key={a.id} className="text-sm text-gray-800">
                <strong>{a.departmentName}</strong> — {actionTitle(a)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ActionEditorModal
        isOpen={!!actionEditor}
        onClose={() => setActionEditor(null)}
        onSaved={() => {
          load();
          onChanged?.();
        }}
        actor={actor}
        action={actionEditor?.action}
        draft={actionEditor?.draft}
        nextServiceDate={addDaysISO(event.serviceDate, 7)}
      />
    </div>
  );
}
