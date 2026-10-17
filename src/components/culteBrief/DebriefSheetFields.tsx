import { DEBRIEF_SHEET_FIELDS } from '../../data/culteGuide';
import type { DebriefSheetValues } from '../../services/culteDebrief.service';
import { inputCls, labelCls } from './ui';

interface DebriefSheetFieldsProps {
  values: DebriefSheetValues;
  onChange: (values: DebriefSheetValues) => void;
  readOnly?: boolean;
  idPrefix?: string;
}

/** Les champs de la fiche de débrief d'un département (points positifs, difficultés, causes, besoins, solutions). */
export function DebriefSheetFields({ values, onChange, readOnly, idPrefix = 'debrief' }: DebriefSheetFieldsProps) {
  return (
    <div className="space-y-3">
      {DEBRIEF_SHEET_FIELDS.map((field) => {
        const text = values[field.key];
        if (readOnly && !text.trim()) return null;
        return (
          <div key={field.key}>
            <label htmlFor={`${idPrefix}-${field.key}`} className={labelCls}>{field.label}</label>
            {readOnly ? (
              <p className="text-sm text-gray-800 whitespace-pre-line">{text}</p>
            ) : (
              <>
                <textarea
                  id={`${idPrefix}-${field.key}`}
                  rows={field.rows}
                  value={text}
                  onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
                  className={inputCls}
                />
                {'hint' in field && field.hint && <p className="mt-1 text-xs text-gray-400">{field.hint}</p>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
