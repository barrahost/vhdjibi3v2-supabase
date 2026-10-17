import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Copy, Plus, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { BRIEF_FIELDS } from '../../data/culteGuide';
import { useChurch } from '../../contexts/ChurchContext';
import { ficheBranding, sanitizeBriefContent, type FicheDefaults } from '../../lib/timingSheet';
import { compareEventsInDay, formatDayFr, formatRangeFr, formatTimeFr, shortServiceLabel } from '../../lib/culteTiming';
import {
  CulteBriefCopyService,
  CulteInstructionService,
  CulteMeetingService,
  CulteRunSheetService,
} from '../../services/culteBrief.service';
import { CulteDirectory, type DirectoryDepartment } from '../../services/culteDirectory.service';
import { CulteNotifyService } from '../../services/culteNotify.service';
import type { BriefContent, BriefInstruction, CulteMeeting, RunSheetItem, TimingMoment } from '../../types/culteBrief.types';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { RunSheetEditor, type RunSheetRow } from './RunSheetEditor';
import type { CockpitTabProps } from './tabTypes';
import { TimingSheetCard } from './TimingSheetCard';
import { Card, CardHeader, EmptyState, Pill, Spinner, inputCls, labelCls, primaryBtn, secondaryBtn } from './ui';

const toRows = (items: RunSheetItem[]): RunSheetRow[] =>
  items.map((item) => ({
    key: item.id,
    id: item.id,
    startTime: item.startTime,
    title: item.title,
    departmentName: item.departmentName,
    responsibleName: item.responsibleName,
    support: item.support,
    needsRegie: item.needsRegie,
    durationMin: item.durationMin,
    notes: item.notes,
  }));

/** Champs du brief qui sont du texte (les moments de la fiche de timing sont une liste). */
type TextKey = Exclude<keyof BriefContent, 'moments'>;

const hasContent = (value: unknown) => (typeof value === 'string' ? value.trim() !== '' : Array.isArray(value) && value.length > 0);

function ReadBlock({ label, text }: { label: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-line">{text}</p>
    </div>
  );
}

export function BriefTab({ event, dayEvents, access, onChanged, active = true, onDirtyChange }: CockpitTabProps) {
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<CulteMeeting<BriefContent> | null>(null);
  const [content, setContent] = useState<BriefContent>({});
  const [rows, setRows] = useState<RunSheetRow[]>([]);
  const [savedInstructions, setSavedInstructions] = useState<BriefInstruction[]>([]);
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [openInstructionDepts, setOpenInstructionDepts] = useState<string[]>([]);
  const [departments, setDepartments] = useState<DirectoryDepartment[]>([]);
  const [ficheDefaults, setFicheDefaults] = useState<FicheDefaults>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmModalProps } = useConfirmModal();
  const { church } = useChurch();
  const branding = useMemo(() => ficheBranding(church), [church]);

  // Ce que cet écran a réellement modifié : on n'enregistre que cela, par-dessus la dernière version
  // du serveur (un autre responsable a pu compléter le brief entre-temps).
  const dirtyFields = useRef<Set<keyof BriefContent>>(new Set());
  const rowsDirty = useRef(false);
  const baselineRows = useRef<RunSheetItem[]>([]);
  const dirtyRef = useRef(false);
  const loadedFor = useRef<string | null>(null);
  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };

  const actor = useMemo(() => ({ id: access.userId, name: access.userName }), [access.userId, access.userName]);
  const previous = useMemo(
    () => [...dayEvents].filter((e) => e.id !== event.id && compareEventsInDay(e, event) < 0).pop() ?? null,
    [dayEvents, event]
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [brief, runSheet, savedInstr, depts, defaults] = await Promise.all([
        CulteMeetingService.get<BriefContent>(event.id, 'brief'),
        CulteRunSheetService.list(event.id),
        CulteInstructionService.list(event.id),
        CulteDirectory.departments(),
        // simple confort (titre et note de la dernière fiche) : son échec ne doit pas empêcher d'ouvrir le brief
        CulteMeetingService.latestFicheDefaults({ id: event.id, serviceDate: event.serviceDate }).catch((): FicheDefaults => ({})),
      ]);
      setMeeting(brief);
      setContent(sanitizeBriefContent(brief?.content));
      setRows(toRows(runSheet));
      setSavedInstructions(savedInstr);
      setInstructions(Object.fromEntries(savedInstr.map((i) => [i.departmentName, i.instructions])));
      setOpenInstructionDepts(savedInstr.filter((i) => i.instructions.trim()).map((i) => i.departmentName));
      setDepartments(depts);
      setFicheDefaults(defaults);
      baselineRows.current = runSheet;
      dirtyFields.current = new Set();
      rowsDirty.current = false;
      dirtyRef.current = false;
      setDirty(false);
    } catch (error) {
      console.error('Error loading brief:', error);
      if (!silent) toast.error('Erreur lors du chargement du brief');
    } finally {
      setLoading(false);
    }
  }, [event.id, event.serviceDate]);

  // Chargement à l'ouverture et à chaque changement de culte ; au retour sur l'onglet, mise à jour
  // discrète — sauf s'il y a une saisie en cours, qu'on ne remplace jamais.
  useEffect(() => {
    if (!active) return;
    const sameEvent = loadedFor.current === event.id;
    if (sameEvent && dirtyRef.current) return;
    load(sameEvent);
    loadedFor.current = event.id;
  }, [active, event.id, load]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const myDepartmentNames = useMemo(
    () => departments.filter((d) => access.managedDepartmentIds.includes(d.id)).map((d) => d.name),
    [departments, access.managedDepartmentIds]
  );

  const setField = (key: TextKey, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    dirtyFields.current.add(key);
    markDirty();
  };

  const setMoments = (moments: TimingMoment[]) => {
    setContent((prev) => ({ ...prev, moments }));
    dirtyFields.current.add('moments');
    markDirty();
  };

  /** Enregistre ce qui a été modifié ici : champs du cadre, conducteur, consignes. */
  const persist = async (): Promise<void> => {
    if (dirtyFields.current.size > 0) {
      const patch = Object.fromEntries(Array.from(dirtyFields.current).map((key) => [key, content[key] ?? (key === 'moments' ? [] : '')]));
      await CulteMeetingService.savePatch<BriefContent>(event.id, 'brief', patch, actor);
    }
    if (rowsDirty.current) {
      await CulteRunSheetService.sync(
        event.id,
        rows.filter((row) => row.title.trim()),
        baselineRows.current
      );
    }
    const unchanged = new Map(savedInstructions.map((i) => [i.departmentName, i.instructions]));
    await Promise.all(
      Object.entries(instructions)
        .filter(([name, text]) => (unchanged.get(name) ?? '') !== text)
        .map(([name, text]) => CulteInstructionService.save(event.id, { id: departments.find((d) => d.name === name)?.id, name }, text, actor))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist();
      toast.success('Brief enregistré');
      await load();
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement du brief");
    } finally {
      setSaving(false);
    }
  };

  const handleReady = async () => {
    const ok = await confirm(
      "Le brief sera marqué comme prêt et les responsables de département, les assistants et les pasteurs seront prévenus par notification.",
      { title: 'Partager le brief', confirmLabel: 'Marquer prêt et prévenir', variant: 'default' }
    );
    if (!ok) return;
    setSaving(true);
    try {
      if (dirty) await persist();
      await CulteMeetingService.setStatus(event.id, 'brief', 'ready', actor);
      const audience = await CulteDirectory.briefAudience();
      const result = await CulteNotifyService.notifyUsers(
        audience.map((u) => u.id),
        {
          title: 'Brief du culte prêt',
          body: `${event.meetingTypeName} — ${formatDayFr(event.serviceDate)}${event.startTime ? ` à ${formatTimeFr(event.startTime)}` : ''}`,
          url: `/cultes/${event.id}?tab=brief`,
        },
        { excludeUserId: access.userId }
      );
      toast.success(result.pushed > 0 ? `Brief prêt — ${result.pushed} personne(s) prévenue(s)` : 'Brief marqué comme prêt');
      await load();
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors du partage du brief');
    } finally {
      setSaving(false);
    }
  };

  const handleBackToDraft = async () => {
    try {
      await CulteMeetingService.setStatus(event.id, 'brief', 'draft', actor);
      await load();
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur');
    }
  };

  const handleCopyFromPrevious = async () => {
    if (!previous) return;
    setSaving(true);
    try {
      await CulteBriefCopyService.copy(previous, event, actor);
      toast.success(`Brief repris du ${shortServiceLabel(previous.meetingTypeName)} — ajustez si besoin`);
      await load();
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la reprise du brief');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const isReady = meeting?.status === 'ready';
  const isEmpty = !Object.values(content).some(hasContent) && rows.length === 0 && savedInstructions.length === 0;

  // ── Lecture seule (responsables de département) ────────────────────────────────────────────
  if (!access.isManager) {
    if (!isReady) {
      return <EmptyState>Le brief de ce culte n'est pas encore prêt. Vous serez prévenu(e) dès qu'il sera partagé.</EmptyState>;
    }
    const mine = savedInstructions.filter((i) => myDepartmentNames.includes(i.departmentName) && i.instructions.trim());
    const others = savedInstructions.filter((i) => !myDepartmentNames.includes(i.departmentName) && i.instructions.trim());
    return (
      <div className="space-y-4">
        {mine.map((instruction) => (
          <Card key={instruction.id} className="border-[#00665C]/40 bg-[#00665C]/5">
            <CardHeader title={`Consignes pour ${instruction.departmentName}`} subtitle="À retenir pour ce culte" />
            <p className="px-4 pb-4 text-sm text-gray-800 whitespace-pre-line">{instruction.instructions}</p>
          </Card>
        ))}

        <Card>
          <CardHeader title="Cadre du culte" action={<Pill tone="green"><CheckCircle2 className="w-3 h-3" /> Brief prêt</Pill>} />
          <div className="px-4 pb-4 space-y-3">
            <ReadBlock label={BRIEF_FIELDS.theme.label} text={content.theme} />
            <ReadBlock label={BRIEF_FIELDS.vision.label} text={content.vision} />
            <ReadBlock label={BRIEF_FIELDS.vigilance.label} text={content.vigilance} />
            <ReadBlock label={BRIEF_FIELDS.keyActors.label} text={content.keyActors} />
            <ReadBlock label={BRIEF_FIELDS.exceptional.label} text={content.exceptional} />
            <ReadBlock label={BRIEF_FIELDS.toRemember.label} text={content.toRemember} />
          </div>
        </Card>

        {rows.length > 0 && (
          <Card>
            <CardHeader title="Conducteur" subtitle={formatRangeFr(event.startTime, event.endTime)} />
            <ol className="px-4 pb-4 divide-y divide-gray-100">
              {rows.map((row) => (
                <li key={row.key} className="py-2 flex gap-3">
                  <span className="w-12 flex-shrink-0 text-sm font-semibold text-[#00665C]">{row.startTime ? formatTimeFr(row.startTime) : '—'}</span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-gray-900">
                      {row.title}
                      {row.needsRegie && <Video className="inline w-3.5 h-3.5 ml-1.5 text-gray-400" aria-label="Régie" />}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[row.departmentName, row.responsibleName, row.support, row.durationMin ? `${row.durationMin} min` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {rows.length > 0 && (
          <TimingSheetCard
            content={content}
            defaults={ficheDefaults}
            rows={rows}
            event={event}
            churchName={church?.name ?? 'Bergerie'}
            branding={branding}
            canEdit={false}
            dirty={false}
            onField={setField}
            onMoments={setMoments}
          />
        )}

        {others.length > 0 && (
          <Card>
            <CardHeader title="Consignes des autres départements" />
            <div className="px-4 pb-4 space-y-3">
              {others.map((i) => (
                <ReadBlock key={i.id} label={i.departmentName} text={i.instructions} />
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── Édition (responsables du culte, pasteurs, administrateurs) ────────────────────────────
  const addableDepartments = departments.filter((d) => !openInstructionDepts.includes(d.name));

  return (
    <div className="space-y-4 pb-24">
      <ConfirmModal {...confirmModalProps} />

      {previous && isEmpty && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#00665C]/30 bg-[#00665C]/5 p-4">
          <p className="text-sm text-gray-700">
            Le brief du <strong>{shortServiceLabel(previous.meetingTypeName)}</strong> existe peut-être déjà : reprenez-le (les horaires du conducteur sont décalés automatiquement).
          </p>
          <button type="button" onClick={handleCopyFromPrevious} disabled={saving} className={secondaryBtn}>
            <Copy className="w-4 h-4" /> Reprendre le brief du 1er culte
          </button>
        </div>
      )}

      <Card>
        <CardHeader
          title="Cadre du culte"
          subtitle="Ce que le Saint-Esprit attend, et le thème qui harmonise tous les départements"
          action={isReady ? <Pill tone="green"><CheckCircle2 className="w-3 h-3" /> Brief prêt</Pill> : <Pill tone="amber">Brouillon</Pill>}
        />
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label htmlFor="brief-vision" className={labelCls}>{BRIEF_FIELDS.vision.question}</label>
            <textarea id="brief-vision" rows={2} value={content.vision ?? ''} onChange={(e) => setField('vision', e.target.value)} className={inputCls} />
            <p className="mt-1 text-xs text-gray-400">{BRIEF_FIELDS.vision.hint}</p>
          </div>
          <div>
            <label htmlFor="brief-theme" className={labelCls}>{BRIEF_FIELDS.theme.question}</label>
            <input id="brief-theme" type="text" value={content.theme ?? ''} onChange={(e) => setField('theme', e.target.value)} className={inputCls} />
            <p className="mt-1 text-xs text-gray-400">{BRIEF_FIELDS.theme.hint}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Conducteur" subtitle={`Ce qui est prévu, dans l'ordre${event.startTime ? ` — culte ${formatRangeFr(event.startTime, event.endTime)}` : ''}`} />
        <div className="px-4 pb-4">
          <RunSheetEditor
            rows={rows}
            onChange={(next) => {
              setRows(next);
              rowsDirty.current = true;
              markDirty();
            }}
            departmentNames={departments.map((d) => d.name)}
            eventStart={event.startTime}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Qui fait quoi ?" subtitle="Consignes par département : accueil, parking, communication, chantres, décoration, délais à respecter…" />
        <div className="px-4 pb-4 space-y-3">
          {openInstructionDepts.map((name) => (
            <div key={name}>
              <div className="flex items-center justify-between">
                <label htmlFor={`instruction-${name}`} className={labelCls}>{name}</label>
                <button
                  type="button"
                  aria-label={`Retirer ${name}`}
                  onClick={() => {
                    setOpenInstructionDepts((prev) => prev.filter((n) => n !== name));
                    setInstructions((prev) => ({ ...prev, [name]: '' }));
                    markDirty();
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                id={`instruction-${name}`}
                rows={2}
                value={instructions[name] ?? ''}
                onChange={(e) => {
                  setInstructions((prev) => ({ ...prev, [name]: e.target.value }));
                  markDirty();
                }}
                className={inputCls}
              />
            </div>
          ))}
          {addableDepartments.length > 0 && (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                aria-label="Ajouter une consigne pour un département"
                value=""
                onChange={(e) => {
                  if (e.target.value) setOpenInstructionDepts((prev) => [...prev, e.target.value]);
                }}
                className={inputCls}
              >
                <option value="">Ajouter une consigne pour un département…</option>
                {addableDepartments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Vigilance et acteurs" />
        <div className="px-4 pb-4 space-y-3">
          {(['vigilance', 'keyActors', 'exceptional', 'toRemember'] as const).map((key) => (
            <div key={key}>
              <label htmlFor={`brief-${key}`} className={labelCls}>{BRIEF_FIELDS[key].question}</label>
              <textarea id={`brief-${key}`} rows={2} value={content[key] ?? ''} onChange={(e) => setField(key, e.target.value)} className={inputCls} />
              <p className="mt-1 text-xs text-gray-400">{BRIEF_FIELDS[key].hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <TimingSheetCard
        content={content}
        defaults={ficheDefaults}
        rows={rows}
        event={event}
        churchName={church?.name ?? 'Bergerie'}
        branding={branding}
        canEdit
        dirty={dirty}
        onField={setField}
        onMoments={setMoments}
      />

      {/* Barre d'actions, toujours accessible au pouce */}
      <div className="fixed inset-x-0 bottom-[53px] lg:bottom-0 lg:left-64 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <p className="hidden sm:block flex-1 text-xs text-gray-500">
            {dirty ? 'Modifications non enregistrées' : meeting?.updatedByName ? `Dernière modification : ${meeting.updatedByName}` : ''}
          </p>
          {isReady && !dirty && (
            <button type="button" onClick={handleBackToDraft} className={secondaryBtn}>Repasser en brouillon</button>
          )}
          <button type="button" onClick={handleSave} disabled={saving || !dirty} className={`${secondaryBtn} flex-1 sm:flex-none`}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={handleReady} disabled={saving} className={`${primaryBtn} flex-1 sm:flex-none`}>
            {isReady ? 'Re-partager' : 'Marquer prêt et prévenir'}
          </button>
        </div>
      </div>
    </div>
  );
}
