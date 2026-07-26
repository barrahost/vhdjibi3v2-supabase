import * as XLSX from 'xlsx';
import { CulteReport, CULTE_REPORT_TYPE_LABELS } from '../../types/culteReport.types';
import { formatDateForExcel } from '../dateUtils';

export function exportCulteReports(reports: CulteReport[], filename?: string) {
  const rows = reports.map((r) => ({
    Date: formatDateForExcel(r.serviceDate),
    Département: r.departmentName,
    Type: CULTE_REPORT_TYPE_LABELS[r.reportType],
    'Soumis par': r.submittedByName,
    Notes: r.notes || '',
    Détails: JSON.stringify(r.data),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 25 }, // Département
    { wch: 25 }, // Type
    { wch: 25 }, // Soumis par
    { wch: 40 }, // Notes
    { wch: 60 }, // Détails
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Rapports de culte');

  const defaultFilename = `rapports-culte-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
  XLSX.writeFile(wb, `${filename || defaultFilename}.xlsx`);
}
