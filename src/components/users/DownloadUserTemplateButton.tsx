import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function DownloadUserTemplateButton() {
  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    // En-têtes
    const headers = [
      'Nom et Prénoms *',
      'Téléphone * (ex: 0757000203)',
      'Email (optionnel)',
      'Profil * (voir liste)',
      'Surnom (optionnel)',
    ];

    // Ligne d'exemple
    const example = [
      'KOUASSI Jean',
      '0757000203',
      'jean.kouassi@example.com',
      'shepherd',
      'JK',
    ];

    // Feuille principale
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws['!cols'] = [
      { wch: 28 }, // Nom
      { wch: 28 }, // Téléphone
      { wch: 30 }, // Email
      { wch: 22 }, // Profil
      { wch: 18 }, // Surnom
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');

    // Feuille des profils disponibles
    const profilesData = [
      ['Valeur à saisir', 'Libellé affiché'],
      ['admin',            'Administrateur'],
      ['adn',              'ADN'],
      ['shepherd',         'Berger(e)'],
      ['department_leader','Responsable de Département'],
      ['family_leader',    'Responsable de Famille'],
      ['evangelist',       'Évangéliste'],
    ];
    const wsProfiles = XLSX.utils.aoa_to_sheet(profilesData);
    wsProfiles['!cols'] = [{ wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsProfiles, 'Profils disponibles');

    XLSX.writeFile(wb, 'modele_import_utilisateurs.xlsx');
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center px-3 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
      title="Télécharger le modèle Excel"
    >
      <Download className="w-4 h-4 mr-1.5" />
      Modèle Excel
    </button>
  );
}
