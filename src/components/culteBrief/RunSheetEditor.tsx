import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2, Video } from 'lucide-react';
import { GUIDE_RUN_SHEET } from '../../data/culteGuide';
import { fromMinutes, toMinutes } from '../../lib/culteTiming';
import type { RunSheetInput } from '../../services/culteBrief.service';
import { inputBaseCls, inputCls, secondaryBtn } from './ui';

export interface RunSheetRow extends RunSheetInput {
  /** Clé locale stable (les nouvelles séquences n'ont pas encore d'id). */
  key: string;
}

let rowCounter = 0;
export const newRowKey = () => `row-${Date.now()}-${rowCounter++}`;

interface RunSheetEditorProps {
  rows: RunSheetRow[];
  onChange: (rows: RunSheetRow[]) => void;
  departmentNames: string[];
  /** Heure de début du culte : sert de point de départ au modèle du guide. */
  eventStart: string | null;
}

const summaryOf = (row: RunSheetRow) =>
  [row.departmentName, row.responsibleName, row.support, row.durationMin ? `${row.durationMin} min` : null, row.needsRegie ? 'Régie' : null]
    .filter(Boolean)
    .join(' · ');

export function RunSheetEditor({ rows, onChange, departmentNames, eventStart }: RunSheetEditorProps) {
  // Détails (département, responsable, support…) repliés par défaut : le conducteur reste lisible sur mobile.
  // Une séquence qui vient d'être ajoutée (sans titre) s'ouvre d'elle-même.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const isOpen = (row: RunSheetRow) => expanded[row.key] ?? !row.title;

  const update = (key: string, patch: Partial<RunSheetInput>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addRow = () => onChange([...rows, { key: newRowKey(), title: '', needsRegie: false }]);

  /** Place les séquences types à la suite, en enchaînant les horaires à partir du début du culte. */
  const addGuideTemplate = () => {
    let cursor = toMinutes(eventStart);
    const added: RunSheetRow[] = GUIDE_RUN_SHEET.map((step) => {
      const startTime = cursor !== null ? fromMinutes(cursor) : null;
      if (cursor !== null && step.durationMin) cursor += step.durationMin;
      return {
        key: newRowKey(),
        title: step.title,
        support: step.support ?? null,
        needsRegie: !!step.needsRegie,
        durationMin: step.durationMin ?? null,
        startTime,
      };
    });
    onChange([...rows, ...added]);
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center space-y-2">
          <p>Aucune séquence pour l'instant.</p>
          <button type="button" onClick={addGuideTemplate} className="text-[#00665C] font-medium hover:underline">
            Partir du déroulé type du guide
          </button>
        </div>
      )}

      {rows.map((row, index) => {
        const open = isOpen(row);
        return (
          <div key={row.key} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Séquence {index + 1}</span>
              <div className="flex">
                <button
                  type="button"
                  aria-label={open ? 'Masquer les détails' : 'Afficher les détails'}
                  aria-expanded={open}
                  onClick={() => setExpanded((prev) => ({ ...prev, [row.key]: !open }))}
                  className="p-1.5 text-gray-400 hover:text-gray-700"
                >
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button type="button" aria-label="Monter" onClick={() => move(index, -1)} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Descendre" onClick={() => move(index, 1)} disabled={index === rows.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Supprimer la séquence" onClick={() => onChange(rows.filter((r) => r.key !== row.key))} className="p-1.5 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="time"
                aria-label="Heure"
                value={row.startTime ?? ''}
                onChange={(e) => update(row.key, { startTime: e.target.value || null })}
                className={`${inputBaseCls} w-32 flex-shrink-0`}
              />
              <input
                type="text"
                aria-label="Séquence"
                value={row.title}
                placeholder="Séquence (ex. Louange)"
                onChange={(e) => update(row.key, { title: e.target.value })}
                className={`${inputBaseCls} min-w-0 flex-1 font-medium`}
              />
            </div>

            {open ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    aria-label="Département"
                    value={row.departmentName ?? ''}
                    onChange={(e) => update(row.key, { departmentName: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">Département…</option>
                    {departmentNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {row.departmentName && !departmentNames.includes(row.departmentName) && <option value={row.departmentName}>{row.departmentName}</option>}
                  </select>
                  <input
                    type="text"
                    aria-label="Responsable"
                    value={row.responsibleName ?? ''}
                    placeholder="Responsable"
                    onChange={(e) => update(row.key, { responsibleName: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Support"
                    value={row.support ?? ''}
                    placeholder="Support (fiches, visuel…)"
                    onChange={(e) => update(row.key, { support: e.target.value })}
                    className={`${inputBaseCls} min-w-0 flex-1`}
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="Durée en minutes"
                    value={row.durationMin ?? ''}
                    placeholder="min"
                    onChange={(e) => update(row.key, { durationMin: e.target.value === '' ? null : Number(e.target.value) })}
                    className={`${inputBaseCls} w-16 flex-shrink-0`}
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap flex-shrink-0" title="La régie intervient sur cette séquence">
                    <input
                      type="checkbox"
                      checked={!!row.needsRegie}
                      onChange={(e) => update(row.key, { needsRegie: e.target.checked })}
                      className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                    />
                    <Video className="w-3.5 h-3.5" /> Régie
                  </label>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">{summaryOf(row) || 'Aucun détail — touchez la flèche pour en ajouter'}</p>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className={secondaryBtn}>
          <Plus className="w-4 h-4" /> Ajouter une séquence
        </button>
        {rows.length > 0 && (
          <button type="button" onClick={addGuideTemplate} className="text-xs text-gray-500 hover:text-[#00665C] px-2">
            + Ajouter le déroulé type du guide
          </button>
        )}
      </div>
    </div>
  );
}
