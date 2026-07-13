import * as XLSX from 'xlsx';
import { PrayerRequest } from '../../services/prayerRequest.service';
import { formatDateForExcel } from '../dateUtils';

export function exportPrayerRequests(requests: PrayerRequest[], filename?: string): void {
  const rows = requests.map(r => ({
    'Catégorie': r.category,
    'Sujet': r.subject,
    'Soumis le': formatDateForExcel(r.submittedAt),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, // Catégorie
    { wch: 50 }, // Sujet
    { wch: 15 }, // Soumis le
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Sujets de prière');

  const defaultFilename = `sujets-de-priere-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
  XLSX.writeFile(wb, `${filename || defaultFilename}.xlsx`);
}
