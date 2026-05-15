import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Soul, Shepherd } from '../types/database.types';
import { formatDateForExcel } from './dateUtils';
import { formatGender } from './formatting/genderFormat';
import { getShepherdNames } from './export/shepherdNames';

// Types pour les exports
type ExportFormat = 'pdf' | 'xlsx';
type ExportType = 'souls' | 'shepherds';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  data: Soul[] | Shepherd[];
  filename?: string;
}

export async function exportData({ format, type, data, filename }: ExportOptions) {
  try {
    // Récupérer les noms des bergers si nécessaire
    const shepherdNames = type === 'souls' ? await getShepherdNames(data as Soul[]) : {};

    // Préparer les données pour l'export
    const exportData = type === 'shepherds'
      ? (data as Shepherd[]).map(shepherd => ({
          'Nom et Prénoms': shepherd.fullName,
          'Téléphone': shepherd.phone?.replace('+225', ''),
          'Email': shepherd.email,
          'Statut': (shepherd as any).status === 'active' ? 'Actif' : 'Inactif'
        }))
      : (data as Soul[]).map(soul => ({
          'Nom et Prénoms': soul.fullName,
          'Surnom': soul.nickname || '',
          'Genre': formatGender(soul.gender),
          'Téléphone': soul.phone?.replace('+225', ''),
          'Lieu d\'habitation': soul.location,
          'Date de première visite': formatDateForExcel(soul.firstVisitDate),
          'Berger(e)': soul.shepherdId ? shepherdNames[soul.shepherdId] || 'Non trouvé' : 'Non assigné(e)',
          'Né(e) de nouveau': soul.spiritualProfile.isBornAgain ? 'Oui' : 'Non',
          'Baptisé(e)': soul.spiritualProfile.isBaptized ? 'Oui' : 'Non',
          'Académie VDH': soul.spiritualProfile.isEnrolledInAcademy ? 'Oui' : 'Non',
          'École PDV': soul.spiritualProfile.isEnrolledInLifeBearers ? 'Oui' : 'Non',
          'Départements': soul.spiritualProfile.departments?.map(d => d.name).join(', ') || ''
        }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Créer la feuille avec les données
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Définir la largeur des colonnes
    const colWidths = type === 'shepherds'
      ? [
          { wch: 30 }, // Nom et Prénoms
          { wch: 15 }, // Téléphone
          { wch: 30 }, // Email
          { wch: 10 }  // Statut
        ]
      : [
          { wch: 30 }, // Nom et Prénoms
          { wch: 15 }, // Surnom
          { wch: 10 }, // Genre
          { wch: 15 }, // Téléphone
          { wch: 20 }, // Lieu d'habitation
          { wch: 15 }, // Date de première visite
          { wch: 25 }, // Berger(e)
          { wch: 15 }, // Né(e) de nouveau
          { wch: 15 }, // Baptisé(e)
          { wch: 15 }, // Académie VDH
          { wch: 15 }, // École PDV
          { wch: 30 }  // Départements
        ];

    ws['!cols'] = colWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, type === 'shepherds' ? 'Berger(e)s' : 'Âmes');

    // Générer le nom du fichier
    const defaultFilename = `${type}-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
    const finalFilename = filename || defaultFilename;

    // Sauvegarder le fichier
    XLSX.writeFile(wb, `${finalFilename}.xlsx`);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Erreur lors de l\'export des données');
  }
}