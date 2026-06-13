// Titre de page derive du pathname, affiche dans le Header (desktop + mobile).
// Couvre les alias FR/EN definis dans App.tsx.
const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/ames': 'Âmes',
  '/souls': 'Âmes',
  '/ames-indecises': 'Âmes indécises',
  '/undecided-souls': 'Âmes indécises',
  '/ames-evangelisees': 'Âmes évangélisées',
  '/evangelized-souls': 'Âmes évangélisées',
  '/interactions': 'Interactions',
  '/assigned-souls': 'Mes âmes assignées',
  '/ames-assignees': 'Mes âmes assignées',
  '/presences': 'Présences',
  '/attendance': 'Présences',
  '/historique-presences': 'Historique des présences',
  '/statistiques': 'Statistiques',
  '/rappels': 'Rappels',
  '/rappels-bergers': 'Rappels des bergers',
  '/shepherd-reminders': 'Rappels des bergers',
  '/departements': 'Départements',
  '/serviteurs': 'Serviteurs',
  '/familles': 'Familles de service',
  '/spiritual-progression': 'Progression spirituelle',
  '/birthdays': 'Anniversaires',
  '/anniversaires': 'Anniversaires',
  '/carte': 'Carte des âmes',
  '/soul-map': 'Carte des âmes',
  '/sms': 'SMS',
  '/modeles-sms': 'Modèles SMS',
  '/parametres': 'Paramètres',
  '/audio': 'Gestion audio',
  '/users': 'Utilisateurs',
  '/bug-reports': 'Signalements de bugs',
  '/churches': 'Gestion des Églises',
  '/replay': 'Replay des enseignements',
};

export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? '';
}
