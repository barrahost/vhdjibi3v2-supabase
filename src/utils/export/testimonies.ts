import * as XLSX from 'xlsx';
import { Testimony, TESTIMONY_STATUS_LABELS, formatDuration } from '../../services/testimony.service';
import { formatDateForExcel } from '../dateUtils';

export function exportTestimonies(testimonies: Testimony[], filename?: string): void {
  const rows = testimonies.map(t => ({
    'Catégorie': t.category,
    'Témoignage (écrit)': t.content || '',
    'Audio': t.audioUrl || '',
    'Durée audio': formatDuration(t.audioDuration),
    'Accord de partage': t.shareConsent ? 'Oui' : 'Non',
    'Statut': TESTIMONY_STATUS_LABELS[t.status] ?? t.status,
    'Nom': t.fullName || 'Anonyme',
    'Téléphone': t.phone?.replace('+225', '') || '',
    'Déposé le': formatDateForExcel(t.submittedAt),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 20 }, // Catégorie
    { wch: 60 }, // Témoignage
    { wch: 40 }, // Audio
    { wch: 12 }, // Durée
    { wch: 10 }, // Accord
    { wch: 12 }, // Statut
    { wch: 25 }, // Nom
    { wch: 15 }, // Téléphone
    { wch: 12 }, // Déposé le
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Témoignages');

  const defaultFilename = `temoignages-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
  XLSX.writeFile(wb, `${filename || defaultFilename}.xlsx`);
}
