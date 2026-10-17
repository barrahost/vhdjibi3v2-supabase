import { useMemo, useState } from 'react';
import { Download, Plus, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTimeFr, toMinutes } from '../../lib/culteTiming';
import { buildFicheModel, type FicheBranding, type FicheDefaults } from '../../lib/timingSheet';
import type { BriefContent, CulteEventInfo, TimingMoment } from '../../types/culteBrief.types';
import type { RunSheetRow } from './RunSheetEditor';
import { Card, CardHeader, inputBaseCls, inputCls, labelCls, primaryBtn, secondaryBtn } from './ui';

/** Champs de texte de la fiche (les moments ont leur propre éditeur). */
export type FicheTextKey =
  | 'ficheTitle'
  | 'preacher'
  | 'leader'
  | 'communionLeads'
  | 'pastorAnnouncements'
  | 'leaderAnnouncements'
  | 'verse'
  | 'footerNote';

interface TimingSheetCardProps {
  content: BriefContent;
  /** Titre et note repris de la dernière fiche, quand celle de ce culte n'en a pas. */
  defaults: FicheDefaults;
  rows: RunSheetRow[];
  event: CulteEventInfo;
  churchName: string;
  branding: FicheBranding;
  /** Direction : peut compléter la fiche. Les autres ne font que la télécharger. */
  canEdit: boolean;
  /** Le brief a des modifications non enregistrées : le PDF les inclut, on le dit. */
  dirty: boolean;
  onField: (key: FicheTextKey, value: string) => void;
  onMoments: (moments: TimingMoment[]) => void;
}

const ANNOUNCEMENT_HINT =
  'Séparez les annonces par une ligne vide. Dans la première ligne, ce qui précède « : » s’affiche en rouge. Une ligne qui commence par « - » devient une puce.';

// Longueurs au-delà desquelles la fiche réduit le texte au minimum, puis coupe la fin par « … » (mesuré avec des noms en capitales)
interface LongText {
  after: number;
  message: string;
}
const ONE_LINE: Omit<LongText, 'after'> = { message: 'Texte long : sur la fiche, il tient sur une seule ligne et sa fin risque d’être coupée.' };
const FOOTER_TEXT: Omit<LongText, 'after'> = { message: 'Texte très long : il s’imprimera en tout petits caractères, et sa fin risque d’être coupée.' };
const LONG = {
  title: { after: 75, ...ONE_LINE },
  preacher: { after: 62, ...ONE_LINE },
  leader: { after: 48, ...ONE_LINE },
  communion: { after: 130, message: 'Texte long : sur la fiche, il tient sur deux lignes et sa fin risque d’être coupée.' },
  verse: { after: 560, ...FOOTER_TEXT },
  note: { after: 300, ...FOOTER_TEXT },
};

/** Heures de début des séquences du conducteur, avec la première séquence de chacune : choix possibles pour un moment. */
function sequenceStarts(rows: RunSheetRow[]): { time: string; title: string }[] {
  const seen = new Map<string, string>();
  rows.forEach((row) => {
    if (row.startTime && row.title.trim() && !seen.has(row.startTime)) seen.set(row.startTime, row.title.trim());
  });
  return Array.from(seen, ([time, title]) => ({ time, title })).sort((a, b) => (toMinutes(a.time) ?? 0) - (toMinutes(b.time) ?? 0));
}

function MomentsEditor({ moments, rows, onChange }: { moments: TimingMoment[]; rows: RunSheetRow[]; onChange: (next: TimingMoment[]) => void }) {
  const starts = useMemo(() => sequenceStarts(rows), [rows]);
  const update = (index: number, patch: Partial<TimingMoment>) => onChange(moments.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const add = () => {
    const used = new Set(moments.map((m) => m.from));
    const from = (starts.find((s) => !used.has(s.time)) ?? starts[0])?.time ?? '';
    onChange([...moments, { label: `Moment ${moments.length + 1} : `, from }]);
  };

  return (
    <div className="space-y-2">
      {moments.map((moment, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-2">
          <input
            type="text"
            aria-label={`Intitulé du moment ${index + 1}`}
            value={moment.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="Moment 1 : Contemplation"
            className={`${inputCls} sm:flex-1`}
          />
          <div className="flex items-center gap-2 min-w-0">
            {starts.length > 0 ? (
              <select
                aria-label={`Début du moment ${index + 1}`}
                value={moment.from}
                onChange={(e) => update(index, { from: e.target.value })}
                className={`${inputBaseCls} min-w-0 flex-1 sm:flex-none sm:w-64`}
              >
                {!starts.some((s) => s.time === moment.from) && <option value={moment.from}>{moment.from ? `Dès ${formatTimeFr(moment.from)}` : 'Choisir le début…'}</option>}
                {starts.map((s) => (
                  <option key={s.time} value={s.time}>
                    Dès {formatTimeFr(s.time)} — {s.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="time"
                aria-label={`Début du moment ${index + 1}`}
                value={moment.from}
                onChange={(e) => update(index, { from: e.target.value })}
                className={`${inputBaseCls} min-w-0 flex-1 sm:flex-none sm:w-40`}
              />
            )}
            <button
              type="button"
              aria-label={`Retirer le moment ${index + 1}`}
              onClick={() => onChange(moments.filter((_, i) => i !== index))}
              className="p-2 flex-shrink-0 text-gray-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00665C] hover:underline">
        <Plus className="w-4 h-4" /> Ajouter un moment
      </button>
      {starts.length === 0 && moments.length > 0 && (
        <p className="text-xs text-amber-700">Renseignez l’heure des séquences du conducteur : chaque moment regroupe les séquences à partir de son heure de début.</p>
      )}
    </div>
  );
}

export function TimingSheetCard({ content, defaults, rows, event, churchName, branding, canEdit, dirty, onField, onMoments }: TimingSheetCardProps) {
  const [busy, setBusy] = useState<'download' | 'open' | null>(null);

  const generate = async (requested: 'download' | 'open') => {
    // Sans lecteur PDF dans le navigateur (Chrome sur Android…), ouvrir le PDF dans un onglet le télécharge et laisse l'onglet vide.
    const canPreview = (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled !== false;
    const mode = requested === 'open' && !canPreview ? 'download' : requested;
    // La fenêtre d'aperçu s'ouvre tout de suite, pendant le clic : plus tard, le navigateur la bloquerait.
    const win = mode === 'open' ? window.open('', '_blank') : null;
    try {
      win?.document.write('<p style="font-family:sans-serif;padding:24px">Préparation de la fiche de timing…</p>');
    } catch {
      /* fenêtre non accessible : sans importance */
    }
    setBusy(requested);
    try {
      const model = buildFicheModel({
        content,
        defaults,
        rows: rows.map((row) => ({ startTime: row.startTime, title: row.title, responsibleName: row.responsibleName, durationMin: row.durationMin })),
        event,
        churchName,
      });
      const { exportTimingSheet } = await import('../../utils/culteTimingSheetExport');
      const result = await exportTimingSheet(model, branding, mode, win);
      if (requested === 'open' && result === 'downloaded') {
        toast(canPreview ? 'Le navigateur a bloqué l’aperçu : la fiche a été téléchargée.' : 'Cet appareil n’affiche pas les PDF dans le navigateur : la fiche a été téléchargée. Ouvrez-la depuis vos téléchargements pour l’imprimer.');
      }
    } catch (error) {
      win?.close();
      console.error('Error building timing sheet:', error);
      toast.error('Impossible de générer la fiche de timing');
    } finally {
      setBusy(null);
    }
  };

  const moments = content.moments ?? [];
  const textField = (key: FicheTextKey, label: string, options: { placeholder?: string; hint?: string; rows?: number; value?: string; long?: LongText } = {}) => {
    const id = `fiche-${key}`;
    const value = options.value ?? content[key] ?? '';
    const tooLong = !!options.long && value.length > options.long.after;
    return (
      <div key={key}>
        <label htmlFor={id} className={labelCls}>{label}</label>
        {options.rows ? (
          <textarea id={id} rows={options.rows} value={value} placeholder={options.placeholder} onChange={(e) => onField(key, e.target.value)} className={inputCls} />
        ) : (
          <input id={id} type="text" value={value} placeholder={options.placeholder} onChange={(e) => onField(key, e.target.value)} className={inputCls} />
        )}
        {options.hint && <p className="mt-1 text-xs text-gray-400">{options.hint}</p>}
        {tooLong && <p className="mt-1 text-xs text-amber-700">{options.long?.message}</p>}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Fiche de timing imprimable"
        subtitle={canEdit ? 'Le déroulé du culte au format papier (PDF) : moments, annonces, verset… Le conducteur ci-dessus en fait le cœur.' : 'Le déroulé du culte au format papier (PDF).'}
      />
      <div className="px-4 pb-4 space-y-4">
        {canEdit && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {textField('ficheTitle', 'Titre de la fiche', {
                value: content.ficheTitle ?? defaults.ficheTitle ?? churchName,
                hint: 'En haut de la page, à côté du logo. Laissez vide pour reprendre le titre habituel.',
                long: LONG.title,
              })}
              {textField('preacher', 'Prédicateur', { placeholder: 'Pasteur Prénom NOM', hint: 'Sous la bannière du culte.', long: LONG.preacher })}
              {textField('leader', 'Dirigeant du culte', { placeholder: 'Prénom NOM', long: LONG.leader })}
              {textField('communionLeads', 'Responsables de la Sainte Cène', {
                placeholder: 'Respo. Prénom NOM – Respo. Prénom NOM',
                hint: 'Laissez vide s’il n’y a pas de Sainte Cène.',
                long: LONG.communion,
              })}
            </div>

            <div>
              <p className={labelCls}>Moments du culte</p>
              <MomentsEditor moments={moments} rows={rows} onChange={onMoments} />
              <p className="mt-1 text-xs text-gray-400">Ex. « Moment 1 : Contemplation », « Moment 2 : Célébration ». Chaque moment regroupe les séquences du conducteur à partir de son heure.</p>
            </div>

            {textField('pastorAnnouncements', 'Annonces du pasteur', { rows: 6, hint: ANNOUNCEMENT_HINT })}
            {textField('leaderAnnouncements', 'Annonces du dirigeant', { rows: 3, hint: ANNOUNCEMENT_HINT })}
            {textField('verse', 'Verset du culte', {
              rows: 2,
              placeholder: 'Texte du verset. Philippiens 3 : 3',
              hint: 'En bas de la page ; la référence en fin de texte s’affiche en vert.',
              long: LONG.verse,
            })}
            {textField('footerNote', 'Note en bas de page (NB)', {
              value: content.footerNote ?? defaults.footerNote ?? '',
              placeholder: 'Merci de ne pas laisser traîner les fiches de timing après les cultes',
              hint: '« NB : » est ajouté devant. Effacez le texte pour ne rien afficher.',
              long: LONG.note,
            })}
            <p className="text-xs text-gray-400">Les émojis et symboles spéciaux ne s’impriment pas.</p>
          </>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <button type="button" onClick={() => generate('download')} disabled={busy !== null} className={primaryBtn}>
            <Download className="w-4 h-4" /> {busy === 'download' ? 'Préparation…' : 'Télécharger le PDF'}
          </button>
          <button type="button" onClick={() => generate('open')} disabled={busy !== null} className={secondaryBtn}>
            <Printer className="w-4 h-4" /> {busy === 'open' ? 'Préparation…' : 'Aperçu et impression'}
          </button>
          {dirty && canEdit && <p className="text-xs text-gray-500">Le PDF inclut les modifications non enregistrées.</p>}
        </div>
      </div>
    </Card>
  );
}
