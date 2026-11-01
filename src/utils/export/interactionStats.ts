import * as XLSX from 'xlsx';
import { formatDateForExcel } from '../dateUtils';
import type { FamilyRow, ForgottenSoul, Period, ShepherdRow } from '../../lib/interactionStats';
import { FORGOTTEN_AFTER_DAYS } from '../../lib/interactionStats';

const pct = (v: number | null) => (v === null ? '' : `${Math.round(v * 100)} %`);
const phone = (p?: string) => p?.replace('+225', '') || '';

/** Classement des bergers, âmes oubliées et familles, en un classeur Excel (une feuille chacun). */
export function exportInteractionStats(params: {
  period: Period;
  shepherds: ShepherdRow[];
  forgotten: ForgottenSoul[];
  families: FamilyRow[];
  filename?: string;
}): void {
  const { period, shepherds, forgotten, families } = params;
  const lastDay = new Date(period.to.getTime() - 86_400_000);
  const periodLabel = `${formatDateForExcel(period.from)} au ${formatDateForExcel(lastDay)}`;
  const wb = XLSX.utils.book_new();

  const shepherdSheet = XLSX.utils.json_to_sheet(
    shepherds.map((r) => ({
      'Berger(e)': r.shepherd.fullName,
      'Téléphone': phone(r.shepherd.phone),
      'Âmes suivies': r.soulsFollowed,
      'Interactions': r.interactions,
      'Âmes contactées': r.soulsContacted,
      'Couverture': pct(r.coverage),
      'Dernier contact': r.lastContact ? formatDateForExcel(r.lastContact) : '',
      'Période': periodLabel,
    })),
  );
  shepherdSheet['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 11 }, { wch: 15 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, shepherdSheet, 'Bergers');

  const forgottenSheet = XLSX.utils.json_to_sheet(
    forgotten.map((f) => ({
      'Âme': f.soul.fullName,
      'Téléphone': phone(f.soul.phone),
      'Berger(e)': f.shepherdName,
      'Famille': f.familyName,
      'Dernier contact': f.lastContact ? formatDateForExcel(f.lastContact) : 'Aucun contact enregistré',
      'Jours sans contact': f.daysSince ?? '',
    })),
  );
  forgottenSheet['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, forgottenSheet, `Sans contact ${FORGOTTEN_AFTER_DAYS} j`);

  if (families.length) {
    const familySheet = XLSX.utils.json_to_sheet(
      families.map((r) => ({
        'Famille': r.family.name,
        'Âmes suivies': r.soulsFollowed,
        'Interactions': r.interactions,
        'Âmes contactées': r.soulsContacted,
        'Couverture': pct(r.coverage),
      })),
    );
    familySheet['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 11 }];
    XLSX.utils.book_append_sheet(wb, familySheet, 'Familles');
  }

  const defaultFilename = `statistiques-interactions-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
  XLSX.writeFile(wb, `${params.filename || defaultFilename}.xlsx`);
}
