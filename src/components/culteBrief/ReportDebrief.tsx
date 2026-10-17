import { useCallback, useEffect, useState } from 'react';
import { useCulteModule } from '../../hooks/useCulteModule';
import { CulteActionService } from '../../services/culteAction.service';
import {
  blankDebriefSheet,
  CulteDebriefService,
  debriefToNotes,
  isDebriefSheetEmpty,
  type DebriefSheetValues,
} from '../../services/culteDebrief.service';
import { DebriefSheetFields } from './DebriefSheetFields';

/**
 * Fiche de débrief du département, intégrée au formulaire de rapport de culte : quand le module
 * « Cultes » est actif, elle remplace les anciens champs « Notes » et « Besoins à signaler ».
 * Les besoins deviennent des actions du plan, la fiche est visible dans l'onglet Débrief du culte.
 */
export function useReportDebrief(eventId: string | null, departmentName: string) {
  const { enabled } = useCulteModule();
  const [values, setValues] = useState<DebriefSheetValues>(blankDebriefSheet());
  const [preloaded, setPreloaded] = useState(false);
  // Besoins déjà enregistrés dans la fiche : seuls les ajouts deviennent de nouvelles actions du plan
  const [savedNeeds, setSavedNeeds] = useState('');

  // Une fiche déjà commencée depuis l'onglet Débrief du culte est reprise, pas écrasée
  useEffect(() => {
    if (!enabled || !eventId) {
      setValues(blankDebriefSheet());
      setPreloaded(false);
      setSavedNeeds('');
      return;
    }
    let cancelled = false;
    CulteDebriefService.list(eventId)
      .then((sheets) => {
        if (cancelled) return;
        const mine = sheets.find((s) => s.departmentName === departmentName);
        setPreloaded(!!mine);
        setSavedNeeds(mine?.needs ?? '');
        setValues(
          mine
            ? { positives: mine.positives, difficulties: mine.difficulties, causes: mine.causes, needs: mine.needs, solutions: mine.solutions }
            : blankDebriefSheet()
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, eventId, departmentName]);

  const reset = useCallback(() => {
    setValues(blankDebriefSheet());
    setPreloaded(false);
    setSavedNeeds('');
  }, []);

  /** À appeler une fois le rapport enregistré : fiche + actions issues des besoins. */
  const persist = useCallback(
    async (params: { eventId: string; reportId: string | null; departmentId: string | null; actor: { id: string | null; name: string } }) => {
      if (isDebriefSheetEmpty(values)) return { actions: 0 };
      await CulteDebriefService.save(params.eventId, { id: params.departmentId, name: departmentName }, values, params.actor);
      const actions = await CulteActionService.createNeedsFromLines(
        { eventId: params.eventId, reportId: params.reportId, departmentName, text: values.needs, previousText: savedNeeds, source: 'debrief' },
        params.actor
      );
      setSavedNeeds(values.needs);
      return { actions };
    },
    [values, departmentName, savedNeeds]
  );

  return { enabled, values, setValues, preloaded, notes: debriefToNotes(values), reset, persist };
}

interface ReportDebriefSectionProps {
  values: DebriefSheetValues;
  onChange: (values: DebriefSheetValues) => void;
  preloaded: boolean;
}

export function ReportDebriefSection({ values, onChange, preloaded }: ReportDebriefSectionProps) {
  return (
    <fieldset className="rounded-lg border border-[#00665C]/25 bg-[#00665C]/5 p-4 space-y-3">
      <legend className="px-2 text-sm font-semibold text-[#00665C]">Débrief de votre département</legend>
      <p className="text-xs text-gray-600">
        Ce qui a bien marché, ce qui a posé problème et pourquoi. Chaque besoin saisi devient une action du plan, suivie jusqu'au prochain culte.
        {preloaded && <span className="block mt-1 font-medium text-[#00665C]">Une fiche était déjà commencée pour ce culte : elle est reprise ci-dessous.</span>}
      </p>
      <DebriefSheetFields values={values} onChange={onChange} idPrefix="report-debrief" />
    </fieldset>
  );
}
