import * as XLSX from 'xlsx';
import { PrayerRequest } from '../../services/prayerRequest.service';
import { formatDateForExcel } from '../dateUtils';

const STATUS_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  exauce: 'Exaucé',
};

export function exportPrayerRequests(requests: PrayerRequest[], filename?: string): void {
  const rows = requests.map(r => ({
    'Catégorie': r.category,
    'Sujet': r.subject,
    'Statut': STATUS_LABELS[r.status] ?? r.status,
    'Nom': r.fullName || 'Anonyme',
    'Téléphone': r.phone?.replace('+225', '') || '',
    'Soumis le': formatDateForExcel(r.submittedAt),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, // Catégorie
    { wch: 50 }, // Sujet
    { wch: 12 }, // Statut
    { wch: 25 }, // Nom
    { wch: 15 }, // Téléphone
    { wch: 15 }, // Soumis le
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Sujets de prière');

  const defaultFilename = `sujets-de-priere-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
  XLSX.writeFile(wb, `${filename || defaultFilename}.xlsx`);
}
