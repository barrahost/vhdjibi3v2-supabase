import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function DownloadTemplateButton() {
  const handleDownload = () => {
    const headers = [
      'Nom et Prénoms *',
      'Surnom',
      'Genre *  (M / F)',
      'Téléphone',
      "Lieu d'habitation *",
      "Date d'évangélisation *",
      "Lieu d'évangélisation",
      'Commentaires',
      'Communauté fréquentée',
      "A donné sa vie à Jésus  (Oui / Non / Pas encore)",
      'Culte envisagé  (Culte du Mercredi Soir - 19h / 1er Culte du Dimanche - 7h / 2e Culte du Dimanche - 10h / Pas encore décidé)',
      'Sujets de prière',
      "Étudiant ayant conduit l'entretien",
      'Évangéliste (Nom ou prénom — optionnel)',
    ];

    const instructions = [
      "Colonnes * obligatoires. Genre : M ou F. Date : JJ/MM/AAAA. Ne pas modifier les en-têtes ni l'ordre. Colonne Évangéliste : saisir le nom ou le prénom tel qu'il apparaît dans l'application (ex: YAO ou FIDELE pour YAO FIDELE).",
      ...Array(13).fill(''),
    ];

    const example = [
      'Koné Aminata',
      'Ami',
      'F',
      '0708123456',
      'Cocody Angré',
      '02/05/2026',
      'Campus FHB',
      "Intéressée par l'académie",
      'Catholique',
      'Oui',
      '1er Culte du Dimanche - 7h',
      'Sa famille, ses études',
      'Jean Dupont',
      'FIDELE',
    ];

    const ws = XLSX.utils.aoa_to_sheet([instructions, headers, example]);
    ws['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 18 },
      { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 35 },
      { wch: 22 }, { wch: 28 }, { wch: 48 },
      { wch: 30 }, { wch: 26 }, { wch: 28 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Âmes Évangélisées');
    XLSX.writeFile(wb, 'template-import-ames-evangelisees.xlsx');
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex items-center px-3 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
      title="Télécharger le modèle Excel à remplir"
    >
      <Download className="w-4 h-4 mr-1.5" />
      Modèle Excel
    </button>
  );
}
